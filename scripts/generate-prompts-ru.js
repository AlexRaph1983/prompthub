/**
 * Генератор RU-промптов (500–1000 символов) в существующие категории PromptHub.
 * Квоты считаются из БД по просмотрам (ViewsService-like priorities), чтобы масштабировать контент по реальному спросу.
 *
 * ВАЖНО: генератор ничего не пишет в БД. Он только создаёт JSON-файл для последующего безопасного импорта.
 *
 * Запуск:
 *   node scripts/generate-prompts-ru.js --count=300 --out=data/generated_prompts_ru_300.json
 *
 * Опции:
 *   --count=300              сколько промптов сгенерировать
 *   --out=path.json          куда сохранить файл
 *   --seed=number            seed для воспроизводимости (по умолчанию Date.now())
 *   --quotaMode=views        только по просмотрам (по умолчанию)
 *   --quotaMode=views+prior  сглаживание (Dirichlet prior): (views + alpha) / (totalViews + alpha*K)
 *   --alpha=number           alpha для views+prior (по умолчанию 5)
 *
 * Формат выходного JSON:
 * {
 *   version: "1.0",
 *   generatedAt: "...",
 *   seed: 123,
 *   quotaMode: "...",
 *   items: [{
 *     title, description, prompt, model, lang, categorySlug, tags: string[], license
 *   }]
 * }
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PROMPT_MODELS = [
  'GPT-5',
  'OpenAI Sora',
  'Claude Opus 4.1',
  'Gemini 2.5 Pro',
  'Gemini 2.5 Flash',
  'Gemini 2.5 Flash-Lite',
  'Google Veo 3',
  'Llama 3.1',
  'Mistral Large',
  'DeepSeek',
  'Suno',
  'AIVA',
  'Runway Gen-2',
  'Яндекс Алиса'
]

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    count: 300,
    outFile: path.join('data', 'generated_prompts_ru_300.json'),
    seed: Date.now(),
    quotaMode: 'views',
    alpha: 5
  }
  for (const a of args) {
    if (a.startsWith('--count=')) out.count = Math.max(0, parseInt(a.slice(8), 10) || 0)
    else if (a.startsWith('--out=')) out.outFile = a.slice(6)
    else if (a.startsWith('--seed=')) out.seed = parseInt(a.slice(7), 10) || out.seed
    else if (a.startsWith('--quotaMode=')) out.quotaMode = a.slice('--quotaMode='.length)
    else if (a.startsWith('--alpha=')) out.alpha = Math.max(0, Number(a.slice('--alpha='.length)) || 0)
  }
  return out
}

// Простая воспроизводимая RNG (LCG)
function makeRng(seed) {
  let s = (seed >>> 0) || 1
  return () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function countChars(s) {
  // По требованию: 500–1000 символов. Считаем по JS length (UTF-16), достаточно близко для русского.
  return (s || '').length
}

function clampPromptText(text, { min = 500, max = 1000 } = {}) {
  let t = (text || '').trim()
  if (countChars(t) < min) {
    const add = [
      '',
      'Требования к ответу:',
      '- Дай структурированный результат с подзаголовками.',
      '- Если данных не хватает — задай до 7 уточняющих вопросов и предложи 2–3 варианта допущений.',
      '- Для каждого пункта добавь краткое обоснование и чек‑лист проверки качества.',
      '',
      'Формат вывода:',
      '1) Короткое резюме (3–5 строк)',
      '2) Основной результат',
      '3) Риски/ограничения и как их проверить',
      '4) Следующие шаги (до 10)'
    ].join('\n')
    t = `${t}\n\n${add}`.trim()
  }
  if (countChars(t) > max) {
    t = t.slice(0, max - 1).trimEnd() + '…'
  }
  if (countChars(t) < min) {
    // fallback: добиваем ещё чуть-чуть, но без «воды»
    t = `${t}\n\nДобавь примеры 2–3 входных данных и покажи короткий пример заполненного результата.`.trim()
    if (countChars(t) > max) t = t.slice(0, max - 1).trimEnd() + '…'
  }
  return t
}

function buildDescriptionFromPrompt(promptText) {
  const firstLine = (promptText || '').split('\n').find((l) => l.trim()) || ''
  const trimmed = firstLine.replace(/\s+/g, ' ').trim()
  if (trimmed.length >= 80) return trimmed.slice(0, 140).trimEnd()
  // если первая строка короткая — берём кусок из начала
  const head = (promptText || '').replace(/\s+/g, ' ').trim().slice(0, 180)
  return head.length > 0 ? head : 'Профессиональный прикладной промпт для решения задачи.'
}

function allocateByShares(total, shares) {
  const raw = shares.map((s) => ({ ...s, raw: s.share * total }))
  const base = raw.map((s) => ({ ...s, n: Math.floor(s.raw), frac: s.raw - Math.floor(s.raw) }))
  let remaining = total - base.reduce((sum, s) => sum + s.n, 0)
  base.sort((a, b) => b.frac - a.frac)
  for (let i = 0; i < base.length && remaining > 0; i++) {
    base[i].n += 1
    remaining -= 1
  }
  const map = new Map(base.map((b) => [b.key, b.n]))
  return shares.map((s) => ({ key: s.key, n: map.get(s.key) || 0 }))
}

async function computeResolvedViewsByPrompt(promptIds) {
  const [viewAnalyticsAgg, viewEventsAgg, interactionsAgg, prompts] = await Promise.all([
    prisma.viewAnalytics
      .groupBy({ by: ['promptId'], _sum: { countedViews: true }, where: { promptId: { in: promptIds } } })
      .catch(() => []),
    prisma.promptViewEvent
      .groupBy({
        by: ['promptId'],
        where: { isCounted: true, promptId: { in: promptIds } },
        _count: { _all: true }
      })
      .catch(() => []),
    prisma.promptInteraction
      .groupBy({
        by: ['promptId'],
        where: { type: 'view', promptId: { in: promptIds } },
        _count: { _all: true }
      })
      .catch(() => []),
    prisma.prompt.findMany({ where: { id: { in: promptIds } }, select: { id: true, views: true } })
  ])

  const analyticsByPrompt = new Map(
    (viewAnalyticsAgg || []).map((r) => [r.promptId, Number(r._sum?.countedViews || 0)])
  )
  const eventsByPrompt = new Map((viewEventsAgg || []).map((r) => [r.promptId, Number(r._count?._all || 0)]))
  const interactionsByPrompt = new Map(
    (interactionsAgg || []).map((r) => [r.promptId, Number(r._count?._all || 0)])
  )
  const promptViewsByPrompt = new Map(prompts.map((p) => [p.id, Number(p.views || 0)]))

  const out = new Map()
  for (const id of promptIds) {
    const a = analyticsByPrompt.get(id) || 0
    const e = eventsByPrompt.get(id) || 0
    const v = promptViewsByPrompt.get(id) || 0
    const i = interactionsByPrompt.get(id) || 0
    out.set(id, a > 0 ? a : e > 0 ? e : v > 0 ? v : i)
  }
  return out
}

function modelForCategorySlug(slug) {
  // Лёгкая «семантическая привязка» к модели — без жёстких зависимостей.
  switch (slug) {
    case 'music':
      return 'Suno'
    case 'audio':
      return 'AIVA'
    case 'video':
      return 'Runway Gen-2'
    default:
      return 'GPT-5'
  }
}

function buildCatalog() {
  // Набор «смысловых задач» по категориям. Комбинаторика (задача × ниша × формат)
  // даёт много уникальных промптов без копипасты.
  const niches = {
    general: [
      'сервиса доставки',
      'онлайн‑школы',
      'медицинской клиники',
      'юридической фирмы',
      'финтех‑приложения',
      'маркетплейса',
      'B2B SaaS',
      'блогера/эксперта',
      'небольшого кафе',
      'HR‑отдела компании'
    ],
    video: [
      'YouTube‑канала',
      'Reels/Shorts',
      'продуктового лендинга',
      'внутреннего обучения',
      'PR‑кампании',
      'вебинара',
      'интервью',
      'обзора продукта',
      'кейса клиента',
      'соцсетей бренда'
    ]
  }

  const catalog = {
    video: [
      {
        key: 'shotlist',
        title: (n) => `Шот‑лист и план съёмки для ${n}`,
        tags: ['видео', 'шотлист', 'съёмка', 'продакшен'],
        body: (n) => `Ты — режиссёр и продюсер. Составь шот‑лист и план съёмки для видео ${n}.\n\nВходные данные:\n- Цель видео: {цель}\n- Аудитория: {аудитория}\n- Формат: {формат} (Shorts/Reels/YouTube)\n- Длительность: {длительность}\n- Тон: {тон}\n- Обязательные тезисы/оферы: {офферы}\n\nСделай:\n- Таблицу шотов: №, тип (общий/средний/крупный), действие, локация, реквизит, звук/музыка, графика/текст на экране, длительность.\n- Список B‑roll и альтернативных дублей.\n- Риски (свет/шум/логистика) и способы страхования.\n- План монтажа по таймкодам + подсказки по ритму и переходам.\n- Список файлов/ассетов, которые нужно подготовить заранее.\n\nОграничения: без воды, только применимые пункты.`
      },
      {
        key: 'script',
        title: (n) => `Сценарий и дикторский текст для видео ${n}`,
        tags: ['сценарий', 'видео', 'диктор', 'монтаж'],
        body: (n) => `Ты — сценарист и редактор. Напиши сценарий видео ${n}.\n\nВходные данные:\n- Тема: {тема}\n- Ключевая мысль: {главная_мысль}\n- Длительность: {длительность}\n- CTA: {cta}\n- Запрещённые обещания/формулировки: {стоп_слова}\n\nНужно:\n- Хук (первые 2–3 секунды): 3 варианта.\n- Сценарий по сценам: что в кадре + текст диктора/ведущего + текст на экране.\n- Встроить 2 «проверки понимания» (мини‑вопрос или микро‑пример).\n- Список вставок: графики, скринкасты, крупные планы.\n- Версия под A/B‑тест: альтернативный хук и альтернативный CTA.\n\nПиши по‑русски, короткими фразами для речи, без канцелярита.`
      },
      {
        key: 'storyboard',
        title: (n) => `Раскадровка и визуальный стиль для видео ${n}`,
        tags: ['раскадровка', 'визуал', 'стиль', 'motion'],
        body: (n) => `Ты — арт‑директор. Составь раскадровку и стиль‑гайд для видео ${n}.\n\nДано:\n- Платформа: {платформа}\n- Бренд‑атрибуты: {бренд}\n- Настроение: {настроение}\n- Референсы: {референсы}\n\nСделай:\n- 12–18 кадров с описанием композиции, движения камеры, фона, света, эмоций персонажа.\n- Палитра (HEX), типографика (2 семейства), правила титров.\n- Пакет анимаций: 8 шаблонов (въезд, подчёркивание, цифры, чек‑лист, стрелки, callout).\n- Критерии качества: читаемость, темп, удержание внимания.\n\nЕсли референсов нет — предложи 5 подходящих стилей и объясни, почему.`
      }
    ],
    'marketing-writing': [
      {
        key: 'landing',
        title: (n) => `Лендинг: структура и тексты для ${n}`,
        tags: ['лендинг', 'копирайтинг', 'конверсия', 'оффер'],
        body: (n) => `Ты — конверсионный копирайтер. Составь структуру лендинга и тексты для ${n}.\n\nКонтекст:\n- Продукт/услуга: {продукт}\n- Аудитория: {аудитория}\n- Главная боль: {боль}\n- Доказательства (кейсы/цифры): {доказательства}\n- Возражения: {возражения}\n\nНужно:\n- УТП: 5 вариантов + объяснение логики.\n- Структура блоков (10–14): заголовок, подзаголовок, буллеты, CTA.\n- 2 сценария: «быстрое решение» и «глубокий выбор».\n- Микрокопи для формы/кнопок/ошибок.\n- Чек‑лист юридической корректности обещаний.\n\nПиши по‑русски, без клише и «мы — команда профессионалов».`
      }
    ],
    code: [
      {
        key: 'debug',
        title: (n) => `Отладка: найти причину бага в ${n} и предложить фикс`,
        tags: ['код', 'дебаг', 'ошибка', 'рефакторинг'],
        body: (n) => `Ты — senior инженер. Помоги отладить проблему в проекте ${n}.\n\nДано:\n- Стек: {стек}\n- Симптом: {симптом}\n- Ожидаемое поведение: {ожидание}\n- Логи/стектрейс: {логи}\n- Фрагменты кода: {код}\n\nСделай:\n- Гипотезы причин (минимум 5) с вероятностями.\n- План проверки: какие логи добавить, какие тесты написать, какие команды запустить.\n- Предложи 2 варианта фикса: быстрый и правильный.\n- Оцени риски регрессий и предложи регрессионный набор тестов.\n- Если нужен рефакторинг — предложи безопасную последовательность коммитов.\n\nОтвечай конкретно, с дифф‑фрагментами и критериями «готово».`
      }
    ],
    seo: [
      {
        key: 'semantic',
        title: (n) => `SEO: семантика и структура контента для ${n}`,
        tags: ['seo', 'семантика', 'контент', 'структура'],
        body: (n) => `Ты — SEO‑стратег. Составь семантическое ядро и структуру страниц для ${n}.\n\nВходные данные:\n- Ниша: {ниша}\n- Гео: {гео}\n- Услуги/товары: {ассортимент}\n- Конкуренты: {конкуренты}\n\nНужно:\n- Кластеры запросов: транзакционные/информационные/навигационные.\n- Структура сайта: категории/фильтры/лендинги.\n- Для 10 ключевых страниц: Title/H1/Description, интент, план текста, FAQ.\n- Риск каннибализации и как развести запросы.\n- План внутренней перелинковки и анкоры.\n\nНе выдумывай данные о конкурентах: если не хватает — запроси.`
      }
    ],
    business: [
      {
        key: 'strategy',
        title: (n) => `Бизнес‑стратегия и план роста для ${n}`,
        tags: ['бизнес', 'стратегия', 'рост', 'юнит-экономика'],
        body: (n) => `Ты — бизнес‑аналитик. Составь стратегию роста для ${n}.\n\nДано:\n- Модель монетизации: {монетизация}\n- Средний чек: {чек}\n- Каналы привлечения: {каналы}\n- Ограничения ресурсов: {ресурсы}\n\nНужно:\n- 3 сценария роста (консервативный/базовый/агрессивный) на 90 дней.\n- KPI‑дерево и метрики (CAC/LTV/retention/конверсия).\n- Риски и «ранние сигналы» провала.\n- План экспериментов (10 идей) с ожидаемым эффектом и сложностью.\n- Таблица приоритизации (ICE/RICE) и итоговый roadmap.\n\nПиши прикладно, с цифрами‑заглушками, которые пользователь сможет подставить.`
      }
    ],
    education: [
      {
        key: 'lesson',
        title: (n) => `Урок: план занятия и задания по теме для ${n}`,
        tags: ['обучение', 'урок', 'задания', 'оценивание'],
        body: (n) => `Ты — методист. Составь план урока для ${n}.\n\nПараметры:\n- Тема: {тема}\n- Уровень: {уровень}\n- Длительность: {длительность}\n- Цели: {цели}\n\nНужно:\n- Структура урока по минутам.\n- 5 заданий разного типа (понимание/применение/анализ).\n- Критерии оценивания и типичные ошибки.\n- Домашнее задание в 2 вариантах.\n- Как адаптировать под онлайн/офлайн.\n\nПиши по‑русски, без «воды», но с конкретными формулировками заданий.`
      }
    ],
    legal: [
      {
        key: 'contract',
        title: (n) => `Юр‑проверка договора для ${n}: риски и правки`,
        tags: ['юристы', 'договор', 'риски', 'правки'],
        body: (n) => `Ты — юрист. Проанализируй договор для ${n}.\n\nВход:\n- Текст договора: {договор}\n- Роль: {роль} (заказчик/исполнитель/поставщик)\n- Юрисдикция: {юрисдикция}\n\nНужно:\n- Список рисков (критичность: high/medium/low) с цитатами из текста.\n- Предложи точечные правки формулировок (как «было» → «стало»).\n- Укажи недостающие разделы и почему они нужны.\n- Чек‑лист согласования (что уточнить у бизнеса).\n\nВажно: если юрисдикция не указана — задай вопросы, не делай вид, что знаешь.`
      }
    ],
    health: [
      {
        key: 'patient-note',
        title: (n) => `Структурировать жалобы и анамнез для ${n}`,
        tags: ['медицина', 'анамнез', 'структура', 'документация'],
        body: (n) => `Ты — медицинский ассистент (обучающий режим, не диагноз). Помоги структурировать данные пациента для ${n}.\n\nВход:\n- Жалобы: {жалобы}\n- Длительность симптомов: {длительность}\n- Анамнез: {анамнез}\n- Лекарства/аллергии: {лекарства}\n- Показатели/анализы: {данные}\n\nНужно:\n- Сформировать SOAP‑запись (S/O/A/P).\n- Список уточняющих вопросов (до 12) по красным флагам.\n- Возможные направления обследования (без категоричных утверждений).\n- Памятка пациенту простыми словами.\n\nНе выдавай медицинских назначений как истину — только варианты обсуждения с врачом.`
      }
    ],
    research: [
      {
        key: 'lit-review',
        title: (n) => `План исследования и обзор литературы для ${n}`,
        tags: ['исследования', 'литобзор', 'гипотезы', 'методология'],
        body: (n) => `Ты — исследователь. Помоги подготовить план исследования для ${n}.\n\nВход:\n- Тема: {тема}\n- Цель: {цель}\n- Ограничения по данным/времени: {ограничения}\n\nНужно:\n- 3–5 гипотез и как их проверить.\n- План литобзора: ключевые термины, базы, критерии включения.\n- Дизайн исследования и переменные.\n- Риски смещения и как их уменьшить.\n- Шаблон структуры отчёта/публикации.\n\nЕсли данных нет — предложи дизайн сбора данных и минимальный пилот.`
      }
    ],
    analysis: [
      {
        key: 'data-report',
        title: (n) => `Аналитический отчёт по данным для ${n}`,
        tags: ['аналитика', 'данные', 'дашборд', 'выводы'],
        body: (n) => `Ты — senior data analyst. Подготовь план анализа и структуру отчёта для ${n}.\n\nВход:\n- Бизнес‑вопрос: {вопрос}\n- Таблицы/поля: {таблицы}\n- Период: {период}\n\nНужно:\n- Список метрик (определения и формулы).\n- План EDA: проверки качества данных, выбросы, пропуски.\n- Сегментации (минимум 6) и зачем они.\n- 10 инсайт‑гипотез и как их валидировать.\n- SQL‑шаблоны (псевдо‑SQL) для ключевых срезов.\n\nВ конце — список решений, которые можно принять на основе отчёта.`
      }
    ],
    design: [
      {
        key: 'ui-audit',
        title: (n) => `UI/UX аудит и рекомендации для ${n}`,
        tags: ['дизайн', 'ux', 'аудит', 'конверсия'],
        body: (n) => `Ты — UX‑дизайнер. Проведи аудит интерфейса ${n}.\n\nВход:\n- Скриншоты/ссылки: {материалы}\n- Цель: {цель}\n- Основной сценарий: {сценарий}\n\nНужно:\n- Топ‑15 проблем (impact/effort) с пояснениями.\n- Рекомендации по улучшению: текст, иерархия, формы, ошибки.\n- Быстрые выигрыши (до 1 дня) и стратегические улучшения.\n- Чек‑лист доступности (WCAG) по ключевым точкам.\n- План A/B‑тестов (5 гипотез).\n\nПиши конкретно: «где», «что», «почему», «как измерить».`
      }
    ],
    chat: [
      {
        key: 'assistant',
        title: (n) => `Персональный ассистент: настройка роли и правил для ${n}`,
        tags: ['ассистент', 'роль', 'правила', 'тон'],
        body: (n) => `Ты — персональный AI‑ассистент для ${n}. Настрой правила работы.\n\nВход:\n- Моя цель: {цель}\n- Контекст: {контекст}\n- Ограничения: {ограничения}\n- Стиль ответа: {стиль}\n\nСделай:\n- Описание роли ассистента и границы ответственности.\n- Правила: что уточнять, как проверять факты, как фиксировать решения.\n- Формат ежедневного отчёта и чек‑листы.\n- Шаблоны: план дня, разбор задачи, итог встречи.\n\nСразу задай 7 вопросов, чтобы персонализировать работу.`
      }
    ],
    image: [
      {
        key: 'photo-brief',
        title: (n) => `ТЗ на фотосессию и промпты для генерации кадров ${n}`,
        tags: ['фото', 'тз', 'референсы', 'свет'],
        body: (n) => `Ты — фотограф и арт‑директор. Составь ТЗ на фотосессию для ${n} и набор промптов для генерации референсов.\n\nВход:\n- Цель: {цель}\n- Локация: {локация}\n- Стиль: {стиль}\n- Персонажи/товар: {объект}\n\nНужно:\n- 10 кадров: композиция, позы, свет, объектив/фокусное, фон.\n- Промпты для генеративной модели (на русском и на английском) под каждый кадр.\n- Список реквизита и «must-have» деталей.\n- План ретуши и цветокоррекции.\n\nДай результат в виде таблицы + краткие комментарии.`
      }
    ],
    creative: [
      {
        key: 'ideas',
        title: (n) => `Генератор идей и концепций для ${n}`,
        tags: ['идеи', 'концепции', 'креатив', 'брейншторм'],
        body: (n) => `Ты — креативный директор. Сгенерируй идеи для ${n}.\n\nВход:\n- Тема/продукт: {тема}\n- Аудитория: {аудитория}\n- Ограничения: {ограничения}\n\nНужно:\n- 20 идей, разделённых на 5 направлений.\n- Для каждой идеи: краткое описание, зачем это аудитории, риск, как измерить успех.\n- 5 «сумасшедших» идей и как безопасно протестировать.\n- Синтез: 3 комбинированные концепции.\n\nНе повторяй формулировки — каждую идею делай смыслово уникальной.`
      }
    ],
    productivity: [
      {
        key: 'plan',
        title: (n) => `Планирование недели и приоритизация задач для ${n}`,
        tags: ['продуктивность', 'планирование', 'приоритеты', 'фокус'],
        body: (n) => `Ты — коуч по продуктивности. Помоги спланировать неделю для ${n}.\n\nВход:\n- Мои цели: {цели}\n- Список задач: {задачи}\n- Доступное время: {время}\n- Ограничения: {ограничения}\n\nНужно:\n- Разбить задачи на outcomes и next actions.\n- Приоритизация (RICE/ICE) и объяснение.\n- Расписание по дням с буферами.\n- Правила защиты фокуса и «когда говорить нет».\n- Ритуал ревью недели и метрики прогресса.\n\nСделай так, чтобы результат можно было сразу перенести в календарь.`
      }
    ],
    gaming: [
      {
        key: 'quest',
        title: (n) => `Дизайн квеста и механик для игры ${n}`,
        tags: ['игры', 'квест', 'механики', 'нарратив'],
        body: (n) => `Ты — геймдизайнер. Придумай квест для игры ${n}.\n\nВход:\n- Жанр: {жанр}\n- Локация: {локация}\n- Основная механика: {механика}\n\nНужно:\n- Цель квеста и мотивация игрока.\n- 6 этапов с событиями и условиями победы/провала.\n- Награды и баланс.\n- Диалоги ключевых NPC (коротко).\n- 5 вариантов усложнения и 3 варианта упрощения.\n\nПиши прикладно, чтобы это можно было отдать в продакшен.`
      }
    ],
    finance: [
      {
        key: 'budget',
        title: (n) => `Финплан и бюджетирование для ${n}`,
        tags: ['финансы', 'бюджет', 'план', 'риски'],
        body: (n) => `Ты — финансовый консультант. Составь финансовый план для ${n}.\n\nВход:\n- Доходы: {доходы}\n- Расходы: {расходы}\n- Долги/обязательства: {долги}\n- Цели: {цели}\n\nНужно:\n- Таблица бюджета (месяц) с категориями.\n- 3 сценария (оптимистичный/база/стресс) и триггеры переключения.\n- План резервов и правило подушки.\n- Риски и как их мониторить.\n- Рекомендации по оптимизации расходов (без «магии», только конкретика).\n\nЕсли входные данные неполные — запроси уточнения и предложи допущения.`
      }
    ],
    cooking: [
      {
        key: 'recipe',
        title: (n) => `Рецепт и техкарта блюда для ${n}`,
        tags: ['кулинария', 'рецепт', 'техкарта', 'ингредиенты'],
        body: (n) => `Ты — шеф‑повар. Составь рецепт и техкарту блюда для ${n}.\n\nВход:\n- Ограничения по продуктам: {ограничения}\n- Кухня/стиль: {стиль}\n- Кол-во порций: {порции}\n\nНужно:\n- Ингредиенты (граммы) и замены.\n- Технология по шагам с таймингом.\n- Подача и сервировка.\n- Пищевая ценность (оценочно) и аллергенность.\n- Как масштабировать на 10/50 порций.\n\nПиши максимально практично.`
      }
    ],
    music: [
      {
        key: 'song',
        title: (n) => `Музыкальный промпт: трек для ${n}`,
        tags: ['музыка', 'трек', 'жанр', 'настроение'],
        body: (n) => `Ты — музыкальный продюсер. Сгенерируй промпт для генератора музыки для ${n}.\n\nВход:\n- Жанр/референсы: {жанр}\n- BPM: {bpm}\n- Настроение: {настроение}\n- Инструменты: {инструменты}\n\nНужно:\n- Основной промпт (1 абзац) + 5 вариаций.\n- Структура трека (интро/куплет/припев/бридж/дроп) с таймингом.\n- Ограничения по миксу (динамика, частоты) и «negative prompt».\n- 3 идеи для хука и 3 идеи для переходов.\n\nПиши по‑русски, но термины жанров можно на английском.`
      }
    ],
    audio: [
      {
        key: 'podcast',
        title: (n) => `Сценарий подкаста и план выпуска для ${n}`,
        tags: ['подкаст', 'аудио', 'сценарий', 'структура'],
        body: (n) => `Ты — продюсер подкаста. Подготовь выпуск для ${n}.\n\nВход:\n- Тема: {тема}\n- Длительность: {длительность}\n- Формат: {формат} (интервью/соло/дискуссия)\n\nНужно:\n- Структура по минутам.\n- Список вопросов (если интервью) и «переходы».\n- Интро/аутро (текст ведущего).\n- Список звуковых вставок и тайминги.\n- План продвижения: 5 клипов и заголовки.\n\nПиши так, чтобы по этому документу можно было сразу записывать.`
      }
    ]
  }

  // На случай отсутствия шаблонов для какой-то категории — fallback
  const fallback = [
    {
      key: 'generic',
      title: (n) => `Профессиональный промпт для ${n}`,
      tags: ['шаблон', 'практика', 'структура'],
      body: (n) => `Ты — эксперт. Реши задачу для ${n}.\n\nВход:\n- Цель: {цель}\n- Контекст: {контекст}\n- Ограничения: {ограничения}\n\nНужно:\n- Сформировать план действий.\n- Дать готовый результат.\n- Проверки качества.\n- Риски и альтернативы.\n\nПиши по‑русски, без воды.`
    }
  ]

  return { catalog, niches, fallback }
}

async function main() {
  const { count, outFile, seed, quotaMode, alpha } = parseArgs()
  const rng = makeRng(seed)

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, nameRu: true, nameEn: true, parentId: true }
  })
  const topLevel = categories.filter((c) => !c.parentId)

  const promptIds = (await prisma.prompt.findMany({ select: { id: true } })).map((p) => p.id)
  const viewsByPrompt = await computeResolvedViewsByPrompt(promptIds)

  // views by categoryId
  const prompts = await prisma.prompt.findMany({ select: { id: true, categoryId: true } })
  const viewsByCategoryId = new Map()
  for (const p of prompts) {
    const catId = p.categoryId || null
    if (!catId) continue
    const v = viewsByPrompt.get(p.id) || 0
    viewsByCategoryId.set(catId, (viewsByCategoryId.get(catId) || 0) + v)
  }

  // Получаем количество промптов по категориям
  const promptsByCategoryId = new Map()
  for (const p of prompts) {
    const catId = p.categoryId || null
    if (!catId) continue
    promptsByCategoryId.set(catId, (promptsByCategoryId.get(catId) || 0) + 1)
  }

  const totalTopLevelViews = topLevel.reduce((sum, c) => sum + (viewsByCategoryId.get(c.id) || 0), 0)
  const totalTopLevelPrompts = topLevel.reduce((sum, c) => sum + (promptsByCategoryId.get(c.id) || 0), 0)

  let shares
  if (quotaMode === 'views+prior') {
    const K = topLevel.length
    shares = topLevel.map((c) => {
      const v = viewsByCategoryId.get(c.id) || 0
      return { key: c.slug, share: (v + alpha) / (totalTopLevelViews + alpha * K) }
    })
  } else if (quotaMode === 'mixed') {
    // Смешанная стратегия: просмотры + промпты
    if (totalTopLevelViews > 0 && totalTopLevelViews >= 10) {
      // Комбинируем: 70% просмотры, 30% промпты
      const combined = topLevel.map((c) => {
        const v = viewsByCategoryId.get(c.id) || 0
        const p = promptsByCategoryId.get(c.id) || 0
        const viewsShare = v / totalTopLevelViews
        const promptsShare = totalTopLevelPrompts > 0 ? p / totalTopLevelPrompts : 0
        return {
          key: c.slug,
          combined: viewsShare * 0.7 + promptsShare * 0.3
        }
      })
      const totalCombined = combined.reduce((sum, r) => sum + r.combined, 0)
      shares = combined.map((r) => ({
        key: r.key,
        share: totalCombined > 0 ? r.combined / totalCombined : 1 / topLevel.length
      }))
    } else if (totalTopLevelPrompts > 0) {
      // Просмотров мало - используем промпты
      shares = topLevel.map((c) => {
        const p = promptsByCategoryId.get(c.id) || 0
        return { key: c.slug, share: p / totalTopLevelPrompts }
      })
    } else {
      // Равномерное распределение
      shares = topLevel.map((c) => ({ key: c.slug, share: 1 / topLevel.length }))
    }
    
    // Ограничиваем максимальную долю одной категории (не более 25%)
    const maxSharePerCategory = 0.25
    shares = shares.map((s) => ({
      key: s.key,
      share: Math.min(s.share, maxSharePerCategory)
    }))
    const totalAfterMax = shares.reduce((sum, s) => sum + s.share, 0)
    if (totalAfterMax > 0) {
      shares = shares.map((s) => ({
        key: s.key,
        share: s.share / totalAfterMax
      }))
    }
    
    // Минимальная квота: хотя бы 2 промпта на категорию (если есть промпты)
    const minQuota = 2
    const categoriesWithPrompts = topLevel.filter((c) => (promptsByCategoryId.get(c.id) || 0) > 0)
    const minTotal = categoriesWithPrompts.length * minQuota
    
    if (count >= minTotal) {
      const adjustedShares = shares.map((s) => {
        const catData = topLevel.find((c) => c.slug === s.key)
        const hasPrompts = catData && (promptsByCategoryId.get(catData.id) || 0) > 0
        return {
          key: s.key,
          share: hasPrompts ? Math.max(s.share, minQuota / count) : s.share
        }
      })
      const totalAdjusted = adjustedShares.reduce((sum, s) => sum + s.share, 0)
      shares = adjustedShares.map((s) => ({
        key: s.key,
        share: totalAdjusted > 0 ? s.share / totalAdjusted : s.share
      }))
    }
  } else {
    // strict views (старая логика) - но с ограничением максимума
    if (totalTopLevelViews === 0) {
      // Если просмотров нет - используем промпты
      if (totalTopLevelPrompts > 0) {
        shares = topLevel.map((c) => {
          const p = promptsByCategoryId.get(c.id) || 0
          return { key: c.slug, share: p / totalTopLevelPrompts }
        })
      } else {
        shares = topLevel.map((c) => ({ key: c.slug, share: 1 / topLevel.length }))
      }
    } else {
      shares = topLevel
        .map((c) => ({ key: c.slug, share: (viewsByCategoryId.get(c.id) || 0) / totalTopLevelViews }))
        .filter((s) => s.share > 0)
    }
    
    // Ограничиваем максимум даже для strict views
    const maxSharePerCategory = 0.25
    shares = shares.map((s) => ({
      key: s.key,
      share: Math.min(s.share, maxSharePerCategory)
    }))
    const totalAfterMax = shares.reduce((sum, s) => sum + s.share, 0)
    if (totalAfterMax > 0) {
      shares = shares.map((s) => ({
        key: s.key,
        share: s.share / totalAfterMax
      }))
    }
  }
  
  // Минимальная квота для mixed режима
  if (quotaMode === 'mixed') {
    const minQuota = 2
    const categoriesWithPrompts = topLevel.filter((c) => (promptsByCategoryId.get(c.id) || 0) > 0)
    const minTotal = categoriesWithPrompts.length * minQuota
    
    if (count >= minTotal) {
      const adjustedShares = shares.map((s) => {
        const catData = topLevel.find((c) => c.slug === s.key)
        const hasPrompts = catData && (promptsByCategoryId.get(catData.id) || 0) > 0
        return {
          key: s.key,
          share: hasPrompts ? Math.max(s.share, minQuota / count) : s.share
        }
      })
      const totalAdjusted = adjustedShares.reduce((sum, s) => sum + s.share, 0)
      shares = adjustedShares.map((s) => ({
        key: s.key,
        share: totalAdjusted > 0 ? s.share / totalAdjusted : s.share
      }))
    }
  }

  const quotas = shares.length ? allocateByShares(count, shares) : []
  const quotaBySlug = new Map(quotas.map((q) => [q.key, q.n]))

  const { catalog, niches, fallback } = buildCatalog()

  const items = []
  const usedTitles = new Set()

  // Генерация по категориям согласно квоте
  for (const cat of topLevel) {
    const need = quotaBySlug.get(cat.slug) || 0
    if (!need) continue

    const templates = catalog[cat.slug] || fallback
    const nichePool = cat.slug === 'video' ? niches.video : niches.general

    // Собираем комбинации (template × niche) и перемешиваем, чтобы гарантировать уникальность заголовков.
    const combos = shuffle(
      rng,
      templates.flatMap((tpl) => nichePool.map((n) => ({ tpl, n })))
    )

    let idx = 0
    while (items.length < count && items.filter((it) => it.categorySlug === cat.slug).length < need) {
      const combo = combos[idx % combos.length]
      idx += 1

      const n = combo.n
      const tpl = combo.tpl
      let title = tpl.title(n)
      if (usedTitles.has(title)) {
        title = `${title} — вариант ${idx}`
      }
      if (usedTitles.has(title)) continue

      const baseBody = tpl.body(n)
      const promptText = clampPromptText(baseBody, { min: 500, max: 1000 })

      const model = modelForCategorySlug(cat.slug)
      const safeModel = PROMPT_MODELS.includes(model) ? model : 'GPT-5'

      const description = buildDescriptionFromPrompt(promptText)
      const tags = Array.from(new Set([...(tpl.tags || []), cat.slug])).slice(0, 12)

      items.push({
        title,
        description,
        prompt: promptText,
        model: safeModel,
        lang: 'Русский',
        categorySlug: cat.slug,
        tags,
        license: 'CC0'
      })
      usedTitles.add(title)
    }
  }

  if (items.length !== count) {
    const msg =
      shares.length === 0
        ? 'Не удалось построить квоты: в топ-уровневых категориях нет просмотров (strict views). Запусти с --quotaMode=views+prior.'
        : `Сгенерировано ${items.length} из ${count}. Увеличь разнообразие шаблонов/ниш или используй сглаживание.`
    throw new Error(msg)
  }

  const out = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    seed,
    quotaMode,
    alpha,
    items
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8')
  console.log(`✅ Generated ${items.length} prompts -> ${outFile}`)
  console.log('Quotas:')
  for (const [slug, n] of Array.from(quotaBySlug.entries()).sort((a, b) => b[1] - a[1])) {
    if (n > 0) console.log(`- ${slug}: ${n}`)
  }
}

main()
  .catch((e) => {
    console.error('Generation failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed скрипт для создания первых статей
 */
async function seedArticles() {
  console.log('🌱 Starting articles seeding...');

  try {
    // Получаем первого пользователя (или создаем системного)
    let author = await prisma.user.findFirst({
      where: {
        email: { not: null }
      }
    });

    if (!author) {
      console.log('Creating system author...');
      author = await prisma.user.create({
        data: {
          name: 'PromptHub Team',
          email: 'team@prompt-hub.site'
        }
      });
    }

    console.log(`✅ Using author: ${author.name} (${author.id})`);

    // Получаем или создаем теги
    const tags = await Promise.all([
      prisma.tag.upsert({
        where: { slug: 'excel' },
        update: {},
        create: {
          name: 'Excel',
          slug: 'excel',
          description: 'Работа с Microsoft Excel и таблицами',
          color: '#217346'
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'google-sheets' },
        update: {},
        create: {
          name: 'Google Sheets',
          slug: 'google-sheets',
          description: 'Работа с Google Таблицами',
          color: '#0F9D58'
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'automation' },
        update: {},
        create: {
          name: 'Автоматизация',
          slug: 'automation',
          description: 'Автоматизация рутинных задач',
          color: '#FF6D00'
        }
      }),
      prisma.tag.upsert({
        where: { slug: 'data-analysis' },
        update: {},
        create: {
          name: 'Анализ данных',
          slug: 'data-analysis',
          description: 'Анализ и обработка данных',
          color: '#9C27B0'
        }
      })
    ]);

    console.log(`✅ Tags created/updated: ${tags.length}`);

    // Создаем первую статью: "Промпты для Excel и Google Sheets"
    const article1 = await prisma.article.upsert({
      where: { slug: 'prompty-dlya-excel-i-google-sheets' },
      update: {},
      create: {
        slug: 'prompty-dlya-excel-i-google-sheets',
        titleRu: 'Промпты для Excel и Google Sheets: формулы, автоматизация и разбор CSV',
        titleEn: 'Prompts for Excel and Google Sheets: formulas, automation and CSV parsing',
        descriptionRu: 'Полное руководство по использованию AI для работы с таблицами: от создания формул до автоматизации отчетов и анализа CSV-файлов.',
        descriptionEn: 'Complete guide to using AI for spreadsheet work: from creating formulas to automating reports and analyzing CSV files.',
        contentRu: `## О чем эта статья

В этой статье вы узнаете:

- Как использовать AI для генерации сложных формул Excel и Google Sheets
- Способы автоматизации повторяющихся задач в таблицах
- Техники парсинга и анализа CSV-файлов
- Создание макросов и скриптов для таблиц
- Практические примеры и готовые промпты

## Проблема: Работа с таблицами отнимает много времени

Каждый день миллионы людей тратят часы на работу с таблицами Excel и Google Sheets. Рутинные задачи:

- Создание сложных формул с множеством условий
- Объединение данных из разных источников
- Форматирование и очистка данных
- Построение отчетов и дашбордов
- Автоматизация повторяющихся операций

Искусственный интеллект может значительно ускорить эти процессы.

## Генерация формул с помощью AI

### Базовые формулы

Вместо того, чтобы вспоминать синтаксис или искать в справке, просто опишите задачу:

**Промпт:**
\`\`\`
Создай формулу Excel, которая:
- Проверяет значение в ячейке A2
- Если больше 100, возвращает "Высокий"
- Если от 50 до 100, возвращает "Средний"
- Если меньше 50, возвращает "Низкий"
\`\`\`

**Результат:**
\`\`\`
=IF(A2>100,"Высокий",IF(A2>=50,"Средний","Низкий"))
\`\`\`

### Сложные вложенные формулы

**Промпт:**
\`\`\`
Нужна формула для расчета комиссии продавца:
- База: 3% от продаж
- Бонус 1%: если продажи > 50000
- Бонус 2%: если продажи > 100000
- Штраф -0.5%: если меньше 5 сделок в месяц

Данные: продажи в B2, количество сделок в C2
\`\`\`

## Автоматизация таблиц

### Создание макросов VBA

**Промпт для Excel:**
\`\`\`
Напиши макрос VBA, который:
1. Находит все ячейки с текстом "ТРЕБУЕТСЯ ОБРАБОТКА"
2. Меняет цвет фона на желтый
3. Добавляет комментарий с текущей датой
4. Отправляет уведомление на email
\`\`\`

### Скрипты Google Apps Script

**Промпт для Google Sheets:**
\`\`\`
Создай скрипт Google Apps Script, который:
- Запускается каждый день в 9:00
- Копирует данные из листа "Входящие" в "Архив"
- Добавляет метку времени
- Очищает исходный лист
- Отправляет отчет на указанный email
\`\`\`

## Работа с CSV-файлами

### Парсинг и очистка данных

**Промпт:**
\`\`\`
У меня есть CSV-файл с данными клиентов. Нужно:
1. Удалить дубликаты по email
2. Привести телефоны к формату +7 (XXX) XXX-XX-XX
3. Разделить ФИО на отдельные столбцы
4. Заполнить пустые города значением "Москва"

Создай формулы или скрипт для Google Sheets
\`\`\`

### Анализ больших CSV

**Промпт:**
\`\`\`
У меня CSV с 50000 строк транзакций. Мне нужно:
- Сгруппировать по месяцам
- Посчитать среднюю сумму транзакции
- Найти топ-10 клиентов по сумме покупок
- Выявить аномальные транзакции (больше 3 стандартных отклонений)

Предложи оптимальный способ для Google Sheets
\`\`\`

## Создание отчетов и дашбордов

### Автоматический отчет

**Промпт:**
\`\`\`
Создай шаблон отчета в Google Sheets:
- Заголовок с логотипом компании
- Сводная таблица продаж по менеджерам
- График динамики по месяцам
- Топ-5 товаров
- Автоматическое обновление данных из листа "Данные"
\`\`\`

## Интеграция с промптами на PromptHub

На нашем сайте вы найдете готовые промпты для работы с таблицами:

- [Просмотреть промпты по тегу Excel](/ru/tag/excel)
- [Промпты для автоматизации](/ru/tag/automation)
- [Анализ данных](/ru/tag/data-analysis)

## Практические кейсы

### Кейс 1: Финансовый отчет

**Задача:** Создать автоматизированный отчет о доходах и расходах компании.

**Решение:**
1. Попросили AI создать структуру таблицы
2. Сгенерировали формулы для расчетов
3. Настроили автоматическое обновление данных
4. Создали макрос для отправки отчета

**Результат:** Экономия 5 часов в неделю.

### Кейс 2: CRM в Google Sheets

**Задача:** Простая CRM-система для малого бизнеса.

**Решение:**
1. Создали структуру базы клиентов
2. Настроили автоматические уведомления
3. Добавили скрипты для отслеживания сделок
4. Интегрировали с формами Google

## Советы по работе с AI для таблиц

1. **Будьте конкретны** - чем точнее описание, тем лучше результат
2. **Указывайте формат данных** - типы ячеек, диапазоны, форматы
3. **Тестируйте на малых данных** - сначала проверьте формулу на нескольких строках
4. **Просите объяснения** - AI может пояснить, как работает формула
5. **Итеративный подход** - уточняйте и дорабатывайте промпты

## Заключение

Искусственный интеллект превращает работу с таблицами из рутины в творчество. Вместо того, чтобы тратить часы на поиск правильной формулы или написание макроса, вы можете просто описать задачу и получить готовое решение.

### Что делать дальше?

1. Попробуйте промпты из этой статьи на ваших данных
2. Изучите нашу коллекцию [промптов для работы с данными](/ru/prompts)
3. Поделитесь своими находками с сообществом
4. Создайте и опубликуйте собственные промпты

Помните: лучший способ освоить работу с AI — это практика. Начните с простых задач и постепенно переходите к более сложным.`,
        contentEn: `## What this article is about

In this article you will learn:

- How to use AI to generate complex Excel and Google Sheets formulas
- Ways to automate repetitive tasks in spreadsheets
- Techniques for parsing and analyzing CSV files
- Creating macros and scripts for spreadsheets
- Practical examples and ready-made prompts

## Problem: Working with spreadsheets takes a lot of time

Every day, millions of people spend hours working with Excel and Google Sheets. Routine tasks include:

- Creating complex formulas with multiple conditions
- Merging data from different sources
- Formatting and cleaning data
- Building reports and dashboards
- Automating repetitive operations

Artificial intelligence can significantly speed up these processes.

## Generating formulas with AI

### Basic formulas

Instead of remembering syntax or searching in help, just describe the task:

**Prompt:**
\`\`\`
Create an Excel formula that:
- Checks value in cell A2
- If greater than 100, returns "High"
- If between 50 and 100, returns "Medium"
- If less than 50, returns "Low"
\`\`\`

**Result:**
\`\`\`
=IF(A2>100,"High",IF(A2>=50,"Medium","Low"))
\`\`\`

### Complex nested formulas

**Prompt:**
\`\`\`
Need a formula to calculate salesperson commission:
- Base: 3% of sales
- Bonus 1%: if sales > 50000
- Bonus 2%: if sales > 100000
- Penalty -0.5%: if less than 5 deals per month

Data: sales in B2, number of deals in C2
\`\`\`

## Spreadsheet automation

### Creating VBA macros

**Prompt for Excel:**
\`\`\`
Write a VBA macro that:
1. Finds all cells with text "REQUIRES PROCESSING"
2. Changes background color to yellow
3. Adds comment with current date
4. Sends email notification
\`\`\`

### Google Apps Scripts

**Prompt for Google Sheets:**
\`\`\`
Create a Google Apps Script that:
- Runs daily at 9:00 AM
- Copies data from "Incoming" sheet to "Archive"
- Adds timestamp
- Clears original sheet
- Sends report to specified email
\`\`\`

## Working with CSV files

### Parsing and cleaning data

**Prompt:**
\`\`\`
I have a CSV file with customer data. Need to:
1. Remove duplicates by email
2. Format phones to +7 (XXX) XXX-XX-XX
3. Split full name into separate columns
4. Fill empty cities with "Moscow"

Create formulas or script for Google Sheets
\`\`\`

### Analyzing large CSV

**Prompt:**
\`\`\`
I have a CSV with 50000 transaction rows. I need to:
- Group by months
- Calculate average transaction amount
- Find top-10 customers by purchase sum
- Identify anomalous transactions (more than 3 standard deviations)

Suggest optimal approach for Google Sheets
\`\`\`

## Conclusion

Artificial intelligence turns spreadsheet work from routine into creativity. Instead of spending hours searching for the right formula or writing a macro, you can simply describe the task and get a ready-made solution.

### What to do next?

1. Try prompts from this article on your data
2. Explore our collection of [prompts for data work](/en/prompts)
3. Share your findings with the community
4. Create and publish your own prompts`,
        authorId: author.id,
        status: 'published',
        publishedAt: new Date(),
        articleTags: {
          create: [
            { tagId: tags[0].id }, // Excel
            { tagId: tags[1].id }, // Google Sheets
            { tagId: tags[2].id }, // Automation
            { tagId: tags[3].id }  // Data Analysis
          ]
        }
      },
      include: {
        articleTags: {
          include: {
            tag: true
          }
        }
      }
    });

    console.log(`✅ Article created: ${article1.titleRu} (${article1.slug})`);

    console.log('\n✨ Articles seeding completed successfully!');
    console.log(`\nYou can view the article at:`);
    console.log(`- RU: ${process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000'}/ru/articles/${article1.slug}`);
    console.log(`- EN: ${process.env.NEXT_PUBLIC_APP_HOST || 'http://localhost:3000'}/en/articles/${article1.slug}`);

  } catch (error) {
    console.error('❌ Error seeding articles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
seedArticles()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


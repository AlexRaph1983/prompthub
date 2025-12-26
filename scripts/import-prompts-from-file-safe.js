/**
 * Безопасный пакетный импорт промптов из JSON-файла.
 *
 * Гарантии:
 * - не модифицирует существующие промпты (только create)
 * - не трогает promptmaster и других пользователей (создаёт/использует отдельного автора по email)
 * - валидация полей, уникальность заголовков (глобально)
 * - транзакции: при ошибке в батче -> rollback батча и остановка
 *
 * Запуск:
 *   node scripts/import-prompts-from-file-safe.js --file=data/generated_prompts_ru_300.json --authorEmail=content-architect@prompthub.local
 *
 * Опции:
 *   --file=path.json
 *   --authorEmail=email
 *   --dryRun=true|false   (по умолчанию true) - только валидация/план, без записи в БД
 *   --batch=25            размер транзакционного батча
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PROMPT_MODELS = new Set([
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
])

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {
    file: path.join('data', 'generated_prompts_ru_300.json'),
    authorEmail: 'content-architect@prompthub.local',
    dryRun: true,
    batch: 25,
    sleepMs: 0
  }
  for (const a of args) {
    if (a.startsWith('--file=')) out.file = a.slice(7)
    else if (a.startsWith('--authorEmail=')) out.authorEmail = a.slice('--authorEmail='.length)
    else if (a.startsWith('--dryRun=')) out.dryRun = a.slice('--dryRun='.length) !== 'false'
    else if (a.startsWith('--batch=')) out.batch = Math.max(1, parseInt(a.slice('--batch='.length), 10) || 25)
    else if (a.startsWith('--sleepMs=')) out.sleepMs = Math.max(0, parseInt(a.slice('--sleepMs='.length), 10) || 0)
  }
  return out
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function normTitle(s) {
  return (s || '').replace(/\s+/g, ' ').trim()
}

function charLen(s) {
  return (s || '').length
}

function toTagsString(tags) {
  if (!Array.isArray(tags)) return ''
  return tags
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 20)
    .join(', ')
}

async function getOrCreateAuthorByEmail(email) {
  // Никогда не трогаем promptmaster: просто запрещаем этот email/name.
  const e = (email || '').toLowerCase().trim()
  assert(e && e.includes('@'), 'authorEmail is invalid')
  assert(!e.includes('promptmaster'), 'Refusing to use promptmaster-like email')

  const existing = await prisma.user.findUnique({ where: { email: e } })
  if (existing) return existing

  return prisma.user.create({
    data: {
      email: e,
      name: 'Content Architect',
      bio: 'Curated prompt library (system content).',
      reputationScore: 0,
      reputationPromptCount: 0,
      reputationLikesCnt: 0,
      reputationSavesCnt: 0,
      reputationRatingsCnt: 0,
      reputationCommentsCnt: 0
    }
  })
}

async function getCategoryBySlug(slug) {
  const s = String(slug || '').trim()
  assert(s, 'categorySlug is required')
  const cat = await prisma.category.findUnique({ where: { slug: s } })
  assert(cat && cat.isActive, `Category not found or inactive: ${s}`)
  return cat
}

async function main() {
  const { file, authorEmail, dryRun, batch, sleepMs } = parseArgs()

  assert(fs.existsSync(file), `File not found: ${file}`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const items = Array.isArray(json.items) ? json.items : []
  assert(items.length > 0, 'No items in file')

  // Валидация и дедуп внутри файла
  const seenTitles = new Set()
  for (const [i, raw] of items.entries()) {
    const idx = i + 1
    const title = normTitle(raw.title)
    assert(title.length >= 6, `#${idx}: title too short`)
    assert(!seenTitles.has(title), `#${idx}: duplicate title inside file: "${title}"`)
    seenTitles.add(title)

    assert(typeof raw.description === 'string' && raw.description.trim().length >= 20, `#${idx}: description required`)
    assert(typeof raw.prompt === 'string', `#${idx}: prompt required`)
    const len = charLen(raw.prompt.trim())
    assert(len >= 500 && len <= 1000, `#${idx}: prompt length must be 500–1000 chars, got ${len}`)

    assert(raw.lang === 'Русский', `#${idx}: lang must be "Русский"`)
    assert(PROMPT_MODELS.has(raw.model), `#${idx}: model not allowed by site: ${raw.model}`)
    assert(typeof raw.categorySlug === 'string' && raw.categorySlug.trim(), `#${idx}: categorySlug required`)
    assert(typeof raw.license === 'string' && raw.license.trim(), `#${idx}: license required`)
    assert(Array.isArray(raw.tags) && raw.tags.length > 0, `#${idx}: tags[] required`)
  }

  const author = await getOrCreateAuthorByEmail(authorEmail)

  // Глобальная уникальность заголовков (по всей таблице Prompt)
  const titles = Array.from(seenTitles)
  const existing = await prisma.prompt.findMany({
    where: { title: { in: titles } },
    select: { title: true, authorId: true }
  })
  if (existing.length > 0) {
    const examples = existing.slice(0, 10).map((p) => `"${p.title}" (authorId=${p.authorId})`)
    throw new Error(
      `Refusing to import: ${existing.length} titles already exist in DB (global uniqueness enforced). Examples: ${examples.join(
        ', '
      )}`
    )
  }

  const planByCategory = new Map()
  for (const it of items) {
    const slug = it.categorySlug.trim()
    planByCategory.set(slug, (planByCategory.get(slug) || 0) + 1)
  }

  console.log('=== Import plan ===')
  console.log('File:', file)
  console.log('Items:', items.length)
  console.log('Dry run:', dryRun)
  console.log('Batch size:', batch)
  console.log('Sleep between batches (ms):', sleepMs)
  console.log('By categorySlug:')
  for (const [slug, cnt] of Array.from(planByCategory.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`- ${slug}: ${cnt}`)
  }

  if (dryRun) {
    // В dryRun мы НЕ создаём юзеров/тегов/промптов, только валидируем.
    // Дополнительно проверяем, что категории существуют и активны.
    for (const slug of planByCategory.keys()) {
      await getCategoryBySlug(slug)
    }
    console.log('✅ Dry run OK (no DB writes). Re-run with --dryRun=false to import.')
    return
  }

  const author = await getOrCreateAuthorByEmail(authorEmail)
  console.log('Author:', { id: author.id, email: author.email })

  // Готовим категории
  const categoryCache = new Map()
  for (const it of items) {
    const slug = it.categorySlug.trim()
    if (!categoryCache.has(slug)) {
      categoryCache.set(slug, await getCategoryBySlug(slug))
    }
  }

  let imported = 0
  const touchedTagIds = new Set()

  for (let offset = 0; offset < items.length; offset += batch) {
    const chunk = items.slice(offset, offset + batch)

    await prisma.$transaction(async (tx) => {
      for (const raw of chunk) {
        const title = normTitle(raw.title)
        const category = categoryCache.get(raw.categorySlug.trim())
        assert(category, `Category missing in cache: ${raw.categorySlug}`)

        const tagsString = toTagsString(raw.tags)
        assert(tagsString.length > 0, `Empty tags after normalization for: ${title}`)

        const created = await tx.prompt.create({
          data: {
            title,
            description: raw.description.trim(),
            prompt: raw.prompt.trim(),
            model: raw.model,
            lang: raw.lang,
            category: category.nameEn, // обратная совместимость
            categoryRef: { connect: { id: category.id } },
            tags: tagsString,
            license: raw.license,
            author: { connect: { id: author.id } },
            averageRating: 0,
            totalRatings: 0,
            views: 0
          }
        })

        // Синхронизируем счётчик категории (как createPromptAndSync, но в рамках общей транзакции батча)
        await tx.category.update({
          where: { id: category.id },
          data: { promptCount: { increment: 1 } }
        })

        // Теги: создаём/находим и связываем через PromptTag (опционально, но полезно для фильтров)
        for (const t of raw.tags) {
          const name = String(t || '').trim()
          if (!name) continue
          const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9а-яё-]/g, '')

          const tag = await tx.tag.upsert({
            where: { slug },
            update: {},
            create: { name, slug, isActive: true, promptCount: 0 }
          })
          touchedTagIds.add(tag.id)

          await tx.promptTag.upsert({
            where: { promptId_tagId: { promptId: created.id, tagId: tag.id } },
            update: {},
            create: { promptId: created.id, tagId: tag.id }
          })
        }
      }
    })

    imported += chunk.length
    console.log(`✅ Imported ${imported}/${items.length}`)

    if (sleepMs > 0 && imported < items.length) {
      await new Promise((resolve) => setTimeout(resolve, sleepMs))
    }
  }

  // Обновляем promptCount только у затронутых тегов (без полного пересчёта)
  if (touchedTagIds.size > 0) {
    const ids = Array.from(touchedTagIds)
    for (const id of ids) {
      const cnt = await prisma.promptTag.count({ where: { tagId: id } })
      await prisma.tag.update({ where: { id }, data: { promptCount: cnt } })
    }
  }

  console.log('🎉 Import finished.')
  console.log('Imported:', imported)
}

main()
  .catch((e) => {
    console.error('Import failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



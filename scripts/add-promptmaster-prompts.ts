import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

interface RawPromptItem {
  title: string
  summary: string
  language: string
  model: string
  category: string
  license: string
  tags: string[]
  prompt_text: string
  usage_instructions?: string
  examples?: string[]
}

interface PromptSubmission {
  version: string
  submitted_by?: {
    username?: string
    user_id?: string
    profile_url?: string
  }
  taxonomy?: unknown
  items: RawPromptItem[]
}

const prisma = new PrismaClient()
const viewAnalyticsClient = (prisma as any).viewAnalytics as { upsert?: (args: any) => Promise<any> } | undefined

const languageMap: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  multi: 'Multilingual',
}

const modelMap: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o mini',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4.1-mini': 'GPT-4.1 mini',
  'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'claude-3.5-haiku': 'Claude 3.5 Haiku',
  'claude-3-opus': 'Claude 3 Opus',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'llama-3.1-8b-instruct': 'Llama 3.1 8B Instruct',
  'llama-3.1-70b-instruct': 'Llama 3.1 70B Instruct',
  'mistral-large-latest': 'Mistral Large',
  'mistral-small-latest': 'Mistral Small',
  'command-r-plus': 'Command R+',
  'command-r': 'Command R',
}

const categoryMap: Record<string, string> = {
  'social-media': 'Marketing',
  summarization: 'Writing',
  'idea-generation': 'Creative',
  translation: 'Translation',
  seo: 'SEO',
  'data-analysis': 'Analysis',
  coding: 'Code',
  design: 'Design',
  marketing: 'Marketing',
  education: 'Education',
  business: 'Business',
  productivity: 'Productivity',
  'customer-support': 'Customer Support',
  research: 'Research',
  legal: 'Legal',
  finance: 'Finance',
  health: 'Health',
  lifestyle: 'Lifestyle',
  arts: 'Arts',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  devops: 'DevOps',
  'data-science': 'Data Science',
  ecommerce: 'Ecommerce',
  gaming: 'Gaming',
  utilities: 'Utilities',
}

const licenseMap: Record<string, 'CC-BY' | 'CC0' | 'Custom' | 'Paid'> = {
  'CC-BY': 'CC-BY',
  'CC-BY-SA': 'Custom',
  CC0: 'CC0',
  Proprietary: 'Paid',
}

function mapLanguage(lang: string) {
  return languageMap[lang] ?? lang
}

function mapModel(model: string) {
  return modelMap[model] ?? model
}

function mapCategory(category: string) {
  if (categoryMap[category]) {
    return categoryMap[category]
  }
  return category
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapLicense(license: string) {
  return licenseMap[license] ?? 'Custom'
}

function toTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean).join(', ')
}

function buildDescription(item: RawPromptItem) {
  const parts = [item.summary.trim()]
  if (item.usage_instructions && item.usage_instructions.trim()) {
    parts.push('Инструкция: ' + item.usage_instructions.trim())
  }
  return parts.join(' ')
}

function normalizeDate(date: Date) {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

async function main() {
  // CLI args: --file <path> | -f <path>, --skip-updates
  const argv = process.argv.slice(2)
  let fileArg: string | undefined
  let skipUpdates = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--file' || arg === '-f') {
      fileArg = argv[i + 1]
      i++
      continue
    }
    if (arg === '--skip-updates' || arg === '--no-update' || arg === '--skip') {
      skipUpdates = true
      continue
    }
  }

  const payloadPath = fileArg
    ? path.isAbsolute(fileArg)
      ? fileArg
      : path.resolve(process.cwd(), fileArg)
    : path.resolve(process.cwd(), 'data', 'promptmaster.json')
  const raw = fs.readFileSync(payloadPath, 'utf8')
  const sanitized = raw.replace(/^[\uFEFF\u200B]+/, '')
  const payload = JSON.parse(sanitized) as PromptSubmission

  const displayName = payload.submitted_by?.username?.trim() || 'PromptMaster'
  const profileUrl = payload.submitted_by?.profile_url?.trim() || null

  const user = await prisma.user.upsert({
    where: { id: 'promptmaster' },
    update: {
      name: displayName,
      email: 'promptmaster@prompthub.local',
      bio: 'Template curator for PromptHub.',
      website: profileUrl,
    },
    create: {
      id: 'promptmaster',
      name: displayName,
      email: 'promptmaster@prompthub.local',
      bio: 'Template curator for PromptHub.',
      website: profileUrl,
    },
  })

  const created: string[] = []
  const skipped: string[] = []

  for (const [index, item] of payload.items.entries()) {
    const description = buildDescription(item)
    const tags = toTags(item.tags || [])

    let prompt
    if (skipUpdates) {
      const existing = await prisma.prompt.findUnique({
        where: {
          title_authorId: {
            title: item.title.trim(),
            authorId: user.id,
          },
        },
      })
      if (existing) {
        skipped.push(existing.id + ': ' + existing.title)
        continue
      }
      prompt = await prisma.prompt.create({
        data: {
          title: item.title.trim(),
          description,
          prompt: item.prompt_text.trim(),
          model: mapModel(item.model),
          lang: mapLanguage(item.language),
          category: mapCategory(item.category),
          tags,
          license: mapLicense(item.license),
          authorId: user.id,
          views: 0,
        },
      })
    } else {
      prompt = await prisma.prompt.upsert({
        where: {
          title_authorId: {
            title: item.title.trim(),
            authorId: user.id,
          },
        },
        update: {
          description,
          prompt: item.prompt_text.trim(),
          model: mapModel(item.model),
          lang: mapLanguage(item.language),
          category: mapCategory(item.category),
          tags,
          license: mapLicense(item.license),
          updatedAt: new Date(),
          // НЕ обновляем views - сохраняем существующие просмотры!
        },
        create: {
          // Let DB generate unique id (cuid)
          title: item.title.trim(),
          description,
          prompt: item.prompt_text.trim(),
          model: mapModel(item.model),
          lang: mapLanguage(item.language),
          category: mapCategory(item.category),
          tags,
          license: mapLicense(item.license),
          authorId: user.id,
          views: 0,
        },
      })
    }

    const analyticsDate = normalizeDate(new Date())
    await prisma.viewAnalytics.upsert({
      where: {
        promptId_date: {
          promptId: prompt.id,
          date: analyticsDate,
        },
      },
      update: {},
      create: {
        promptId: prompt.id,
        date: analyticsDate,
      },
    })

    created.push(prompt.id + ': ' + prompt.title)
  }

  console.log('Imported ' + created.length + ' prompts for ' + user.name)
  created.forEach((line) => console.log(' - ' + line))
  if (skipped.length) {
    console.log('Skipped existing: ' + skipped.length)
    skipped.forEach((line) => console.log(' - ' + line))
  }
}

main()
  .catch((error) => {
    console.error('Failed to import PromptMaster prompts', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


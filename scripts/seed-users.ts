import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'

const prisma = new PrismaClient()

// Пользователи для загрузки
const users = [
  { displayName: 'Top Prompter',   slug: 'top-prompter',    email: 'top.prompter@system.local',   role: 'user' },
  { displayName: 'SUNO Expert',    slug: 'suno-expert',     email: 'suno.expert@system.local',    role: 'user' },
  { displayName: 'AI Гений',       slug: 'ai-geniy',        email: 'ai.geniy@system.local',       role: 'user' },
  { displayName: 'Хуожник от Бога','slug': 'huozhnik-ot-boga','email': 'huozhnik@system.local',   role: 'user' }
]

function transliterate(str: string) {
  // Простейшая транслитерация для кириллицы
  return slugify(str, { lower: true, strict: true, locale: 'ru' })
}

async function main() {
  const report: any[] = []
  for (const user of users) {
    // Проверяем ограничения длины
    const slug = user.slug.length > 32 ? user.slug.slice(0, 32) : user.slug
    const displayName = user.displayName.length > 64 ? user.displayName.slice(0, 64) : user.displayName
    try {
      const result = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: displayName,
          slug,
          role: user.role,
          avatarUrl: null,
        },
        create: {
          name: displayName,
          slug,
          email: user.email,
          role: user.role,
          avatarUrl: null,
        },
      })
      report.push({ action: result.createdAt === result.updatedAt ? 'created' : 'updated', email: user.email, id: result.id, slug: result.slug })
    } catch (error: any) {
      report.push({ action: 'error', email: user.email, error: error.message })
    }
  }
  console.table(report)
  return report
}

if (process.env.SEED_ENV === 'production' && process.env.CONFIRM_PROD !== 'YES') {
  console.error('Production seeding requires CONFIRM_PROD=YES')
  process.exit(1)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

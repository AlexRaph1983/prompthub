/**
 * Мини-скрипт для проверки результата импорта (безопасно, read-only).
 *
 * Запуск:
 *   node scripts/verify-import.js --authorEmail=content-architect@prompthub.local
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { authorEmail: 'content-architect@prompthub.local' }
  for (const a of args) {
    if (a.startsWith('--authorEmail=')) out.authorEmail = a.slice('--authorEmail='.length)
  }
  return out
}

async function main() {
  const { authorEmail } = parseArgs()
  const author = await prisma.user.findUnique({ where: { email: authorEmail.toLowerCase().trim() } })
  if (!author) throw new Error(`Author not found: ${authorEmail}`)

  const [total, mine, videoCategory] = await Promise.all([
    prisma.prompt.count(),
    prisma.prompt.count({ where: { authorId: author.id } }),
    prisma.category.findUnique({ where: { slug: 'video' }, select: { promptCount: true } })
  ])

  console.log({
    totalPrompts: total,
    importedByAuthor: mine,
    otherPrompts: total - mine,
    videoPromptCountCached: videoCategory?.promptCount ?? null
  })
}

main()
  .catch((e) => {
    console.error('Verify failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



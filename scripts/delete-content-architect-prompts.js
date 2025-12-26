/**
 * Удаление промптов от content-architect@prompthub.local
 * Используется для очистки перед перегенерацией с правильным распределением
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Копируем функцию deletePromptAndSync для использования в скрипте
async function deletePromptAndSync(where) {
  return prisma.$transaction(async (tx) => {
    const prev = await tx.prompt.findUnique({
      where,
      select: { id: true, categoryId: true }
    })
    
    if (!prev) {
      throw new Error(`Prompt not found: ${JSON.stringify(where)}`)
    }
    
    const deleted = await tx.prompt.delete({ where })
    
    if (prev.categoryId) {
      await tx.category.update({
        where: { id: prev.categoryId },
        data: { promptCount: { decrement: 1 } }
      }).catch(() => {})
    }
    
    return deleted
  })
}

async function main() {
  const authorEmail = 'content-architect@prompthub.local'
  
  const author = await prisma.user.findUnique({
    where: { email: authorEmail },
    select: { id: true, name: true }
  })
  
  if (!author) {
    console.log(`Author ${authorEmail} not found`)
    return
  }
  
  const prompts = await prisma.prompt.findMany({
    where: { authorId: author.id },
    select: { id: true, title: true, categoryId: true }
  })
  
  console.log(`Found ${prompts.length} prompts from ${author.name} (${authorEmail})`)
  
  if (prompts.length === 0) {
    console.log('No prompts to delete')
    await prisma.$disconnect()
    return
  }
  
  let deleted = 0
  let errors = 0
  
  for (const prompt of prompts) {
    try {
      await deletePromptAndSync({ id: prompt.id })
      deleted++
      if (deleted % 25 === 0) {
        console.log(`Deleted ${deleted}/${prompts.length}...`)
      }
    } catch (error) {
      console.error(`Error deleting prompt ${prompt.id} (${prompt.title}):`, error.message)
      errors++
    }
  }
  
  console.log(`\n✅ Deleted: ${deleted}`)
  console.log(`❌ Errors: ${errors}`)
  
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})


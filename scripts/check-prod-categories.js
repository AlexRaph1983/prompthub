const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    select: { slug: true, nameRu: true, nameEn: true },
    orderBy: { slug: 'asc' }
  })
  
  console.log('=== Categories on production ===')
  console.log(`Total: ${categories.length}`)
  console.log('')
  
  for (const cat of categories) {
    console.log(`- ${cat.slug} (${cat.nameRu || cat.nameEn})`)
  }
  
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Error:', e)
  process.exit(1)
})


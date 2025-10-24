const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixAllCategories() {
  try {
    console.log('Fixing all categories...')
    
    const categories = [
      { id: 'cmh5596ta00009lm9ibrby08t', nameRu: 'Видео' },
      { id: 'cmh5596td00019lm90cvoeera', nameRu: 'Аудио' },
      { id: 'cmh5596tf00029lm99fa7nc6b', nameRu: 'Дизайн' },
      { id: 'cmh5596th00039lm9xht0vf1v', nameRu: 'Изображения' },
      { id: 'cmh5596tk00049lm95ypn9z3j', nameRu: 'Продуктивность' },
      { id: 'cmh5596tn00059lm9bfow4bzi', nameRu: 'Письмо' }
    ]
    
    for (const cat of categories) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { nameRu: cat.nameRu }
      })
      console.log('Fixed:', cat.nameRu)
    }
    
    console.log('All categories fixed!')
  } catch (error) {
    console.error('Error:', error.message)
  }
}

fixAllCategories().finally(() => prisma.$disconnect())

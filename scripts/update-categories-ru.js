const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateCategoriesRu() {
  try {
    console.log('Обновляем русские названия категорий...')
    
    // Обновляем категории с русскими названиями
    const categories = [
      { id: 'cmh5596ta00009lm9ibrby08t', nameRu: 'Видео', nameEn: 'Video' },
      { id: 'cmh5596td00019lm90cvoeera', nameRu: 'Аудио', nameEn: 'Audio' },
      { id: 'cmh5596tf00029lm99fa7nc6b', nameRu: 'Дизайн', nameEn: 'Design' },
      { id: 'cmh5596th00039lm9xht0vf1v', nameRu: 'Изображения', nameEn: 'Image' },
      { id: 'cmh5596tk00049lm95ypn9z3j', nameRu: 'Продуктивность', nameEn: 'Productivity' },
      { id: 'cmh5596tn00059lm9bfow4bzi', nameRu: 'Письмо', nameEn: 'Writing' }
    ]
    
    for (const cat of categories) {
      await prisma.category.update({
        where: { id: cat.id },
        data: {
          nameRu: cat.nameRu,
          nameEn: cat.nameEn,
          name: cat.nameRu // Основное название на русском
        }
      })
      console.log('Обновлена категория:', cat.nameRu)
    }
    
    console.log('Русские названия категорий обновлены!')
    
  } catch (error) {
    console.error('Ошибка:', error.message)
  }
}

updateCategoriesRu().finally(() => prisma.$disconnect())

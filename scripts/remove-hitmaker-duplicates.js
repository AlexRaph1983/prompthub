const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeHitMakerDuplicates() {
  try {
    console.log('🧹 Удаляем дубликаты оценок Hit Maker...\n')
    
    // Находим пользователя Hit Maker
    const hitMakerUser = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'Hit Maker'
        }
      }
    })
    
    if (!hitMakerUser) {
      console.log('❌ Пользователь Hit Maker не найден!')
      return
    }
    
    console.log(`✅ Найден пользователь: ${hitMakerUser.name} (ID: ${hitMakerUser.id})`)
    
    // Получаем все оценки Hit Maker
    const hitMakerRatings = await prisma.rating.findMany({
      where: {
        userId: hitMakerUser.id
      },
      include: {
        prompt: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n📊 Всего оценок Hit Maker: ${hitMakerRatings.length}`)
    
    if (hitMakerRatings.length === 0) {
      console.log('✅ Нет оценок для обработки')
      return
    }
    
    // Группируем по promptId для поиска дубликатов
    const ratingsByPrompt = {}
    hitMakerRatings.forEach(rating => {
      const promptId = rating.promptId
      if (!ratingsByPrompt[promptId]) {
        ratingsByPrompt[promptId] = []
      }
      ratingsByPrompt[promptId].push(rating)
    })
    
    console.log('\n📋 Обработка оценок по промптам:')
    
    let totalRemoved = 0
    const ratingsToRemove = []
    
    Object.entries(ratingsByPrompt).forEach(([promptId, ratings]) => {
      const promptTitle = ratings[0].prompt?.title || 'Unknown'
      console.log(`\n🎵 Промпт: "${promptTitle}" (ID: ${promptId})`)
      console.log(`   Оценок: ${ratings.length}`)
      
      if (ratings.length > 1) {
        console.log(`   ⚠️  Найдены дубликаты!`)
        
        // Сортируем по дате создания (оставляем самую новую)
        const sortedRatings = ratings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        // Оставляем первую (самую новую), остальные помечаем для удаления
        const toKeep = sortedRatings[0]
        const toRemove = sortedRatings.slice(1)
        
        console.log(`   ✅ Сохраняем: ID ${toKeep.id} (${toKeep.createdAt})`)
        
        toRemove.forEach(rating => {
          console.log(`   🗑️  Удаляем: ID ${rating.id} (${rating.createdAt})`)
          ratingsToRemove.push(rating.id)
          totalRemoved++
        })
      } else {
        console.log(`   ✅ Уникальная оценка: ID ${ratings[0].id}`)
      }
    })
    
    console.log(`\n📊 Найдено дубликатов: ${totalRemoved}`)
    console.log(`🗑️  Оценок для удаления: ${ratingsToRemove.length}`)
    
    if (ratingsToRemove.length === 0) {
      console.log('\n✅ Дубликатов не найдено! Все оценки уникальны.')
      return
    }
    
    // Удаляем дубликаты
    console.log('\n🗑️  Удаляем дубликаты...')
    
    const deleteResult = await prisma.rating.deleteMany({
      where: {
        id: {
          in: ratingsToRemove
        }
      }
    })
    
    console.log(`✅ Удалено ${deleteResult.count} дубликатов`)
    
    // Проверяем результат
    const remainingRatings = await prisma.rating.findMany({
      where: {
        userId: hitMakerUser.id
      },
      include: {
        prompt: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`\n📊 Осталось оценок Hit Maker: ${remainingRatings.length}`)
    console.log('\n✅ Финальные оценки Hit Maker:')
    
    remainingRatings.forEach((rating, index) => {
      console.log(`  ${index + 1}. "${rating.prompt?.title || 'Unknown'}" (ID: ${rating.id})`)
    })
    
    // Проверяем, что теперь у каждого промпта только одна оценка
    const finalRatingsByPrompt = {}
    remainingRatings.forEach(rating => {
      const promptId = rating.promptId
      if (!finalRatingsByPrompt[promptId]) {
        finalRatingsByPrompt[promptId] = 0
      }
      finalRatingsByPrompt[promptId]++
    })
    
    const hasDuplicates = Object.values(finalRatingsByPrompt).some(count => count > 1)
    
    if (hasDuplicates) {
      console.log('\n⚠️  ВНИМАНИЕ: Все еще есть дубликаты!')
    } else {
      console.log('\n✅ Успешно! Теперь у каждого промпта только одна оценка от Hit Maker.')
    }
    
  } catch (error) {
    console.error('❌ Ошибка при удалении дубликатов:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeHitMakerDuplicates()



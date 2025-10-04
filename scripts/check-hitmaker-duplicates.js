const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkHitMakerDuplicates() {
  try {
    console.log('🔍 Проверяем дубликаты оценок Hit Maker...\n')
    
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
      console.log('✅ Нет оценок для проверки')
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
    
    console.log('\n📋 Анализ оценок по промптам:')
    
    let totalDuplicates = 0
    const duplicatesToRemove = []
    
    Object.entries(ratingsByPrompt).forEach(([promptId, ratings]) => {
      const promptTitle = ratings[0].prompt?.title || 'Unknown'
      console.log(`\n🎵 Промпт: "${promptTitle}" (ID: ${promptId})`)
      console.log(`   Оценок: ${ratings.length}`)
      
      if (ratings.length > 1) {
        console.log(`   ⚠️  ДУБЛИКАТЫ НАЙДЕНЫ!`)
        totalDuplicates += ratings.length - 1
        
        // Сортируем по дате создания (оставляем самую новую)
        const sortedRatings = ratings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        // Оставляем первую (самую новую), остальные помечаем для удаления
        const toKeep = sortedRatings[0]
        const toRemove = sortedRatings.slice(1)
        
        console.log(`   ✅ Сохраняем: ID ${toKeep.id} (${toKeep.createdAt})`)
        
        toRemove.forEach(rating => {
          console.log(`   🗑️  Удаляем: ID ${rating.id} (${rating.createdAt})`)
          duplicatesToRemove.push(rating.id)
        })
      } else {
        console.log(`   ✅ Уникальная оценка: ID ${ratings[0].id}`)
      }
    })
    
    console.log(`\n📊 Итого дубликатов: ${totalDuplicates}`)
    console.log(`🗑️  Оценок для удаления: ${duplicatesToRemove.length}`)
    
    if (duplicatesToRemove.length > 0) {
      console.log('\n⚠️  Найдены дубликаты! Нужно удалить лишние оценки.')
      console.log('🔧 Запустите скрипт удаления дубликатов.')
    } else {
      console.log('\n✅ Дубликатов не найдено! Все оценки уникальны.')
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке дубликатов:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkHitMakerDuplicates()


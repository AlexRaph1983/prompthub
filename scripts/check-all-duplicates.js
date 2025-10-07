const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAllDuplicates() {
  try {
    console.log('🔍 Проверяем все дубликаты оценок в БД...\n')
    
    // Получаем все оценки
    const allRatings = await prisma.rating.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
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
    
    console.log(`📊 Всего оценок в БД: ${allRatings.length}`)
    
    if (allRatings.length === 0) {
      console.log('✅ Нет оценок для проверки')
      return
    }
    
    // Группируем по комбинации userId + promptId для поиска дубликатов
    const ratingsByUserAndPrompt = {}
    allRatings.forEach(rating => {
      const key = `${rating.userId}_${rating.promptId}`
      if (!ratingsByUserAndPrompt[key]) {
        ratingsByUserAndPrompt[key] = []
      }
      ratingsByUserAndPrompt[key].push(rating)
    })
    
    console.log('\n📋 Анализ дубликатов по пользователям и промптам:')
    
    let totalDuplicates = 0
    const duplicatesToRemove = []
    
    Object.entries(ratingsByUserAndPrompt).forEach(([key, ratings]) => {
      const [userId, promptId] = key.split('_')
      const userName = ratings[0].user?.name || 'Unknown'
      const promptTitle = ratings[0].prompt?.title || 'Unknown'
      
      if (ratings.length > 1) {
        console.log(`\n⚠️  ДУБЛИКАТЫ: ${userName} -> "${promptTitle}"`)
        console.log(`   Оценок: ${ratings.length}`)
        
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
    
    // Показываем статистику по пользователям
    console.log('\n📊 Статистика по пользователям:')
    const userStats = {}
    allRatings.forEach(rating => {
      const userName = rating.user?.name || 'Unknown'
      if (!userStats[userName]) {
        userStats[userName] = 0
      }
      userStats[userName]++
    })
    
    Object.entries(userStats).forEach(([userName, count]) => {
      console.log(`  📝 ${userName}: ${count} оценок`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка при проверке дубликатов:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllDuplicates()





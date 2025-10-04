const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function analyzeRatings() {
  try {
    console.log('🔍 Анализ оценок в БД...\n')
    
    // Получаем все таблицы
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
    `
    console.log('📋 Таблицы в БД:')
    tables.forEach(table => console.log(`  - ${table.name}`))
    console.log()
    
    // Ищем таблицы с оценками
    const ratingTables = tables.filter(table => 
      table.name.toLowerCase().includes('rating') || 
      table.name.toLowerCase().includes('review') ||
      table.name.toLowerCase().includes('score')
    )
    
    if (ratingTables.length > 0) {
      console.log('⭐ Найдены таблицы с оценками:')
      ratingTables.forEach(table => console.log(`  - ${table.name}`))
      console.log()
    }
    
    // Проверяем таблицу Rating если существует
    try {
      const ratings = await prisma.rating.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
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
      
      console.log(`📊 Всего оценок: ${ratings.length}`)
      console.log()
      
      if (ratings.length > 0) {
        console.log('👥 Пользователи с оценками:')
        const userStats = {}
        ratings.forEach(rating => {
          const userName = rating.user?.name || 'Unknown'
          if (!userStats[userName]) {
            userStats[userName] = { count: 0, ratings: [] }
          }
          userStats[userName].count++
          userStats[userName].ratings.push({
            id: rating.id,
            score: rating.score,
            promptTitle: rating.prompt?.title || 'Unknown',
            createdAt: rating.createdAt
          })
        })
        
        Object.entries(userStats).forEach(([userName, stats]) => {
          console.log(`  📝 ${userName}: ${stats.count} оценок`)
          if (userName === 'Hit maker') {
            console.log('    ✅ Это пользователь Hit maker - сохраняем его оценки')
            stats.ratings.forEach(rating => {
              console.log(`      - ID: ${rating.id}, Score: ${rating.score}, Prompt: ${rating.promptTitle}`)
            })
          } else {
            console.log('    🗑️  Тестовые оценки - будут удалены')
            stats.ratings.forEach(rating => {
              console.log(`      - ID: ${rating.id}, Score: ${rating.score}, Prompt: ${rating.promptTitle}`)
            })
          }
        })
        
        console.log()
        console.log('📈 Статистика по оценкам:')
        const scoreStats = {}
        ratings.forEach(rating => {
          if (!scoreStats[rating.score]) {
            scoreStats[rating.score] = 0
          }
          scoreStats[rating.score]++
        })
        
        Object.entries(scoreStats).forEach(([score, count]) => {
          console.log(`  ${score} звезд: ${count} оценок`)
        })
      }
      
    } catch (error) {
      console.log('❌ Ошибка при получении оценок:', error.message)
    }
    
    // Проверяем другие возможные таблицы
    const possibleTables = ['Review', 'Score', 'Vote', 'Like']
    for (const tableName of possibleTables) {
      try {
        const count = await prisma[tableName.toLowerCase()].count()
        console.log(`📊 ${tableName}: ${count} записей`)
      } catch (error) {
        // Таблица не существует
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка анализа:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeRatings()

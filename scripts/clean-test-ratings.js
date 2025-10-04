const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanTestRatings() {
  try {
    console.log('🧹 Начинаем очистку тестовых оценок...\n')
    
    // Сначала найдем пользователя "Hit Maker" (точное имя)
    const hitMakerUser = await prisma.user.findFirst({
      where: {
        name: {
          contains: 'Hit Maker'
        }
      }
    })
    
    if (!hitMakerUser) {
      console.log('❌ Пользователь "Hit Maker" не найден!')
      console.log('🔍 Ищем похожих пользователей...')
      
      const similarUsers = await prisma.user.findMany({
        where: {
          name: {
            contains: 'Hit'
          }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      })
      
      console.log('👥 Найденные пользователи с "Hit" в имени:')
      similarUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Name: "${user.name}", Email: ${user.email}`)
      })
      
      if (similarUsers.length === 0) {
        console.log('❌ Пользователи с "Hit" в имени не найдены!')
        console.log('🔍 Показываем всех пользователей...')
        
        const allUsers = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true
          },
          take: 10
        })
        
        console.log('👥 Первые 10 пользователей:')
        allUsers.forEach(user => {
          console.log(`  - ID: ${user.id}, Name: "${user.name}", Email: ${user.email}`)
        })
        
        return
      }
    }
    
    console.log(`✅ Найден пользователь Hit Maker: ${hitMakerUser.name} (ID: ${hitMakerUser.id})`)
    
    // Получаем все оценки
    const allRatings = await prisma.rating.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    console.log(`\n📊 Всего оценок в БД: ${allRatings.length}`)
    
    // Разделяем на оценки Hit Maker и тестовые
    const hitMakerRatings = allRatings.filter(rating => rating.user.id === hitMakerUser.id)
    const testRatings = allRatings.filter(rating => rating.user.id !== hitMakerUser.id)
    
    console.log(`✅ Оценки Hit Maker: ${hitMakerRatings.length}`)
    console.log(`🗑️  Тестовые оценки для удаления: ${testRatings.length}`)
    
    if (testRatings.length === 0) {
      console.log('✅ Нет тестовых оценок для удаления!')
      return
    }
    
    // Показываем детали тестовых оценок
    console.log('\n🗑️  Тестовые оценки для удаления:')
    const testUserStats = {}
    testRatings.forEach(rating => {
      const userName = rating.user.name
      if (!testUserStats[userName]) {
        testUserStats[userName] = 0
      }
      testUserStats[userName]++
    })
    
    Object.entries(testUserStats).forEach(([userName, count]) => {
      console.log(`  📝 ${userName}: ${count} оценок`)
    })
    
    // Показываем оценки Hit Maker которые сохраним
    console.log('\n✅ Оценки Hit Maker (сохраняем):')
    hitMakerRatings.forEach(rating => {
      console.log(`  - ID: ${rating.id}, Score: ${rating.score}, Prompt ID: ${rating.promptId}`)
    })
    
    // Подтверждение удаления
    console.log(`\n⚠️  ВНИМАНИЕ: Будет удалено ${testRatings.length} тестовых оценок!`)
    console.log(`✅ Сохранится ${hitMakerRatings.length} оценок пользователя Hit Maker`)
    
    // Удаляем тестовые оценки
    const deleteResult = await prisma.rating.deleteMany({
      where: {
        userId: {
          not: hitMakerUser.id
        }
      }
    })
    
    console.log(`\n✅ Удалено ${deleteResult.count} тестовых оценок`)
    
    // Проверяем результат
    const remainingRatings = await prisma.rating.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`\n📊 Осталось оценок: ${remainingRatings.length}`)
    console.log('👥 Пользователи с оставшимися оценками:')
    
    const remainingUserStats = {}
    remainingRatings.forEach(rating => {
      const userName = rating.user.name
      if (!remainingUserStats[userName]) {
        remainingUserStats[userName] = 0
      }
      remainingUserStats[userName]++
    })
    
    Object.entries(remainingUserStats).forEach(([userName, count]) => {
      console.log(`  📝 ${userName}: ${count} оценок`)
    })
    
    console.log('\n✅ Очистка завершена успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка при очистке:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanTestRatings()

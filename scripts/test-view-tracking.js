const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function testViewTracking() {
  try {
    console.log('🔍 Тестируем отслеживание просмотров...')
    
    // Получаем промпт для тестирования
    const testPrompt = await prisma.prompt.findFirst({
      where: {
        title: { contains: 'SORA' }
      },
      select: {
        id: true,
        title: true,
        views: true
      }
    })
    
    if (!testPrompt) {
      console.log('❌ Промпт для тестирования не найден!')
      return
    }
    
    console.log(`\n📝 Тестовый промпт:`)
    console.log(`   ID: ${testPrompt.id}`)
    console.log(`   Название: ${testPrompt.title}`)
    console.log(`   Текущие просмотры: ${testPrompt.views}`)
    
    // Тестируем API view-token
    console.log('\n🔧 Тестируем API view-token...')
    try {
      const tokenResponse = await fetch('http://localhost:3000/api/view-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardId: testPrompt.id, 
          fingerprint: 'test-fingerprint-123' 
        })
      })
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        console.log(`✅ View-token получен: ${tokenData.viewToken}`)
        
        // Тестируем API track-view
        console.log('\n🔧 Тестируем API track-view...')
        const trackResponse = await fetch('http://localhost:3000/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cardId: testPrompt.id, 
            viewToken: tokenData.viewToken 
          })
        })
        
        if (trackResponse.ok) {
          const trackData = await trackResponse.json()
          console.log(`✅ Просмотр засчитан: ${trackData.views} просмотров`)
          
          // Проверяем обновление в БД
          const updatedPrompt = await prisma.prompt.findUnique({
            where: { id: testPrompt.id },
            select: { views: true }
          })
          
          console.log(`\n📊 Результат:`)
          console.log(`   Просмотры до: ${testPrompt.views}`)
          console.log(`   Просмотры после: ${updatedPrompt.views}`)
          console.log(`   Разница: ${updatedPrompt.views - testPrompt.views}`)
          
          if (updatedPrompt.views > testPrompt.views) {
            console.log('✅ Просмотры успешно обновлены!')
          } else {
            console.log('❌ Просмотры не обновились!')
          }
          
        } else {
          const errorData = await trackResponse.json()
          console.log(`❌ Ошибка track-view: ${trackResponse.status} - ${errorData.error}`)
        }
        
      } else {
        const errorData = await tokenResponse.json()
        console.log(`❌ Ошибка view-token: ${tokenResponse.status} - ${errorData.error}`)
      }
      
    } catch (error) {
      console.log(`❌ Ошибка при тестировании API: ${error.message}`)
    }
    
  } catch (e) {
    console.error('❌ Ошибка при тестировании отслеживания просмотров:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

testViewTracking()

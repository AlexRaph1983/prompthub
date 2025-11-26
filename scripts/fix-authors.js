const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function fixAuthors() {
  try {
    console.log('🔧 Исправляем имена авторов...')
    
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    console.log(`Найдено пользователей: ${users.length}`)
    
    // Проверяем, есть ли пользователь "User5"
    const user5 = users.find(u => u.name === 'User5')
    if (user5) {
      console.log(`Найден пользователь User5: ${user5.id}`)
      
      // Обновляем имя на PromptMaster
      await prisma.user.update({
        where: { id: user5.id },
        data: { name: 'PromptMaster' }
      })
      
      console.log('✅ Имя пользователя изменено с User5 на PromptMaster')
    }
    
    // Проверяем, есть ли пользователь "promptmaster"
    const promptmaster = users.find(u => u.name === 'promptmaster')
    if (promptmaster) {
      console.log(`Найден пользователь promptmaster: ${promptmaster.id}`)
      
      // Обновляем имя на PromptMaster
      await prisma.user.update({
        where: { id: promptmaster.id },
        data: { name: 'PromptMaster' }
      })
      
      console.log('✅ Имя пользователя изменено с promptmaster на PromptMaster')
    }
    
    // Получаем обновленный список пользователей
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    console.log('\n=== ОБНОВЛЕННЫЕ ПОЛЬЗОВАТЕЛИ ===')
    updatedUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email})`)
    })
    
    console.log('\n🎉 Имена авторов исправлены!')
    
  } catch (e) {
    console.error('❌ Ошибка при исправлении авторов:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuthors()

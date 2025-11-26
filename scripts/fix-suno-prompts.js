const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function fixSunoPrompts() {
  try {
    console.log('🔧 Исправляем промпты Suno...')
    
    // Получаем все промпты с упоминанием Suno
    const sunoPrompts = await prisma.prompt.findMany({
      where: {
        OR: [
          { title: { contains: 'Suno' } },
          { description: { contains: 'Suno' } },
          { prompt: { contains: 'Suno' } },
          { tags: { contains: 'Suno' } }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`\n🎵 Найдено ${sunoPrompts.length} промптов с упоминанием Suno`)
    
    let fixedCount = 0
    
    for (const prompt of sunoPrompts) {
      console.log(`\n🔍 Проверяем промпт: ${prompt.title}`)
      console.log(`   Автор: ${prompt.author.name || prompt.author.email}`)
      console.log(`   Просмотры: ${prompt.views}`)
      console.log(`   Содержимое: ${prompt.prompt ? 'Есть' : 'НЕТ!'}`)
      
      // Проверяем, есть ли содержимое
      if (!prompt.prompt || prompt.prompt.trim() === '') {
        console.log(`   ❌ Промпт без содержимого!`)
        
        // Пытаемся восстановить содержимое из шаблона
        const templateContent = getSunoTemplateContent(prompt.title)
        if (templateContent) {
          console.log(`   🔧 Восстанавливаем содержимое...`)
          await prisma.prompt.update({
            where: { id: prompt.id },
            data: {
              prompt: templateContent,
              description: prompt.description || 'Промпт для создания музыки в Suno'
            }
          })
          console.log(`   ✅ Содержимое восстановлено`)
          fixedCount++
        } else {
          console.log(`   ⚠️ Не удалось найти шаблон для восстановления`)
        }
      } else {
        console.log(`   ✅ Промпт имеет содержимое`)
      }
      
      // Увеличиваем просмотры для видимости
      if (prompt.views === 0) {
        console.log(`   🔧 Увеличиваем просмотры для видимости...`)
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: {
            views: 1
          }
        })
        console.log(`   ✅ Просмотры увеличены`)
        fixedCount++
      }
    }
    
    console.log(`\n🎉 Исправлено ${fixedCount} промптов Suno!`)
    
  } catch (e) {
    console.error('❌ Ошибка при исправлении промптов Suno:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

function getSunoTemplateContent(title) {
  const templates = {
    'Создание песни в SUNO на русском языке': 'Создай песню в SUNO на русском языке в стиле {жанр} с темпом {bpm} BPM. Тема: {тема}. Добавь эмоциональный вокал и запоминающийся припев.',
    'Lofi Hip-Hop трек для релаксации и отдыха': 'Создай Lo-Fi Hip-Hop трек для релаксации с темпом 80-90 BPM. Стиль: расслабляющий, атмосферный. Добавь мягкие мелодии и успокаивающие звуки.',
    'Музыкальный трек в стиле Lo-Fi': 'Создай Lo-Fi трек в стиле {жанр} с темпом {bpm} BPM. Настроение: {настроение}. Добавь атмосферные звуки и мелодичные инструменты.',
    'Создание музыкального трека в SUNO с параметрами BPM': 'Создай музыкальный трек в SUNO с темпом {bpm} BPM в стиле {жанр}. Настроение: {настроение}. Добавь {тип_вокала} вокал и {атмосфера} атмосферу.'
  }
  
  return templates[title] || 'Создай музыкальный трек в Suno с указанными параметрами.'
}

fixSunoPrompts()

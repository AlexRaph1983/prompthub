const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importSunoPrompts() {
  try {
    console.log('🎵 Начинаем импорт SUNO промптов...')
    
    // Читаем JSON файл
    const filePath = path.join(__dirname, '..', 'suno_prompts.json')
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    console.log(`📁 Найдено ${data.items.length} промптов для импорта`)
    
    let imported = 0
    let skipped = 0
    
    for (const item of data.items) {
      try {
        // Проверяем, существует ли уже такой промпт
        const existing = await prisma.prompt.findFirst({
          where: {
            title: item.title,
            authorId: 'suno-master-001' // Используем существующего автора
          }
        })
        
        if (existing) {
          console.log(`⏭️  Пропускаем: ${item.title} (уже существует)`)
          skipped++
          continue
        }
        
        // Создаем новый промпт
        await prisma.prompt.create({
          data: {
            title: item.title,
            description: item.summary || item.title,
            prompt: item.prompt_text,
            model: item.model || 'any',
            lang: item.language === 'ru' ? 'Русский' : 
                  item.language === 'en' ? 'English' : 'multi',
            category: item.category || 'audio',
            tags: item.tags ? item.tags.join(',') : '',
            license: item.license || 'CC-BY',
            authorId: 'suno-master-001' // Используем существующего автора
          }
        })
        
        console.log(`✅ Импортирован: ${item.title}`)
        imported++
        
      } catch (error) {
        console.error(`❌ Ошибка при импорте "${item.title}":`, error.message)
      }
    }
    
    console.log(`\n🎉 Импорт завершен!`)
    console.log(`✅ Импортировано: ${imported}`)
    console.log(`⏭️  Пропущено: ${skipped}`)
    
    // Обновляем статистику
    const totalPrompts = await prisma.prompt.count()
    console.log(`📊 Всего промптов в базе: ${totalPrompts}`)
    
  } catch (error) {
    console.error('❌ Ошибка при импорте:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importSunoPrompts()
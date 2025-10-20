const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importNewPrompts() {
  try {
    console.log('🚀 Начинаем импорт новых промптов...')
    
    // Читаем JSON файл
    const filePath = path.join(__dirname, '..', 'new_prompts_batch.json')
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    console.log(`📁 Найдено ${data.items.length} промптов для импорта`)
    
    let imported = 0
    let skipped = 0
    let errors = 0
    
    // Проверяем, существует ли пользователь PromptMaster
    let promptMasterUser = await prisma.user.findFirst({
      where: { name: 'PromptMaster' }
    })
    
    if (!promptMasterUser) {
      // Создаем пользователя PromptMaster если его нет
      promptMasterUser = await prisma.user.create({
        data: {
          id: 'promptmaster-' + Date.now(),
          name: 'PromptMaster',
          email: 'promptmaster@prompthub.com',
          bio: 'Автор промптов для PromptHub',
          reputationScore: 100,
          reputationPromptCount: 0
        }
      })
      console.log('✅ Создан пользователь PromptMaster')
    }
    
    for (const item of data.items) {
      try {
        // Проверяем, существует ли уже такой промпт
        const existing = await prisma.prompt.findFirst({
          where: {
            title: item.title,
            authorId: promptMasterUser.id
          }
        })
        
        if (existing) {
          console.log(`⏭️  Пропускаем: ${item.title} (уже существует)`)
          skipped++
          continue
        }
        
        // Маппинг категорий из старого формата в новый
        const categoryMapping = {
          'video': 'Video',
          'audio': 'Audio', 
          'image': 'Image',
          'design': 'Design',
          'writing': 'Writing',
          'utilities': 'Productivity'
        }
        
        const mappedCategory = categoryMapping[item.category] || 'Creative'
        
        // Маппинг языков
        const languageMapping = {
          'ru': 'Русский',
          'en': 'English',
          'multi': 'English'
        }
        
        const mappedLanguage = languageMapping[item.language] || 'English'
        
        // Создаем новый промпт
        await prisma.prompt.create({
          data: {
            title: item.title,
            description: item.summary || item.title,
            prompt: item.prompt_text || item.prompt || '',
            model: item.model || 'GPT-4o',
            lang: mappedLanguage,
            category: mappedCategory,
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
            license: item.license || 'CC-BY',
            authorId: promptMasterUser.id,
            averageRating: 0,
            totalRatings: 0,
            views: 0
          }
        })
        
        console.log(`✅ Импортирован: ${item.title}`)
        imported++
        
      } catch (error) {
        console.error(`❌ Ошибка при импорте "${item.title}":`, error.message)
        errors++
      }
    }
    
    console.log('\n📊 Результаты импорта:')
    console.log(`✅ Импортировано: ${imported}`)
    console.log(`⏭️  Пропущено: ${skipped}`)
    console.log(`❌ Ошибок: ${errors}`)
    
    if (imported > 0) {
      console.log('\n🎉 Импорт завершен успешно!')
    }
    
  } catch (error) {
    console.error('💥 Критическая ошибка импорта:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем импорт
importNewPrompts()

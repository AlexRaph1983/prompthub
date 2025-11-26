const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function checkServerData() {
  try {
    console.log('🔍 Проверяем данные на сервере...')
    
    const prompts = await prisma.prompt.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        prompt: true,
        authorId: true,
        author: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`\n=== НАЙДЕНО ПРОМПТОВ: ${prompts.length} ===`)
    
    prompts.forEach((prompt, i) => {
      console.log(`\n--- Промпт ${i + 1} ---`)
      console.log(`ID: ${prompt.id}`)
      console.log(`Title: "${prompt.title}"`)
      console.log(`Description: "${prompt.description}" (длина: ${prompt.description?.length || 0})`)
      console.log(`Prompt: "${prompt.prompt}" (длина: ${prompt.prompt?.length || 0})`)
      console.log(`Author ID: ${prompt.authorId}`)
      console.log(`Author Name: "${prompt.author?.name || 'НЕТ ИМЕНИ'}"`)
      
      // Проверяем, есть ли проблемы с данными
      const hasDescription = prompt.description && prompt.description.length > 0
      const hasPrompt = prompt.prompt && prompt.prompt.length > 0
      const hasAuthorName = prompt.author?.name && prompt.author.name.length > 0
      
      console.log(`✅ Description: ${hasDescription ? 'ЕСТЬ' : 'НЕТ'}`)
      console.log(`✅ Prompt: ${hasPrompt ? 'ЕСТЬ' : 'НЕТ'}`)
      console.log(`✅ Author Name: ${hasAuthorName ? 'ЕСТЬ' : 'НЕТ'}`)
      
      if (!hasDescription) {
        console.log(`❌ ПРОБЛЕМА: Промпт ${i + 1} не имеет описания!`)
      }
      if (!hasPrompt) {
        console.log(`❌ ПРОБЛЕМА: Промпт ${i + 1} не имеет содержимого!`)
      }
      if (!hasAuthorName) {
        console.log(`❌ ПРОБЛЕМА: Промпт ${i + 1} не имеет имени автора!`)
      }
    })
    
    // Статистика
    const totalPrompts = prompts.length
    const promptsWithDescription = prompts.filter(p => p.description && p.description.length > 0).length
    const promptsWithContent = prompts.filter(p => p.prompt && p.prompt.length > 0).length
    const promptsWithAuthorName = prompts.filter(p => p.author?.name && p.author.name.length > 0).length
    
    console.log(`\n=== СТАТИСТИКА ===`)
    console.log(`Всего промптов: ${totalPrompts}`)
    console.log(`С описанием: ${promptsWithDescription} (${Math.round(promptsWithDescription/totalPrompts*100)}%)`)
    console.log(`С содержимым: ${promptsWithContent} (${Math.round(promptsWithContent/totalPrompts*100)}%)`)
    console.log(`С именем автора: ${promptsWithAuthorName} (${Math.round(promptsWithAuthorName/totalPrompts*100)}%)`)
    
    if (promptsWithDescription < totalPrompts) {
      console.log(`\n❌ ПРОБЛЕМА: ${totalPrompts - promptsWithDescription} промптов без описания!`)
    }
    if (promptsWithContent < totalPrompts) {
      console.log(`\n❌ ПРОБЛЕМА: ${totalPrompts - promptsWithContent} промптов без содержимого!`)
    }
    if (promptsWithAuthorName < totalPrompts) {
      console.log(`\n❌ ПРОБЛЕМА: ${totalPrompts - promptsWithAuthorName} промптов без имени автора!`)
    }
    
    return { ok: true, prompts }
  } catch (e) {
    console.error('❌ Ошибка при проверке данных на сервере:', e.message)
    return { ok: false, error: e.message }
  } finally {
    await prisma.$disconnect()
  }
}

checkServerData()

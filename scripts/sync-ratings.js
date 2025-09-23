const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function syncRatings() {
  console.log('=== Syncing rating cache ===')
  
  try {
    // Получаем все промпты
    const prompts = await prisma.prompt.findMany({
      select: { id: true, title: true, averageRating: true, totalRatings: true }
    })
    
    console.log(`Found ${prompts.length} prompts`)
    
    let updated = 0
    
    for (const prompt of prompts) {
      // Получаем актуальные данные из таблицы Rating
      const ratings = await prisma.rating.findMany({
        where: { promptId: prompt.id },
        select: { value: true }
      })
      
      const count = ratings.length
      const average = count > 0 
        ? Number((ratings.reduce((sum, r) => sum + r.value, 0) / count).toFixed(1))
        : 0
      
      // Проверяем, нужно ли обновление
      if (prompt.averageRating !== average || prompt.totalRatings !== count) {
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { 
            averageRating: average, 
            totalRatings: count 
          }
        })
        
        console.log(`Updated ${prompt.title}: ${prompt.averageRating}→${average}, ${prompt.totalRatings}→${count}`)
        updated++
      }
    }
    
    console.log(`✅ Sync completed. Updated ${updated} prompts.`)
    
  } catch (error) {
    console.error('❌ Error syncing ratings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncRatings()

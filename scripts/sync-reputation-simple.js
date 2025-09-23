const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Простая функция расчета репутации (копия из lib/reputation.ts)
function calculateReputation(inputs) {
  const { avgPromptRating, ratingsCount, promptCount, likesCount, savesCount, commentsCount } = inputs

  // Базовые веса
  const ratingWeight = 0.4
  const promptWeight = 0.3
  const engagementWeight = 0.3

  // Нормализация рейтинга (0-5 -> 0-100)
  const ratingScore = (avgPromptRating / 5) * 100

  // Нормализация количества промптов (с убывающей отдачей)
  const promptScore = Math.min(promptCount * 2, 100)

  // Нормализация вовлеченности (лайки, сохранения, комментарии)
  const engagementScore = Math.min(
    Math.sqrt(likesCount) * 5 + 
    Math.sqrt(savesCount) * 3 + 
    Math.sqrt(commentsCount) * 2, 
    100
  )

  // Итоговый балл
  const score = Math.round(
    ratingScore * ratingWeight + 
    promptScore * promptWeight + 
    engagementScore * engagementWeight
  )

  // Определение тира
  const tier = score >= 85 ? 'platinum' : 
               score >= 65 ? 'gold' : 
               score >= 40 ? 'silver' : 'bronze'

  return { score0to100: score, tier }
}

async function syncReputation() {
  console.log('=== Syncing user reputation ===')
  
  try {
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        reputationScore: true
      }
    })
    
    console.log(`Found ${users.length} users`)
    
    let updated = 0
    
    for (const user of users) {
      // Получаем статистику пользователя
      const [prompts, likes, saves, comments] = await Promise.all([
        prisma.prompt.findMany({
          where: { authorId: user.id },
          select: { averageRating: true, totalRatings: true }
        }),
        prisma.like.count({ where: { user: { id: user.id } } }),
        prisma.save.count({ where: { user: { id: user.id } } }),
        prisma.comment.count({ where: { user: { id: user.id } } })
      ])
      
      // Рассчитываем средний рейтинг промптов
      const promptRatings = prompts.flatMap(p => Array(p.totalRatings).fill(p.averageRating))
      const avgPromptRating = promptRatings.length > 0 
        ? promptRatings.reduce((sum, r) => sum + r, 0) / promptRatings.length 
        : 0
      
      // Рассчитываем репутацию
      const breakdown = calculateReputation({
        avgPromptRating,
        ratingsCount: promptRatings.length,
        promptCount: prompts.length,
        likesCount: likes,
        savesCount: saves,
        commentsCount: comments,
      })
      
      const newScore = breakdown.score0to100
      
      // Проверяем, нужно ли обновление
      if (user.reputationScore !== newScore) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            reputationScore: newScore,
            reputationPromptCount: prompts.length,
            reputationRatingsSum: promptRatings.reduce((sum, r) => sum + r, 0),
            reputationRatingsCnt: promptRatings.length,
            reputationLikesCnt: likes,
            reputationSavesCnt: saves,
            reputationCommentsCnt: comments
          }
        })
        
        console.log(`Updated ${user.name || user.id}: ${user.reputationScore}→${newScore}`)
        updated++
      }
    }
    
    console.log(`✅ Sync completed. Updated ${updated} users.`)
    
  } catch (error) {
    console.error('❌ Error syncing reputation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncReputation()

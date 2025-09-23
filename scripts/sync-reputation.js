const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Импортируем функцию расчета репутации
const { calculateReputation } = require('../lib/reputation.ts')

async function syncReputation() {
  console.log('=== Syncing user reputation ===')
  
  try {
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        reputationScore: true,
        reputationPromptCount: true,
        reputationRatingsSum: true,
        reputationRatingsCnt: true,
        reputationLikesCnt: true,
        reputationSavesCnt: true,
        reputationCommentsCnt: true
      }
    })
    
    console.log(`Found ${users.length} users`)
    
    let updated = 0
    
    for (const user of users) {
      // Получаем статистику пользователя
      const [prompts, ratings, likes, saves, comments] = await Promise.all([
        prisma.prompt.findMany({
          where: { authorId: user.id },
          select: { averageRating: true, totalRatings: true }
        }),
        prisma.rating.findMany({
          where: { user: { id: user.id } },
          select: { value: true }
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

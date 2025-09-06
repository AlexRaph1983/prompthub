export interface ReputationInputs {
  avgPromptRating: number // 0..5
  ratingsCount: number
  promptCount: number
  likesCount: number
  savesCount: number
  commentsCount: number
}

export interface ReputationBreakdown extends ReputationInputs {
  score0to100: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

// Weighted formula balancing quality and quantity.
// We cap contributions to avoid spamming: diminishing returns via sqrt/log.
export function calculateReputation(inputs: ReputationInputs): ReputationBreakdown {
  const { avgPromptRating, ratingsCount, promptCount, likesCount, savesCount, commentsCount } = inputs

  if (process.env.NODE_ENV === 'development') {
    console.log('Calculating reputation with inputs:', inputs)
  }

  // Quality: map 0..5 -> 0..60, weighted by normalized ratings volume.
  const qualityBase = (Math.max(0, Math.min(5, avgPromptRating)) / 5) * 60
  const ratingsWeight = Math.min(1, Math.log10(1 + ratingsCount) / 1.2) // saturates ~100 ratings
  const quality = qualityBase * ratingsWeight

  // Quantity: prompt count contributes up to 20 using sqrt to diminish returns
  const quantity = Math.min(20, Math.sqrt(promptCount) * 6)

  // Engagement: likes/saves/comments up to 20 total using log/weights
  const likesScore = Math.min(10, Math.log2(1 + likesCount))
  const savesScore = Math.min(6, Math.log2(1 + savesCount))
  const commentsScore = Math.min(6, Math.log2(1 + commentsCount))
  const engagement = Math.min(20, likesScore + savesScore + commentsScore)

  let score0to100 = Math.round(Math.max(0, Math.min(100, quality + quantity + engagement)))

  const tier: ReputationBreakdown['tier'] = score0to100 >= 85
    ? 'platinum'
    : score0to100 >= 65
    ? 'gold'
    : score0to100 >= 40
    ? 'silver'
    : 'bronze'

  const result = {
    avgPromptRating,
    ratingsCount,
    promptCount,
    likesCount,
    savesCount,
    commentsCount,
    score0to100,
    tier,
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Reputation calculation breakdown:', {
      qualityBase,
      ratingsWeight,
      quality,
      quantity,
      likesScore,
      savesScore,
      commentsScore,
      engagement,
      score0to100,
      tier,
    })
  }

  return result
}



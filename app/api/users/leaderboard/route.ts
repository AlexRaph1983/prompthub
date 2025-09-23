import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Получаем пользователей с кэшированной репутацией
    const usersWithReputation = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        image: true, 
        reputationScore: true 
      },
      where: {
        OR: [
          { prompts: { some: {} } },
          { ratings: { some: {} } },
        ],
        reputationScore: { gt: 0 } // Только пользователи с репутацией > 0
      },
    })

    const rows: Array<{ id: string; name: string | null; image: string | null; reputationScore: number }> = 
      usersWithReputation.map(user => ({
        id: user.id,
        name: user.name,
        image: user.image,
        reputationScore: user.reputationScore
      }))

    const nonZero = rows.filter(r => r.reputationScore > 0)
    nonZero.sort((a, b) => b.reputationScore - a.reputationScore)
    return NextResponse.json(nonZero.slice(0, 100))
  } catch (e) {
    // Никогда не падаем — возвращаем пустой список
    return NextResponse.json([], { status: 200 })
  }
}



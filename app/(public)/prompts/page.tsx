import { unstable_setRequestLocale } from 'next-intl/server'
import InfinitePromptList from '@/components/InfinitePromptList'
import { promptRepository } from '@/lib/repositories/promptRepository'
import { PromptCardDTO } from '@/lib/repositories/promptRepository'
import { prisma } from '@/lib/prisma'

async function getInitialPrompts(authorId?: string): Promise<{
  prompts: PromptCardDTO[]
  nextCursor: string | null
}> {
  try {
    const result = await promptRepository.listPrompts({
      limit: 20,
      cursor: null,
      sort: 'createdAt',
      order: 'desc',
      authorId: authorId || undefined,
    })

    return {
      prompts: result.items,
      nextCursor: result.nextCursor,
    }
  } catch (error) {
    console.error('Error fetching initial prompts:', error)
    return {
      prompts: [],
      nextCursor: null,
    }
  }
}

async function getAuthorInfo(authorId?: string) {
  if (!authorId) return null
  try {
    const user = await prisma.user.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        telegram: true,
        github: true,
        twitter: true,
        linkedin: true,
        reputationScore: true,
        reputationPromptCount: true,
        reputationLikesCnt: true,
        reputationSavesCnt: true,
        reputationRatingsCnt: true,
        reputationCommentsCnt: true,
      },
    })
    return user
  } catch (error) {
    console.error('Error fetching author info:', error)
    return null
  }
}

export default async function PromptsPage({
  searchParams,
  params: { locale }
}: {
  searchParams: { authorId?: string }
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)
  const authorId = searchParams.authorId

  const { prompts, nextCursor } = await getInitialPrompts(authorId)
  const authorInfo = await getAuthorInfo(authorId)

  return (
    <InfinitePromptList
      initialPrompts={prompts}
      initialNextCursor={nextCursor}
      authorId={authorId}
      authorInfo={authorInfo as any}
      locale={locale}
    />
  )
} 
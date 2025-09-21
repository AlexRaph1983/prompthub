import { unstable_setRequestLocale } from 'next-intl/server'
import InfinitePromptList from '@/components/InfinitePromptList'
import { promptRepository } from '@/lib/repositories/promptRepository'
import { PromptCardDTO } from '@/lib/repositories/promptRepository'

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

  return (
    <InfinitePromptList
      initialPrompts={prompts}
      initialNextCursor={nextCursor}
      authorId={authorId}
      locale={locale}
    />
  )
} 
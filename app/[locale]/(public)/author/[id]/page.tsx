import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { promptRepository } from '@/lib/repositories/promptRepository'
import InfinitePromptList from '@/components/InfinitePromptList'
import type { Locale } from '@/i18n/index'
import { generateBreadcrumbSchema, generateItemListSchema } from '@/lib/structured-data'

interface PageProps {
  params: { locale: Locale; id: string }
}

async function getAuthorInfo(authorId: string) {
  return prisma.user.findUnique({
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
    }
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = params
  const canonicalLocale: Locale = 'ru'
  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'

  const author = await getAuthorInfo(id)
  if (!author) {
    return {
      title: 'Автор не найден | PromptHub',
      description: 'Запрашиваемый автор не найден',
      robots: { index: false, follow: false }
    }
  }

  const name = author.name || 'Автор'
  const title = locale === 'ru'
    ? `${name} — автор промптов на PromptHub`
    : `${name} — prompt author on PromptHub`
  const description = locale === 'ru'
    ? `Промпты автора ${name} на PromptHub. Профиль, статистика и список промптов.`
    : `Prompts by ${name} on PromptHub. Profile, stats and prompt list.`

  const canonical = `${baseUrl}/${canonicalLocale}/author/${id}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'PromptHub',
      locale: 'ru_RU',
      type: 'profile'
    },
    twitter: {
      card: 'summary',
      title,
      description
    },
    robots: {
      index: locale === canonicalLocale,
      follow: true
    }
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { locale, id } = params
  unstable_setRequestLocale(locale)

  const author = await getAuthorInfo(id)
  if (!author) {
    notFound()
  }

  const { items: prompts, nextCursor } = await promptRepository.listPrompts({
    limit: 20,
    cursor: null,
    sort: 'createdAt',
    order: 'desc',
    authorId: id
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_HOST || 'https://prompt-hub.site'
  const canonicalLocale: Locale = 'ru'
  const canonical = `${baseUrl}/${canonicalLocale}/author/${id}`

  const breadcrumbData = generateBreadcrumbSchema(
    [
      { name: 'Главная', url: `${baseUrl}/${canonicalLocale}/home` },
      { name: 'Авторы', url: `${baseUrl}/${canonicalLocale}/leaders` },
      { name: author.name || 'Автор', url: canonical }
    ],
    canonicalLocale
  )

  const itemListData = generateItemListSchema(
    `Промпты автора ${author.name || ''}`.trim(),
    `Список промптов автора ${author.name || ''}`.trim(),
    canonical,
    prompts.map(prompt => ({
      name: prompt.title,
      url: `${baseUrl}/${canonicalLocale}/prompt/${prompt.id}`
    })),
    author.reputationPromptCount || prompts.length
  )

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name || 'Автор',
    url: canonical,
    ...(author.image ? { image: author.image } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    sameAs: [author.website, author.telegram ? `https://t.me/${author.telegram.replace('@', '')}` : undefined, author.github ? `https://github.com/${author.github}` : undefined, author.twitter ? `https://twitter.com/${author.twitter.replace('@', '')}` : undefined, author.linkedin ? `https://linkedin.com/in/${author.linkedin}` : undefined].filter(Boolean)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          {author.name || 'Автор'}
        </h1>
      </div>
      <InfinitePromptList
        initialPrompts={prompts}
        initialNextCursor={nextCursor}
        authorId={id}
        authorInfo={author as any}
        locale={locale}
      />
    </>
  )
}

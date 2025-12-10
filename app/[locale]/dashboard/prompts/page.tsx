import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { unstable_setRequestLocale } from 'next-intl/server'
import MyPromptsClient from './MyPromptsClient'

export const dynamic = 'force-dynamic'

export default async function MyPromptsPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  unstable_setRequestLocale(locale)

  const session = await auth()
  
  if (!session?.user) {
    redirect(`/${locale}/api/auth/signin`)
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      authorId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const serializedPrompts = prompts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    prompt: p.prompt,
    model: p.model,
    lang: p.lang,
    category: p.category,
    license: p.license,
    tags: p.tags || '',
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt?.toISOString() ?? null,
  }))

  return <MyPromptsClient prompts={serializedPrompts} />
}

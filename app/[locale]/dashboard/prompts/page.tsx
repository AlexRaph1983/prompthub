import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function MyPromptsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      authorId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Мои промпты</h1>
        <p className="text-gray-600 mt-2">Управление вашими опубликованными промптами</p>
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет опубликованных промптов</h3>
              <p className="text-gray-500">Создайте свой первый промпт, чтобы он появился здесь</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{prompt.title}</CardTitle>
                    <p className="text-gray-600 mt-2">{prompt.description}</p>
                  </div>
                  <Badge variant="secondary">{prompt.model}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Промпт:</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.prompt}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{prompt.category}</Badge>
                    <Badge variant="outline">{prompt.lang}</Badge>
                    <Badge variant="outline">{prompt.license}</Badge>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Создан: <time suppressHydrationWarning>{new Date(prompt.createdAt).toISOString().slice(0,10)}</time>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

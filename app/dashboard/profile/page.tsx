import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserReputationBadge } from '@/components/UserReputationBadge'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: {
    reputationScore: true,
    reputationPromptCount: true,
    reputationRatingsCnt: true,
    reputationLikesCnt: true,
    reputationSavesCnt: true,
    reputationCommentsCnt: true,
  }})

  const tier = (user?.reputationScore ?? 0) >= 85 ? 'platinum' : (user?.reputationScore ?? 0) >= 65 ? 'gold' : (user?.reputationScore ?? 0) >= 40 ? 'silver' : 'bronze'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Управление вашим профилем</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Информация о пользователе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={(session.user as any).image || ''} alt={session.user.name || 'User'} />
                <AvatarFallback>
                  {session.user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Имя</label>
                  <p className="text-lg font-semibold">{session.user.name || 'Не указано'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{session.user.email || 'Не указано'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID пользователя</label>
                  <p className="text-sm text-gray-600 font-mono">{session.user.id}</p>
                </div>
              </div>
              <div className="mt-2">
                <UserReputationBadge score={user?.reputationScore ?? 0} tier={tier as any} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user?.reputationPromptCount ?? 0}</div>
                <div className="text-sm text-gray-600">Опубликованных промптов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user?.reputationLikesCnt ?? 0}</div>
                <div className="text-sm text-gray-600">Лайки</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{user?.reputationSavesCnt ?? 0}</div>
                <div className="text-sm text-gray-600">Сохранения</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{user?.reputationRatingsCnt ?? 0}</div>
                <div className="text-sm text-gray-600">Всего оценок</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{user?.reputationCommentsCnt ?? 0}</div>
                <div className="text-sm text-gray-600">Комментарии</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
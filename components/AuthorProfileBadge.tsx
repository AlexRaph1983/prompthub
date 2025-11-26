'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserReputationBadge } from '@/components/UserReputationBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface AuthorProfile {
  id: string
  name: string
  image?: string
  bio?: string
  website?: string
  telegram?: string
  github?: string
  twitter?: string
  linkedin?: string
  reputationScore: number
  reputationPromptCount: number
  reputationLikesCnt: number
  reputationSavesCnt: number
  reputationRatingsCnt: number
  reputationCommentsCnt: number
}

interface Props {
  author: AuthorProfile
  className?: string
}

export function AuthorProfileBadge({ author, className }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const tier = author.reputationScore >= 85 ? 'platinum' : 
               author.reputationScore >= 65 ? 'gold' : 
               author.reputationScore >= 40 ? 'silver' : 'bronze'

  const canShowLinks = author.reputationScore >= 65 // gold и выше

  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  const hasLinks = author.website || author.telegram || author.github || author.twitter || author.linkedin

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between min-w-0 gap-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={author.image || ''} alt={author.name} />
              <AvatarFallback>
                {author.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <Link 
                  href={`/prompts?authorId=${encodeURIComponent(author.id)}`}
                  className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate min-w-0"
                  title={author.name}
                >
                  {author.name}
                </Link>
                <UserReputationBadge score={author.reputationScore} tier={tier} />
              </div>
              <div className="text-sm text-gray-500 whitespace-nowrap truncate">
                {author.reputationPromptCount} промптов • {author.reputationLikesCnt} лайков
              </div>
            </div>
          </div>
          {(author.bio || (canShowLinks && hasLinks)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Описание */}
            {author.bio && (
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-gray-700 mb-2">О авторе</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words min-w-0">{author.bio}</p>
              </div>
            )}

            {/* Внешние ссылки */}
            {canShowLinks && hasLinks && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ссылки</h4>
                <div className="flex flex-wrap gap-2">
                  {author.website && (
                    <a
                      href={formatUrl(author.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Сайт
                    </a>
                  )}
                  {author.telegram && (
                    <a
                      href={`https://t.me/${author.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Telegram
                    </a>
                  )}
                  {author.github && (
                    <a
                      href={`https://github.com/${author.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      GitHub
                    </a>
                  )}
                  {author.twitter && (
                    <a
                      href={`https://twitter.com/${author.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Twitter/X
                    </a>
                  )}
                  {author.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${author.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Статистика */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Статистика</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">{author.reputationPromptCount}</div>
                  <div className="text-gray-500">Промптов</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">{author.reputationLikesCnt}</div>
                  <div className="text-gray-500">Лайков</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">{author.reputationSavesCnt}</div>
                  <div className="text-gray-500">Сохранений</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LocaleSwitcher from '@/components/shared/LocaleSwitcher'
import { isLocale } from '@/i18n/index'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { ChevronDown, LogOut, User, FileText, Plus, Trophy, Settings, BarChart3, Shield } from 'lucide-react'
import { usePromptStore } from '@/contexts/PromptStore'
import { ActivityCounterDropdown } from '@/components/ActivityCounterDropdown'

export function Navigation() {
  const { session, isAuthenticated, isLoading, signIn, signOut } = useAuth()
  const { isAdmin, role, permissions } = useAdmin()
  const { toggleModal } = usePromptStore()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname() || '/'
  const [, seg] = pathname.split('/')
  const currentLocale = (isLocale(seg) ? seg : 'ru') as 'en' | 'ru'
  const t = useTranslations('common')

  if (isLoading) {
    return (
      <nav className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                PromptHub
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between min-h-16">
          <div className="flex items-center gap-4">
            <Link href={`/${currentLocale}`} className="group inline-flex items-center gap-2" aria-label="PromptHub home">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{t('appName')}</span>
              <Badge className="uppercase text-[10px] tracking-wide bg-amber-500 text-white shadow-sm">beta</Badge>
            </Link>

            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link href={`/${currentLocale}/home`} className="inline-flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{t('home')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link href={`/${currentLocale}/prompts`} className="inline-flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{t('prompts')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link href={`/${currentLocale}/leaders`} className="inline-flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>{t('leaders')}</span>
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <LocaleSwitcher currentLocale={currentLocale} />
            <ActivityCounterDropdown />
            <Button 
              onClick={toggleModal} 
              size="sm"
              className="hidden md:inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addPrompt')}</span>
            </Button>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Image 
                      src={session?.user?.image || '/default-avatar.png'} 
                      alt="Avatar" 
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="hidden sm:block">{session?.user?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={`/${currentLocale}/dashboard/profile`} className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${currentLocale}/dashboard/prompts`} className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      {t('myPrompts')}
                    </Link>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Администрирование
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href={`/${currentLocale}/admin`} className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Админ-панель
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${currentLocale}/admin/prompts`} className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Управление промптами
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${currentLocale}/admin/search-analytics`} className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Аналитика поиска
                        </Link>
                      </DropdownMenuItem>
                      {permissions.system_settings && (
                        <DropdownMenuItem asChild>
                          <Link href={`/${currentLocale}/admin/settings`} className="flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            Настройки системы
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{t('signIn')}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900 mb-3">Войти через:</div>
                    
                    <Button 
                      onClick={() => signIn('google')} 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {/* Мобильная строка действий */}
        <div className="flex justify-between items-center gap-1 py-2 md:hidden border-t">
          <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
            <Link href={`/${currentLocale}/home`} className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{t('home')}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
            <Link href={`/${currentLocale}/prompts`} className="inline-flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{t('prompts')}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
            <Link href={`/${currentLocale}/leaders`} className="inline-flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>{t('leaders')}</span>
            </Link>
          </Button>
          <Button 
            onClick={toggleModal} 
            size="sm"
            className="flex-1 inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs"
          >
            <Plus className="w-3 h-3" />
            <span>{t('addPrompt')}</span>
          </Button>
        </div>
      </div>
    </nav>
  )
} 
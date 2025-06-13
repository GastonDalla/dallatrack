"use client"

import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Dumbbell, ListChecks, History, BarChart3, Settings, Brain, User, LogOut, LogIn, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations, useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/ui/language-selector'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMemo } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const t = useTranslations()
  const { isLoading } = useLanguage()
  
  const routes = useMemo(() => [
    {
      href: '/dashboard',
      label: t.nav.dashboard,
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      href: '/dashboard/exercises',
      label: t.nav.exercises,
      icon: <Dumbbell className="h-5 w-5" />
    },
    {
      href: '/dashboard/routines',
      label: t.nav.routines,
      icon: <ListChecks className="h-5 w-5" />
    },
    {
      href: '/dashboard/history',
      label: t.nav.history,
      icon: <History className="h-5 w-5" />
    },
    {
      href: '/dashboard/ai',
      label: t.nav.ai,
      icon: <Brain className="h-5 w-5" />
    },
  ], [t.nav])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/signin' })
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }
  
  return (
    <nav className="border-b bg-background">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <button 
            onClick={() => handleNavigation('/')} 
            className="font-semibold text-lg flex items-center hover:opacity-80 transition-opacity"
          >
            <Dumbbell className="h-6 w-6 mr-2 text-primary" />
            <span>{t.app?.name || 'DallaTrack'}</span>
          </button>
          
          <div className="hidden md:flex items-center space-x-4">
            {session && routes.map((route) => (
              <button
                key={route.href}
                onClick={() => handleNavigation(route.href)}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === route.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                {route.icon}
                <span className="ml-2">{route.label}</span>
              </button>
            ))}
            
            <div className="flex items-center space-x-2">
              <ThemeSelector />
              <LanguageSelector />
              
              {/* Authentication */}
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                        <AvatarFallback>
                          {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {session.user?.name && (
                          <p className="font-medium">{session.user.name}</p>
                        )}
                        {session.user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigation('/dashboard/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{t.nav.profile}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t.nav.signOut}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleNavigation('/signin')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t.nav.signIn}
                  </Button>
                  <Button size="sm" onClick={() => handleNavigation('/signup')}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t.nav.signUp}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile selectors */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeSelector />
            <LanguageSelector />
            
            {/* Mobile Auth */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => handleNavigation('/signin')}>
                <LogIn className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {session && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
          <div className="grid grid-cols-5">
            {routes.map((route) => (
              <button
                key={route.href}
                onClick={() => handleNavigation(route.href)}
                className={cn(
                  "flex flex-col items-center py-2 px-1 text-xs font-medium",
                  pathname === route.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {route.icon}
                <span className="mt-1">{route.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
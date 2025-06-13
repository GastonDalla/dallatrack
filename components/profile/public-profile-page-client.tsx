"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { $fetch } from "ofetch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Trophy, Target, Calendar, Globe, ArrowLeft, Share2, LogIn } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/contexts/LanguageContext'
import { achievements, getNextAchievements, getAchievementProgress, getRarityColor, type UserStats } from '@/lib/achievements'
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"

interface PublicProfile {
  _id: string
  name: string
  image?: string
  profile: {
    fitnessLevel?: string
    isPublic: boolean
  }
  stats: {
    totalWorkouts: number
    totalTime: number
    currentStreak: number
    longestStreak: number
    achievements: string[]
    totalWeight?: number
    setsCompleted?: number
    workoutsThisWeek?: number
    workoutsThisMonth?: number
  }
  createdAt: string
  isOwner?: boolean
}

interface PublicProfilePageClientProps {
  userId: string
}

export function PublicProfilePageClient({ userId }: PublicProfilePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { user } = useAuth() 
  const t = useTranslations()
  const { toast } = useToast()

  const {
    data: profile,
    isLoading,
    error
  } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const data = await $fetch<PublicProfile>(`/api/user/profile/${userId}`)
      return data
    },
    retry: false,
    staleTime: 0, 
  })

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${profile?.name} - DallaTrack`,
        text: `Mira el perfil público de ${profile?.name} en DallaTrack`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: t.common.linkCopied,
        description: t.common.linkCopiedDescription
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-20" />
              <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Información personal */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logros */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20" />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Skeleton className="h-8 w-8" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center space-y-2">
                      <Skeleton className="h-8 w-12 mx-auto" />
                      <Skeleton className="h-3 w-20 mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Próximos logros */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    const errorMessage = (error as any)?.data?.error || (error as any)?.message || 'Error al cargar el perfil'
    
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center space-y-4">
          <div className="text-6xl">
            {errorMessage === 'Este perfil es privado' ? '🔒' : '❓'}
          </div>
          <h1 className="text-2xl font-bold">
            {errorMessage === 'Este perfil es privado' ? t.profile.public.profilePrivate : t.profile.public.profileNotFound}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {errorMessage === 'Este perfil es privado' 
              ? t.profile.public.profilePrivateDescription
              : t.profile.public.profileNotFoundDescription
            }
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">{t.profile.public.backToHome}</Link>
            </Button>
            {!user && (
              <>
                <Button asChild variant="outline">
                  <Link href="/auth/signin">{t.profile.public.signIn}</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">{t.profile.public.registerFree}</Link>
                </Button>
              </>
            )}
          </div>
          
          {!user && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-lg mx-auto">
              <h3 className="font-medium mb-2">{t.profile.public.noAccount}</h3>
              <p className="text-sm text-muted-foreground">
                {t.profile.public.noAccountDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const userStats: UserStats = {
    totalWorkouts: profile.stats.totalWorkouts,
    currentStreak: profile.stats.currentStreak,
    longestStreak: profile.stats.longestStreak,
    totalTime: profile.stats.totalTime,
    totalWeight: profile.stats.totalWeight || 0,
    setsCompleted: profile.stats.setsCompleted || 0,
    workoutsThisWeek: profile.stats.workoutsThisWeek || 0,
    workoutsThisMonth: profile.stats.workoutsThisMonth || 0
  }

  const unlockedAchievements = achievements.filter(a => profile.stats.achievements.includes(a.id))
  const nextAchievements = getNextAchievements(userStats, profile.stats.achievements)

  const filteredAchievements = selectedCategory === 'all' 
    ? unlockedAchievements 
    : unlockedAchievements.filter(a => a.category === selectedCategory)

  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = { total: 0, unlocked: 0 }
    }
    acc[achievement.category].total++
    if (profile.stats.achievements.includes(achievement.id)) {
      acc[achievement.category].unlocked++
    }
    return acc
  }, {} as Record<string, { total: number; unlocked: number }>)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.common.back}
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Globe className="h-8 w-8 text-primary" />
                {profile.isOwner ? t.profile.public.myProfile : t.profile.public.publicProfile}
              </h1>
              <p className="text-muted-foreground mt-2">
                {profile.isOwner ? t.profile.public.myProfileView : t.profile.public.profileOf.replace('{name}', profile.name)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!user && (
              <Button asChild variant="default">
                <Link href="/auth/signin">
                  <LogIn className="h-4 w-4 mr-2" />
                  {t.profile.public.signIn}
                </Link>
              </Button>
            )}
            {profile.isOwner && !profile.profile.isPublic && (
              <Button asChild variant="outline">
                <Link href="/profile">
                  {t.profile.public.editProfile}
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              {t.profile.privacy.share}
            </Button>
          </div>
        </div>
        
        {/* Banner para propietario con perfil privado */}
        {profile.isOwner && !profile.profile.isPublic && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="text-orange-600">🔒</div>
              <div>
                <h3 className="font-semibold text-orange-800">{t.profile.privacy.privateProfileNotice}</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {t.profile.privacy.privateProfileDescription}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <Link href="/profile">{t.profile.privacy.configure}</Link>
              </Button>
            </div>
          </div>
        )}
        
        {/* Banner para usuarios no logueados (solo si es público) */}
        {!user && profile.profile.isPublic && (
          <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">{t.profile.public.likeWhatYouSee}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.profile.public.joinDallaTrack}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/auth/signin">{t.profile.public.signIn}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register">{t.profile.public.registerFree}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.profile.personalInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.image || ""} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{profile.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {profile.profile.fitnessLevel && (
                      <Badge variant="secondary">
                        {profile.profile.fitnessLevel}
                      </Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {t.profile.public.publicProfile}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.profile.public.memberSince.replace('{date}', new Date(profile.createdAt).toLocaleDateString())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t.profile.achievements.title}
              </CardTitle>
              <CardDescription>
                {t.profile.achievements.unlockedAchievements.replace('{unlocked}', unlockedAchievements.length.toString()).replace('{total}', achievements.length.toString())}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    {t.profile.achievements.all.replace('{count}', unlockedAchievements.length.toString())}
                  </Button>
                  {Object.entries(achievementsByCategory).map(([category, stats]) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {t.profile.achievements.categories[category as keyof typeof t.profile.achievements.categories]} ({stats.unlocked}/{stats.total})
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {t.profile.achievements.list[achievement.nameKey as keyof typeof t.profile.achievements.list]}
                            </h4>
                            <Badge variant="secondary" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-tight">
                            {t.profile.achievements.list[achievement.descriptionKey as keyof typeof t.profile.achievements.list]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedCategory === 'all' ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t.profile.achievements.noAchievementsYet}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t.profile.achievements.noCategoryAchievements}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t.profile.public.publicStats}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.stats.totalWorkouts}
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.public.workouts}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.floor(profile.stats.totalTime / 60)}h
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.public.totalTime}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.stats.currentStreak}
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.public.currentStreak}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.stats.longestStreak}
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.public.longestStreak}</div>
                </div>
                {profile.stats.totalWeight && profile.stats.totalWeight > 0 && (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(profile.stats.totalWeight)}kg
                      </div>
                      <div className="text-sm text-muted-foreground">{t.profile.public.weightMoved}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile.stats.setsCompleted || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">{t.profile.public.setsCompleted}</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {nextAchievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t.profile.public.nextAchievements}
                </CardTitle>
                <CardDescription>
                  {t.profile.public.achievementsInProgress}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nextAchievements.slice(0, 3).map((achievement) => {
                    const progress = getAchievementProgress(userStats, achievement.id)
                    return (
                      <div key={achievement.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{achievement.icon}</span>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {t.profile.achievements.list[achievement.nameKey as keyof typeof t.profile.achievements.list]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {t.profile.achievements.categories[achievement.category as keyof typeof t.profile.achievements.categories]}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}%
                            </span>
                            <Badge variant="secondary" className={`text-xs ml-1 ${getRarityColor(achievement.rarity)}`}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 
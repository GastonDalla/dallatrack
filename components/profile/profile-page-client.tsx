"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { $fetch } from "ofetch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Trophy, Target, Calendar, Weight, Ruler, Share2, Copy, Lock, Globe } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { useTranslations, useLanguage } from '@/contexts/LanguageContext'
import { achievements, checkAchievements, getNextAchievements, getAchievementProgress, getRarityColor, type UserStats, type Achievement } from '@/lib/achievements'
import { useAchievements } from '@/hooks/useAchievements'
import { useStats } from '@/hooks/useStats'

interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  profile: {
    age?: number
    weight?: number
    height?: number
    fitnessLevel: string
    goals: string[]
    isPublic?: boolean
    weeklyGoal?: number
  }
  preferences: {
    units: string
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
}

export function ProfilePageClient() {
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const t = useTranslations()
  const { language } = useLanguage()
  const { checkAchievements: checkForNewAchievements } = useAchievements()
  const hasCheckedAchievements = useRef(false)

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError
  } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const data = await $fetch<UserProfile>("/api/user/profile")
      return data
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: UserProfile) => {
      const response = await $fetch<UserProfile>("/api/user/profile", {
        method: "PUT",
        body: profileData,
      })
      return response
    },
    onMutate: async (newProfile) => {
      await queryClient.cancelQueries({ queryKey: ['user', 'profile'] })
      const previousProfile = queryClient.getQueryData(['user', 'profile'])
      queryClient.setQueryData(['user', 'profile'], newProfile)
      return { previousProfile }
    },
    onSuccess: () => {
      toast({
        title: t.profile.update.successTitle,
        description: t.profile.update.success
      })
    },
    onError: (error: any, newProfile, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['user', 'profile'], context.previousProfile)
      }
      const errorMessage = error?.data?.message || error?.message || t.profile.update.error
      toast({
        title: t.profile.update.errorTitle,
        description: errorMessage,
        variant: "destructive"
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
    }
  })

  const migrateStatsMutation = useMutation({
    mutationFn: async () => {
      const response = await $fetch<{
        message: string
        stats: any
        sessionsProcessed: number
        newAchievements: string[]
      }>('/api/user/stats/migrate', {
        method: 'POST'
      })
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      toast({
        title: t.profile.update.successTitle,
        description: t.profile.update.statsProcessed
          .replace('{count}', data.sessionsProcessed.toString())
          .replace('{achievements}', data.newAchievements.length.toString())
      })
    },
    onError: (error: any) => {
      console.error('Error migrando estadísticas:', error)
      toast({
        title: t.profile.update.errorMigratingStats,
        description: error?.message || t.profile.update.tryAgainLater,
        variant: "destructive"
      })
    }
  })

  useEffect(() => {
    if (profileData) {
      setProfile(prev => {
        if (prev && prev._id === profileData._id) {
          if (prev.profile?.isPublic !== undefined) {
            return prev
          }
        }
        
        const updatedProfile = { ...profileData }
        if (!updatedProfile.profile) {
          updatedProfile.profile = { fitnessLevel: 'principiante', goals: [], isPublic: false, weeklyGoal: 3 }
        }
        if (updatedProfile.profile.isPublic === undefined) {
          updatedProfile.profile.isPublic = false
        }
        if (updatedProfile.profile.weeklyGoal === undefined) {
          updatedProfile.profile.weeklyGoal = 3
        }
        return updatedProfile
      })
    }
  }, [profileData])

  useEffect(() => {
    if (profileData && !hasCheckedAchievements.current) {
      hasCheckedAchievements.current = true
      
      const migrateAndCheck = async () => {
        if (!profileData) return
        
        try {
          if (profileData.stats.totalWorkouts === 0) {
            console.log('Estadísticas en 0, ejecutando migración automática...')
            await migrateStatsMutation.mutateAsync()
          }
          
          setTimeout(() => {
            checkForNewAchievements()
          }, 1000)
        } catch (error) {
          console.error('Error en migración automática:', error)
          checkForNewAchievements()
        }
      }
      
      migrateAndCheck()
    }
  }, [profileData, migrateStatsMutation, checkForNewAchievements])

  const handleSave = async () => {
    if (!profile) return
    updateProfileMutation.mutate(profile)
  }

  const handlePrivacyToggle = (checked: boolean) => {
    console.log('🔄 Cambiando privacidad a:', checked)
    console.log('📋 Estado actual del perfil:', profile?.profile?.isPublic)
    
    if (!profile) {
      console.error('❌ No hay perfil disponible')
      return
    }
    
    setProfile(prev => {
      if (!prev) return prev
      
      const updated = {
        ...prev,
        profile: {
          ...prev.profile,
          isPublic: checked
        }
      }
      
      console.log('✅ Perfil actualizado:', updated.profile.isPublic)
      return updated
    })
    
    toast({
      title: checked ? t.profile.update.profileSetPublic : t.profile.update.profileSetPrivate,
      description: checked ? t.profile.update.othersCanSeeProfile : t.profile.update.profileNowPrivate
    })
  }

  const copyProfileLink = () => {
    if (!profile) return
    const profileUrl = `${window.location.origin}/u/${profile._id}`
    navigator.clipboard.writeText(profileUrl)
    toast({
      title: t.profile.update.profileLinkCopied,
      description: t.profile.update.linkCopiedToClipboard
    })
  }

  const updateProfile = (path: string, value: any) => {
    console.log('🔧 updateProfile llamado con:', { path, value })
    setProfile(prev => {
      if (!prev) return prev
      
      const keys = path.split('.')
      const updated = { ...prev }
      let current: any = updated
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      console.log('🔧 Perfil actualizado:', updated)
      return updated
    })
  }

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
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
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Privacidad */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
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
            
            {/* Progreso de logros */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
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
        
        <div className="mt-8 flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  if (profileError || !profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <p>{t.profile.load.error}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })}
            className="mt-4"
          >
            {t.profile.load.retry}
          </Button>
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
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          {t.profile.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.profile.subtitle}
        </p>
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
                  <p className="text-muted-foreground">{profile.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {t.profile.personalInfo.memberSince} {new Date(profile.createdAt).toLocaleDateString(
                      language === 'es' ? 'es-ES' : 'en-US',
                      { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }
                    )}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t.profile.personalInfo.name}</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age">{t.profile.personalInfo.age}</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.profile.age || ''}
                    onChange={(e) => updateProfile('profile.age', parseInt(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">{t.profile.personalInfo.weight} (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profile.profile.weight || ''}
                    onChange={(e) => updateProfile('profile.weight', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="height">{t.profile.personalInfo.height} (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.profile.height || ''}
                    onChange={(e) => updateProfile('profile.height', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="fitness-level">{t.profile.personalInfo.fitnessLevel}</Label>
                  <Select
                    value={profile.profile.fitnessLevel}
                    onValueChange={(value) => updateProfile('profile.fitnessLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principiante">{t.profile.personalInfo.beginner}</SelectItem>
                      <SelectItem value="intermedio">{t.profile.personalInfo.intermediate}</SelectItem>
                      <SelectItem value="avanzado">{t.profile.personalInfo.advanced}</SelectItem>
                      <SelectItem value="profesional">{t.profile.personalInfo.professional}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weekly-goal">{t.profile.personalInfo.weeklyGoal}</Label>
                  <Input
                    id="weekly-goal"
                    type="number"
                    min="1"
                    max="7"
                    value={profile.profile.weeklyGoal || 3}
                    onChange={(e) => updateProfile('profile.weeklyGoal', parseInt(e.target.value) || 3)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.profile.personalInfo.weeklyGoalDescription}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {profile.profile.isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                {t.profile.privacy.title}
              </CardTitle>
              <CardDescription>
                {t.profile.privacy.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t.profile.privacy.publicProfile}</Label>
                  <div className="text-sm text-muted-foreground">
                    {t.profile.privacy.publicProfileDescription}
                  </div>
                </div>
                <Switch
                  checked={profile.profile?.isPublic || false}
                  onCheckedChange={handlePrivacyToggle}
                />
              </div>
              
              {profile.profile.isPublic && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{t.profile.privacy.yourPublicProfile}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t.profile.privacy.anyoneCanView}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyProfileLink}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      {t.profile.privacy.share}
                    </Button>
                  </div>
                  <div className="mt-3 p-2 bg-background border rounded text-sm font-mono text-muted-foreground">
                    {typeof window !== 'undefined' && `${window.location.origin}/u/${profile._id}`}
                  </div>
                </div>
              )}

              {!profile.profile.isPublic && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">{t.profile.privacy.profileIsPrivateDescription}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t.profile.achievements.title}
              </CardTitle>
              <CardDescription>
                {t.profile.achievements.subtitle}
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
                    {t.profile.stats.noAchievements}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t.profile.achievements.noCategoryAchievementsMessage}
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
                {t.profile.stats.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.stats.totalWorkouts}
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.stats.totalWorkouts}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.floor(profile.stats.totalTime / 60)}h
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.stats.totalTime}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.stats.currentStreak}
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.stats.currentStreak}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {profile.stats.longestStreak}
                  </div>
                  <div className="text-sm text-muted-foreground">{t.profile.stats.longestStreak}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {nextAchievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t.profile.achievements.progress.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nextAchievements.map((achievement) => {
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
                              {progress.toFixed(0)}% {t.profile.achievements.progress.completed}
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

      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? t.profile.update.saving : t.profile.update.save}
        </Button>
      </div>
    </div>
  )
} 
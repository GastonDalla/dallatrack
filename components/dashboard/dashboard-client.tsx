'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Dumbbell, 
  Sparkles, 
  History, 
  TrendingUp, 
  Calendar,
  Clock,
  Target,
  Activity,
  Play,
  Plus,
  BarChart3,
  Trophy,
  Flame
} from 'lucide-react'
import { useTranslations } from '@/contexts/LanguageContext'
import { TrainingSession, Routine, Exercise } from '@/types'
import { format, formatDistanceToNow, isThisWeek, isThisMonth, startOfWeek, endOfWeek } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useLanguage } from '@/contexts/LanguageContext'

export function DashboardClient() {
  const t = useTranslations()
  const { language } = useLanguage()

  const {
    data: user,
    isLoading: userLoading
  } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const data = await ofetch<{ name: string; email: string }>('/api/user/profile')
      return data
    },
    staleTime: 15 * 60 * 1000, 
  })

  const {
    data: sessions = [],
    isLoading: sessionsLoading
  } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: async () => {
      const data = await ofetch<{ sessions: TrainingSession[] }>('/api/training-sessions')
      return data.sessions
    },
    staleTime: 5 * 60 * 1000, 
  })

  const {
    data: routines = [],
    isLoading: routinesLoading
  } = useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const data = await ofetch<{ routines: Routine[] }>('/api/routines')
      return data.routines
    },
    staleTime: 10 * 60 * 1000, 
  })

  const {
    data: exercises = [],
    isLoading: exercisesLoading
  } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const data = await ofetch<{ exercises: Exercise[] }>('/api/exercises')
      return data.exercises
    },
    staleTime: 15 * 60 * 1000, 
  })

  const isLoading = sessionsLoading || routinesLoading || exercisesLoading || userLoading

  const completedSessions = sessions.filter(s => s.endTime)
  const activeSessions = sessions.filter(s => !s.endTime)
  
  const thisWeekSessions = completedSessions.filter(s => 
    isThisWeek(new Date(s.startTime), { weekStartsOn: 1 })
  )
  const thisMonthSessions = completedSessions.filter(s => 
    isThisMonth(new Date(s.startTime))
  )

  const totalSets = completedSessions.reduce((total, session) => {
    return total + session.exercises.reduce((sessionTotal, exercise) => {
      return sessionTotal + exercise.sets.filter(set => set.completed).length
    }, 0)
  }, 0)

  const totalWeight = completedSessions.reduce((total, session) => {
    return total + session.exercises.reduce((sessionTotal, exercise) => {
      return sessionTotal + exercise.sets
        .filter(set => set.completed)
        .reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0)
    }, 0)
  }, 0)

  const recentSessions = completedSessions
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5)

  const routineUsage = routines.map(routine => {
    const usageCount = completedSessions.filter(s => s.routineId === routine.id).length
    return { routine, usageCount }
  }).sort((a, b) => b.usageCount - a.usageCount).slice(0, 3)

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    return exercise?.title || t.common.exercise
  }

  const calculateDuration = (session: TrainingSession) => {
    if (!session.endTime) return t.common.inProgress
    const start = new Date(session.startTime)
    const end = new Date(session.endTime)
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    return `${diffInMinutes} min`
  }

  const weeklyGoal = 3
  const weeklyProgress = (thisWeekSessions.length / weeklyGoal) * 100

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.dashboard.goodMorning
    if (hour < 18) return t.dashboard.goodAfternoon
    return t.dashboard.goodEvening
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10 space-y-8 mb-16 md:mb-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`skeleton-${i}`} className="h-40 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-8 mb-16 md:mb-0">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm mb-1">
              {getGreeting()} 👋
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              {t.dashboard.welcome} {user?.name || 'Usuario'}
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              {t.app.description}
            </p>
          </div>
          {activeSessions.length > 0 && (
            <Badge variant="secondary" className="gap-2 bg-emerald-100 text-emerald-700 border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              {activeSessions.length} {t.common.active}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link href="/dashboard/training/start" className="flex-1">
            <Button size="lg" className="w-full gap-2 h-12 font-semibold transition-all duration-200 hover:scale-[1.02]">
              <Sparkles className="h-5 w-5" />
              {t.training.startTraining}
            </Button>
          </Link>
          <Link href="/dashboard/routines" className="flex-1">
            <Button size="lg" variant="outline" className="w-full gap-2 h-12 font-semibold transition-all duration-200 hover:bg-muted/50">
              <Dumbbell className="h-5 w-5" />
              {t.dashboard.myRoutines}
            </Button>
          </Link>
        </div>
      </section>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.completedWorkouts}
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              +{thisMonthSessions.length} {t.dashboard.thisMonth}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.completedSets}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSets}</div>
            <p className="text-xs text-muted-foreground">
              +{thisWeekSessions.reduce((total, session) => 
                total + session.exercises.reduce((sessionTotal, exercise) => 
                  sessionTotal + exercise.sets.filter(set => set.completed).length, 0), 0
              )} {t.dashboard.thisWeek}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.totalWeightMoved}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalWeight).toLocaleString()}kg</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(totalWeight / completedSessions.length || 0)}kg {t.dashboard.averagePerSession}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.dashboard.weeklyGoal}
            </CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekSessions.length}/{weeklyGoal}</div>
            <Progress value={weeklyProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {weeklyProgress >= 100 ? t.dashboard.goalCompleted : `${Math.round(weeklyProgress)}% ${t.dashboard.completedThisWeek}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sesiones Recientes */}
        <Card className="transition-all duration-200 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t.dashboard.recentWorkouts}
            </CardTitle>
            <CardDescription>
              {t.dashboard.recentWorkoutsCount 
                ? t.dashboard.recentWorkoutsCount.replace('{count}', recentSessions.length.toString())
                : `${t.dashboard.recentWorkoutsDescription || 'Your latest training sessions'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t.dashboard.startFirstWorkout}</h3>
                <p className="mb-4">{t.dashboard.noRecentWorkoutsMessage}</p>
                <Button className="transition-all duration-200 hover:scale-105" asChild>
                  <Link href="/dashboard/training/start">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t.dashboard.startWorkout}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:bg-muted/30 hover:shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          {session.routine?.title || t.dashboard.freeWorkout}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {calculateDuration(session)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.startTime), { 
                          addSuffix: true,
                          locale: language === 'es' ? es : enUS 
                        })}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span><strong>{session.exercises.length}</strong> {t.dashboard.exercises}</span>
                        <span>•</span>
                        <span><strong>{session.exercises.reduce((total, ex) => total + ex.sets.filter(s => s.completed).length, 0)}</strong> {t.dashboard.completedSetsCount}</span>
                        {session.exercises.reduce((total, ex) => total + ex.sets.filter(s => s.completed).reduce((acc, set) => acc + (set.weight * set.reps), 0), 0) > 0 && (
                          <>
                            <span>•</span>
                            <span><strong>{Math.round(session.exercises.reduce((total, ex) => total + ex.sets.filter(s => s.completed).reduce((acc, set) => acc + (set.weight * set.reps), 0), 0)).toLocaleString()}</strong> {t.dashboard.kgMoved}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="transition-all duration-200 hover:scale-105" asChild>
                      <Link href={`/dashboard/history/${session.id}`}>
                        {t.dashboard.viewDetails}
                      </Link>
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4 transition-all duration-200 hover:bg-muted/50" asChild>
                  <Link href="/dashboard/history">
                    {t.dashboard.viewFullHistory}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rutinas Populares */}
        <Card className="transition-all duration-200 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.dashboard.mostUsedRoutines}
            </CardTitle>
            <CardDescription>
              {t.dashboard.favoriteRoutinesDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {routineUsage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t.dashboard.createFirstRoutine}</h3>
                <p className="mb-4">{t.dashboard.organizeExercisesMessage}</p>
                <Button className="transition-all duration-200 hover:scale-105" asChild>
                  <Link href="/dashboard/routines/create">
                    <Plus className="h-4 w-4 mr-2" />
                    {t.dashboard.createFirstRoutineButton}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {routineUsage.map(({ routine, usageCount }, index) => (
                  <div key={routine.id} className="flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:bg-muted/30 hover:shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          #{index + 1}
                        </div>
                        <h4 className="font-semibold">{routine.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span><strong>{routine.exercises.length}</strong> {t.dashboard.exercises}</span>
                        <span>•</span>
                        <span><strong>{usageCount}</strong> {t.dashboard.timesPerformed}</span>
                        <span>•</span>
                        <span>{t.dashboard.lastTime} <strong>{
                          completedSessions
                            .filter(s => s.routineId === routine.id)
                            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
                            ? formatDistanceToNow(new Date(completedSessions
                                .filter(s => s.routineId === routine.id)
                                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
                                .startTime), { addSuffix: true, locale: language === 'es' ? es : enUS })
                            : t.dashboard.never
                        }</strong></span>
                      </div>
                      {routine.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {routine.description}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="transition-all duration-200 hover:scale-105" asChild>
                      <Link href={`/dashboard/routines/${routine.id}`}>
                        {t.dashboard.viewRoutine}
                      </Link>
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4 transition-all duration-200 hover:bg-muted/50" asChild>
                  <Link href="/dashboard/routines">
                    {t.dashboard.viewAllRoutines}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="transition-all duration-200 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t.dashboard.quickActions}
          </CardTitle>
          <CardDescription>
            {t.dashboard.essentialTools}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02]" asChild>
              <Link href="/dashboard/exercises/create">
                <Dumbbell className="h-6 w-6" />
                <span className="font-medium">{t.exercises.createExercise}</span>
                <span className="text-xs text-muted-foreground">{t.dashboard.addNewExercise}</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02]" asChild>
              <Link href="/dashboard/routines/create">
                <Target className="h-6 w-6" />
                <span className="font-medium">{t.routines.createRoutine}</span>
                <span className="text-xs text-muted-foreground">{t.routines.buildNewRoutine}</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02]" asChild>
              <Link href="/dashboard/history">
                <History className="h-6 w-6" />
                <span className="font-medium">{t.history.viewHistory}</span>
                <span className="text-xs text-muted-foreground">{t.history.trackProgress}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
"use client"

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrainingSession } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { Calendar, ChevronRight, Clock, Play, AlertCircle, Filter, X } from 'lucide-react'
import { format, formatDistance, getYear, getMonth, getDate, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { useTranslations, useLanguage } from '@/contexts/LanguageContext'
import { getMonthName } from '@/lib/i18n'

export function HistoryPageClient() {
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const { toast } = useToast()
  const t = useTranslations()
  const { language } = useLanguage()

  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: async () => {
      const data = await ofetch<{ sessions: TrainingSession[] }>('/api/training-sessions')
      return data.sessions.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  useEffect(() => {
    if (error) {
      toast({
        title: t.history.errorLoading,
        description: t.history.errorLoadingDescription,
        variant: "destructive",
      })
    }
  }, [error, toast, t])

  const availableYears = useMemo(() => {
    const years = [...new Set(sessions.map(session => getYear(new Date(session.startTime))))]
    return years.sort((a, b) => b - a)
  }, [sessions])

  const availableMonths = useMemo(() => {
    if (selectedYear === 'all') return []
    const yearSessions = sessions.filter(session => 
      getYear(new Date(session.startTime)) === parseInt(selectedYear)
    )
    const months = [...new Set(yearSessions.map(session => getMonth(new Date(session.startTime))))]
    return months.sort((a, b) => a - b)
  }, [sessions, selectedYear])

  const availableDays = useMemo(() => {
    if (selectedYear === 'all' || selectedMonth === 'all') return []
    const monthSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime)
      return getYear(sessionDate) === parseInt(selectedYear) && 
             getMonth(sessionDate) === parseInt(selectedMonth)
    })
    const days = [...new Set(monthSessions.map(session => getDate(new Date(session.startTime))))]
    return days.sort((a, b) => a - b)
  }, [sessions, selectedYear, selectedMonth])

  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter(session => {
      const sessionDate = new Date(session.startTime)
      
      if (selectedYear !== 'all' && getYear(sessionDate) !== parseInt(selectedYear)) {
        return false
      }
      
      if (selectedMonth !== 'all' && getMonth(sessionDate) !== parseInt(selectedMonth)) {
        return false
      }
      
      if (selectedDay !== 'all' && getDate(sessionDate) !== parseInt(selectedDay)) {
        return false
      }
      
      return true
    })
    return filtered
  }, [sessions, selectedYear, selectedMonth, selectedDay])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    setSelectedMonth('all')
    setSelectedDay('all')
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    setSelectedDay('all')
  }

  const clearFilters = () => {
    setSelectedYear('all')
    setSelectedMonth('all')
    setSelectedDay('all')
  }

  const hasActiveFilters = selectedYear !== 'all' || selectedMonth !== 'all' || selectedDay !== 'all'

  const stats = useMemo(() => {
    const completedSessions = filteredSessions.filter(session => session.endTime)
    const totalSets = filteredSessions.reduce((acc, session) => {
      return acc + session.exercises.reduce((exerciseAcc, exercise) => {
        return exerciseAcc + exercise.sets.length
      }, 0)
    }, 0)
    const completedSets = filteredSessions.reduce((acc, session) => {
      return acc + session.exercises.reduce((exerciseAcc, exercise) => {
        return exerciseAcc + exercise.sets.filter(set => set.completed).length
      }, 0)
    }, 0)
    const totalDuration = completedSessions.reduce((acc, session) => {
      if (!session.endTime) return acc
      const start = new Date(session.startTime).getTime()
      const end = new Date(session.endTime).getTime()
      return acc + (end - start)
    }, 0)

    return {
      totalSessions: filteredSessions.length,
      completedSessions: completedSessions.length,
      totalSets,
      completedSets,
      totalDuration: Math.round(totalDuration / (1000 * 60))
    }
  }, [filteredSessions])

  const calculateCompletionPercentage = (session: TrainingSession) => {
    let completed = 0
    let total = 0
    
    session.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        total++
        if (set.completed) {
          completed++
        }
      })
    })
    
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }
  
  const calculateDuration = (session: TrainingSession) => {
    if (!session.endTime) return t.common.inProgress
    
    const start = new Date(session.startTime).getTime()
    const end = new Date(session.endTime).getTime()
    const durationMs = end - start
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours === 0) {
      return `${minutes} min`
    }
    
    return `${hours}h ${minutes}m`
  }
  
  const formatElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime()
    const now = Date.now()
    const diff = now - start
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours === 0) {
      return `${minutes}m`
    }
    
    return `${hours}h ${minutes}m`
  }

  const dateLocale = language === 'es' ? es : enUS

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 mb-16 md:mb-0">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.history.trainingHistory}</h1>
        
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 mb-16 md:mb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.history.trainingHistory}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {filteredSessions.length} {t.common.of} {sessions.length} {
              sessions.length === 1 ? t.history.sessionCount : t.history.workoutsCount
            }
          </span>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium text-foreground">{t.history.filters}</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                {t.history.clearFilters}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Año */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.history.year}</label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder={t.history.allYears} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.history.allYears}</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Mes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.history.month}</label>
              <Select 
                value={selectedMonth} 
                onValueChange={handleMonthChange}
                disabled={selectedYear === 'all'}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder={t.history.allMonths} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.history.allMonths}</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month, language)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Día */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t.history.day}</label>
              <Select 
                value={selectedDay} 
                onValueChange={setSelectedDay}
                disabled={selectedYear === 'all' || selectedMonth === 'all'}
              >
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder={t.history.allDays} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.history.allDays}</SelectItem>
                  {availableDays.map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      {filteredSessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">
                {stats.totalSessions === 1 ? t.history.sessionCount : t.history.workoutsCount}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedSessions}</div>
              <div className="text-sm text-muted-foreground">{t.history.completedSessions}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.completedSets}</div>
              <div className="text-sm text-muted-foreground">{t.history.setsPerformed}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalDuration > 60 
                  ? `${Math.floor(stats.totalDuration / 60)}h ${stats.totalDuration % 60}m`
                  : `${stats.totalDuration}m`
                }
              </div>
              <div className="text-sm text-muted-foreground">{t.history.totalTime}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {filteredSessions.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            {sessions.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-foreground">{t.history.noSessions}</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  {t.history.noSessionsDescription}
                </p>
                <Button asChild>
                  <Link href="/dashboard/training/start">{t.training.startTraining}</Link>
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-foreground">{t.history.noFilteredSessions}</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  {t.history.noFilteredSessionsDescription}
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  {t.history.clearFilters}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-foreground">
                          {session.routine?.title || session.routineName || t.training.freeWorkout}
                        </CardTitle>
                        {!session.endTime && (
                          <div className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                            <AlertCircle className="h-3 w-3" />
                            {t.common.inProgress}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          <span>{format(new Date(session.startTime), 'd MMM yyyy', { locale: dateLocale })}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1.5" />
                          <span>
                            {!session.endTime 
                              ? `${t.training.startedAgo} ${formatElapsedTime(session.startTime)}`
                              : calculateDuration(session)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!session.endTime && (
                        <Button size="sm" className="gap-1" asChild>
                          <Link href={`/dashboard/training/${session.id}`}>
                            <Play className="h-4 w-4" />
                            {t.common.continue}
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="gap-1" asChild>
                        <Link href={`/dashboard/history/${session.id}`}>
                          {t.common.details}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-foreground">
                      <span>{t.common.progress}</span>
                      <span>{calculateCompletionPercentage(session)}%</span>
                    </div>
                    <Progress value={calculateCompletionPercentage(session)} className="h-1.5" />
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {session.exercises.map((exercise, exerciseIndex) => {
                      const completedSets = exercise.sets.filter(set => set.completed).length
                      return (
                        <div 
                          key={`${session.id}-exercise-${exercise.exerciseId || exerciseIndex}`}
                          className="text-xs px-2 py-1 bg-muted rounded-md flex gap-1.5"
                        >
                          <span className="text-foreground">{exercise.exercise?.title || exercise.exerciseName || t.common.exercise}</span>
                          <span className="text-muted-foreground">
                            {completedSets}/{exercise.sets.length} {t.common.sets}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
} 
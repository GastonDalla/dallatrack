'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Share2, Users, TrendingUp, Calendar, ExternalLink, Copy, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/contexts/LanguageContext'
import { ShareStatistics, RoutineUsage } from '@/types'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { $fetch } from 'ofetch'

interface ShareStatisticsDashboardProps {
  className?: string
}

export function ShareStatisticsDashboard({ className }: ShareStatisticsDashboardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()
  const t = useTranslations()
  const queryClient = useQueryClient()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const { 
    data: statistics, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['share-statistics'],
    queryFn: async () => {
      const response = await $fetch<{ statistics: ShareStatistics }>('/api/routines/share/statistics')
      return response.statistics 
    },
    staleTime: 30000, 
    refetchOnWindowFocus: false
  })

  const toggleRoutineStatusMutation = useMutation({
    mutationFn: async ({ routineId, isActive }: { routineId: string; isActive: boolean }) => {
      const response = await $fetch(`/api/routines/share/${routineId}`, {
        method: 'PATCH',
        body: { isActive }
      })
      return response
    },
    onSuccess: (_, { routineId, isActive }) => {
      queryClient.setQueryData(['share-statistics'], (old: ShareStatistics | undefined) => {
        if (!old) return old
        
        return {
          ...old,
          sharedRoutines: old.sharedRoutines.map((routine: any) => 
            routine.id === routineId 
              ? { ...routine, isActive }
              : routine
          )
        }
      })

      toast({
        title: t.sharing.statistics.statusUpdated,
        description: isActive ? t.sharing.statistics.routineActivated : t.sharing.statistics.routineDeactivated
      })
    },
    onError: (error: any) => {
      console.error('Error toggling routine status:', error)
      toast({
        title: t.common.error,
        description: error?.data?.error || error?.message || t.sharing.statistics.errorUpdatingStatus,
        variant: "destructive"
      })
    }
  })

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: t.common.copied,
        description: `${type} ${t.common.linkCopiedDescription}`
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const toggleRoutineStatus = (routineId: string, isActive: boolean) => {
    toggleRoutineStatusMutation.mutate({ routineId, isActive })
  }

  const recentUsesColumns: ColumnDef<RoutineUsage>[] = [
    {
      accessorKey: 'routineTitle',
      header: t.sharing.statistics.routine,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('routineTitle')}</div>
      ),
    },
    {
      accessorKey: 'usedByName',
      header: t.sharing.statistics.user,
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue('usedByName') || t.sharing.statistics.anonymousUser}</div>
      ),
    },
    {
      accessorKey: 'usedAt',
      header: t.sharing.statistics.date,
      cell: ({ row }) => {
        const date = new Date(row.getValue('usedAt'))
        return (
          <div className="text-sm">
            {date.toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )
      },
    },
  ]

  const myRoutinesColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'title',
      header: t.sharing.statistics.routine,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
    {
      accessorKey: 'shareCode',
      header: t.common.code,
      cell: ({ row }) => (
        <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {row.getValue('shareCode')}
        </div>
      ),
    },
    {
      accessorKey: 'currentUses',
      header: t.sharing.statistics.uses,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('currentUses')}</div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: t.sharing.statistics.status,
      cell: ({ row }) => {
        const isActive = row.getValue('isActive')
        const routineId = row.original.id
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRoutineStatus(routineId, !isActive)}
            disabled={toggleRoutineStatusMutation.isPending}
            className="h-8 px-2"
          >
            {isActive ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                {t.sharing.statistics.active}
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                {t.sharing.statistics.inactive}
              </>
            )}
          </Button>
        )
      },
    },
    {
      id: 'actions',
      header: t.common.actions,
      cell: ({ row }) => {
        const shareCode = row.getValue('shareCode') as string
        const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/routines/share/${shareCode}`
        
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(shareCode, t.common.code)}
              className="h-8 px-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(shareUrl, t.common.link)}
              className="h-8 px-2"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className={`container mx-auto px-4 py-6 lg:py-8 max-w-7xl ${className}`}>
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-32" />
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3 lg:gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico */}
        <Card className="mb-6 lg:mb-8">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] w-full" />
          </CardContent>
        </Card>

        {/* Tablas */}
        <div className="space-y-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !statistics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive">
            {(error as any)?.data?.error || (error as any)?.message || t.sharing.statistics.errorLoadingDescription}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            {t.sharing.statistics.retryButton}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`container mx-auto px-4 py-6 lg:py-8 max-w-7xl ${className}`}>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/routines">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.sharing.statistics.backToRoutines}
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                {t.sharing.statistics.title}
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                {t.sharing.statistics.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-primary/10 rounded-lg">
                <Share2 className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold">{statistics.totalSharedRoutines || 0}</p>
                <p className="text-sm lg:text-base text-muted-foreground">{t.sharing.statistics.sharedRoutines}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold">{statistics.totalUses || 0}</p>
                <p className="text-sm lg:text-base text-muted-foreground">{t.sharing.statistics.totalUses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold">{statistics.recentUses?.length || 0}</p>
                <p className="text-sm lg:text-base text-muted-foreground">{t.sharing.statistics.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="p-2 lg:p-3 bg-orange-500/10 rounded-lg">
                <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold">
                  {statistics.usageByDay
                    ? statistics.usageByDay
                        .filter(day => {
                          const dayDate = new Date(day.date)
                          const weekAgo = new Date()
                          weekAgo.setDate(weekAgo.getDate() - 7)
                          return dayDate >= weekAgo
                        })
                        .reduce((sum, day) => sum + day.uses, 0)
                    : 0
                  }
                </p>
                <p className="text-sm lg:text-base text-muted-foreground">{t.sharing.statistics.thisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de uso por días */}
      {statistics.usageByDay && statistics.usageByDay.length > 0 && (
        <Card className="mb-6 lg:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.sharing.statistics.usageByDays}
            </CardTitle>
            <CardDescription>
              {t.sharing.statistics.usageTrend}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                uses: {
                  label: t.sharing.statistics.uses,
                  color: "hsl(217, 91%, 60%)", 
                },
              }}
              className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={statistics.usageByDay} 
                  margin={{ 
                    top: 20, 
                    right: 10, 
                    left: 10, 
                    bottom: 80 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 80 : 60}
                    interval={isMobile ? 4 : 2}
                    tickFormatter={(value: string) => {
                      try {
                        const date = new Date(value)
                        return isMobile 
                          ? date.getDate().toString()
                          : date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
                      } catch {
                        return value
                      }
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    width={isMobile ? 30 : 40}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="uses" 
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={isMobile ? 2 : 3}
                    dot={{ 
                      fill: "hsl(217, 91%, 60%)", 
                      strokeWidth: 2,
                      r: isMobile ? 3 : 5,
                      fillOpacity: 1
                    }}
                    activeDot={{ 
                      r: isMobile ? 5 : 8, 
                      stroke: "hsl(217, 91%, 60%)",
                      strokeWidth: 3,
                      fill: "hsl(217, 91%, 60%)",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Tablas */}
      <Tabs defaultValue="recent" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">{t.sharing.statistics.recentUses}</TabsTrigger>
          <TabsTrigger value="routines">{t.sharing.statistics.mySharedRoutines}</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>{t.sharing.statistics.recentUses}</CardTitle>
              <CardDescription>
                {t.sharing.statistics.recentUsesDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={recentUsesColumns}
                data={statistics.recentUses || []}
                pageSize={10}
                emptyMessage={t.sharing.statistics.noRecentUses}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routines">
          <Card>
            <CardHeader>
              <CardTitle>{t.sharing.statistics.mySharedRoutines}</CardTitle>
              <CardDescription>
                {t.sharing.statistics.mySharedRoutinesDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={myRoutinesColumns}
                data={statistics.sharedRoutines || []}
                pageSize={10}
                emptyMessage={t.sharing.statistics.noSharedRoutines}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
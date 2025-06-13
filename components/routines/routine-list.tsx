"use client"

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import Link from 'next/link'
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ListChecks, Pencil, Trash2, Search, Play, AlertCircle, Plus } from 'lucide-react'
import { Routine, Exercise, TrainingSession } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { RoutineDeleteDialog } from './routine-delete-dialog'
import { ShareRoutineDialog } from './share-routine-dialog'
import { AddSharedRoutineDialog } from './add-shared-routine-dialog'
import { useTranslations } from '@/contexts/LanguageContext'

export function RoutineList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const { data: allRoutines = [], isLoading: routinesLoading, error: routinesError } = useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const data = await ofetch<{ routines: Routine[] }>('/api/routines')
      return data.routines
    },
  })

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const data = await ofetch<{ exercises: Exercise[] }>('/api/exercises')
      return data.exercises
    },
  })

  const routines = useMemo(() => {
    if (!searchQuery.trim()) {
      return allRoutines
    }
    
    const searchLower = searchQuery.toLowerCase().trim()
    return allRoutines.filter(routine => 
      routine.title.toLowerCase().includes(searchLower) ||
      routine.description?.toLowerCase().includes(searchLower) ||
      routine.exercises.some(ex => 
        exercises.find(exercise => exercise.id === ex.exerciseId)?.title.toLowerCase().includes(searchLower)
      )
    )
  }, [allRoutines, searchQuery, exercises])

  const { data: activeSessions = [] } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: async () => {
      const data = await ofetch<{ sessions: TrainingSession[] }>('/api/training-sessions')
      return data.sessions.filter(session => !session.endTime)
    },
    staleTime: 30 * 1000, 
    refetchInterval: 60 * 1000, 
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await ofetch(`/api/routines/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['routines'], (old: Routine[] | undefined) =>
        old ? old.filter(routine => routine.id !== deletedId) : []
      )
      toast({
        title: t.routines.routineDeleted || "Rutina eliminada",
        description: t.routines.routineDeletedSuccess || "La rutina se ha eliminado correctamente.",
      })
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.routines.failedToDelete || "Hubo un problema eliminando la rutina.",
        variant: "destructive",
      })
    }
  })

  if (routinesError) {
    toast({
      title: t.routines.errorLoadingRoutines || "Error al cargar rutinas",
      description: t.routines.problemLoadingRoutines || "Hubo un problema cargando tus rutinas.",
      variant: "destructive",
    })
  }

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    return exercise?.title || t.common.exercise || 'Unknown Exercise'
  }

  const hasActiveSession = (routineId: string) => {
    return activeSessions.some(session => session.routineId === routineId)
  }

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id)
    setRoutineToDelete(null)
  }

  const handleRoutineAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['routines'] })
  }

  if (routinesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse space-y-4 w-full max-w-xl">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={`skeleton-${i}`} className="h-40 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10 bg-background border-input text-foreground"
            placeholder={t.routines.searchRoutines}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <AddSharedRoutineDialog onRoutineAdded={handleRoutineAdded}>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t.sharing.addSharedRoutine.title}
          </Button>
        </AddSharedRoutineDialog>
      </div>

      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">{t.routines.noRoutinesFound}</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery.trim() 
              ? t.routines.noRoutinesMatch
              : t.routines.noRoutines}
          </p>
          {!searchQuery.trim() && (
            <Button className="mt-4" asChild>
              <Link href="/dashboard/routines/create">{t.routines.createFirstRoutine}</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routines.map(routine => (
            <Card key={routine.id} className="flex flex-col bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <Link href={`/dashboard/routines/${routine.id}`} className="hover:underline">
                    {routine.title}
                  </Link>
                  {hasActiveSession(routine.id) && (
                    <div className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      {t.common.active}
                    </div>
                  )}
                </CardTitle>
                {routine.description && (
                  <CardDescription className="line-clamp-2 text-muted-foreground">
                    {routine.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <h4 className="text-sm font-medium mb-2 text-foreground">{t.routines.exercises} ({routine.exercises.length})</h4>
                {routine.exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.routines.noExercisesInRoutine}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {routine.exercises
                      .sort((a, b) => a.order - b.order)
                      .map((exercise, index) => (
                        <Badge key={`${routine.id}-exercise-${exercise.exerciseId}-${exercise.order}-${index}`} variant="secondary">
                          {getExerciseName(exercise.exerciseId)}
                        </Badge>
                      ))
                    }
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between mt-auto pt-4">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/routines/${routine.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      {t.common.edit}
                    </Link>
                  </Button>
                  {!routine.isSharedRoutine && (
                    <ShareRoutineDialog
                      routineId={routine.id}
                      routineName={routine.title}
                    />
                  )}
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/5"
                    onClick={() => setRoutineToDelete(routine.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t.common.delete}
                  </Button>
                </div>
                
                <Button size="sm" asChild>
                  <Link href={`/dashboard/training/start?routineId=${routine.id}`}>
                    <Play className="h-4 w-4 mr-1" />
                    {t.common.start}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <RoutineDeleteDialog 
        isOpen={!!routineToDelete}
        onClose={() => setRoutineToDelete(null)}
        onConfirm={() => routineToDelete && handleDelete(routineToDelete)}
      />
    </div>
  )
}
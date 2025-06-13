'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Target, User, Download, ArrowLeft, AlertCircle } from 'lucide-react'
import { SharedRoutine } from '@/types'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/contexts/LanguageContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { $fetch } from 'ofetch'

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'principiante':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'intermedio':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'avanzado':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

interface SharedRoutinePageClientProps {
  code: string
}

export function SharedRoutinePageClient({ code }: SharedRoutinePageClientProps) {
  const { toast } = useToast()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const { 
    data: sharedRoutine, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['shared-routine', code],
    queryFn: async () => {
      const response = await $fetch<{
        sharedRoutine: SharedRoutine
        sharedBy: { name: string; email?: string }
      }>(`/api/routines/shared/${code}`)
      return response
    },
    enabled: !!code,
    retry: false
  })

  const addRoutineMutation = useMutation({
    mutationFn: async () => {
      const response = await $fetch(`/api/routines/shared/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      
      toast({
        title: t.common.success,
        description: data.message || t.sharing.sharedRoutine.addedSuccessfully
      })
    },
    onError: (error: any) => {
      console.error('Error adding shared routine:', error)
      toast({
        title: t.common.error,
        description: error?.data?.error || error?.message || t.sharing.sharedRoutine.errorAdding,
        variant: "destructive"
      })
    }
  })

  const handleAddRoutine = () => {
    if (!sharedRoutine) return
    addRoutineMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-32" />
        </div>
        
        <div className="text-center py-12">
          <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  if (error) {
    const errorMessage = (error as any)?.data?.error || (error as any)?.message || t.sharing.sharedRoutine.invalidCode
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/routines">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.sharing.sharedRoutine.backToRoutines}
            </Link>
          </Button>
        </div>
        
        <Card className="border-destructive/50">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t.sharing.sharedRoutine.invalidCode}</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => refetch()} variant="outline">
                  {t.sharing.sharedRoutine.retry}
                </Button>
                <Button asChild>
                  <Link href="/dashboard/routines">
                    {t.sharing.sharedRoutine.goToMyRoutines}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sharedRoutine) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/routines">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.sharing.sharedRoutine.backToRoutines}
          </Link>
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t.sharing.sharedRoutine.title}</h1>
          <p className="text-muted-foreground">{t.sharing.sharedRoutine.codeLabel.replace('{code}', code)}</p>
        </div>
        
        <div></div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{sharedRoutine.sharedRoutine.title}</CardTitle>
              <CardDescription className="flex items-center text-base">
                <User className="h-4 w-4 mr-2" />
                {t.sharing.sharedRoutine.sharedBy.replace('{name}', sharedRoutine.sharedBy.name)}
              </CardDescription>
            </div>
            <Badge className={getDifficultyColor(sharedRoutine.sharedRoutine.difficulty)}>
              {sharedRoutine.sharedRoutine.difficulty}
            </Badge>
          </div>
          
          {sharedRoutine.sharedRoutine.description && (
            <p className="text-muted-foreground mt-4">
              {sharedRoutine.sharedRoutine.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {sharedRoutine.sharedRoutine.estimatedDuration} {t.common.minutes}
            </div>
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-2" />
              {sharedRoutine.sharedRoutine.exercises.length} {t.common.exercises}
            </div>
          </div>

          {sharedRoutine.sharedRoutine.targetMuscleGroups.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">{t.sharing.sharedRoutine.muscleGroups}</h3>
              <div className="flex flex-wrap gap-2">
                {sharedRoutine.sharedRoutine.targetMuscleGroups.map((muscle, index) => (
                  <Badge key={`target-muscle-${index}-${muscle}`} variant="secondary">
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold">{t.sharing.sharedRoutine.exercisesCount.replace('{count}', sharedRoutine.sharedRoutine.exercises.length.toString())}</h3>
            <div className="grid gap-3">
              {sharedRoutine.sharedRoutine.exercises
                .sort((a, b) => a.order - b.order)
                .map((exercise, exerciseIndex) => (
                <Card key={`exercise-${exerciseIndex}-${exercise.exerciseId}`} className="p-4 bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                          {exercise.order}
                        </span>
                        <h4 className="font-semibold">{exercise.exerciseName}</h4>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{exercise.sets} {t.sharing.sharedRoutine.sets}</span>
                        <span>{exercise.reps} {t.sharing.sharedRoutine.reps}</span>
                        {exercise.weight && <span>{exercise.weight} {t.common.kg}</span>}
                        {exercise.restTime && <span>{exercise.restTime}s {t.sharing.sharedRoutine.rest}</span>}
                      </div>

                      {exercise.muscleGroups.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscleGroups.map((muscle, muscleIndex) => (
                            <Badge key={`exercise-${exerciseIndex}-muscle-${muscleIndex}-${muscle}`} variant="outline" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {exercise.notes && (
                        <p className="text-sm text-muted-foreground bg-background p-2 rounded">
                          💡 {exercise.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <Button 
              onClick={handleAddRoutine}
              disabled={addRoutineMutation.isPending}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {addRoutineMutation.isPending ? t.sharing.sharedRoutine.adding : t.sharing.sharedRoutine.addToMyRoutines}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
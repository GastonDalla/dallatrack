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
import { Dumbbell, Pencil, Trash2, Search, Youtube, Target } from 'lucide-react'
import { Exercise } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { ExerciseDeleteDialog } from './exercise-delete-dialog'
import { useTranslations } from '@/contexts/LanguageContext'

export function ExerciseList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const { data: allExercises = [], isLoading, error } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const data = await ofetch<{ exercises: Exercise[] }>('/api/exercises')
      return data.exercises
    },
  })

  const exercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExercises
    }
    
    const searchLower = searchQuery.toLowerCase().trim()
    return allExercises.filter(exercise => 
      exercise.title.toLowerCase().includes(searchLower) ||
      exercise.description?.toLowerCase().includes(searchLower) ||
      (exercise as any).muscleGroups?.some((muscle: string) => 
        muscle.toLowerCase().includes(searchLower)
      )
    )
  }, [allExercises, searchQuery])

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await ofetch(`/api/exercises/${id}`, { method: 'DELETE' })
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['exercises'], (old: Exercise[] | undefined) =>
        old ? old.filter(exercise => exercise.id !== deletedId) : []
      )
      toast({
        title: t.exercises.exerciseDeleted,
        description: "The exercise has been removed successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.exercises.failedToDelete,
        variant: "destructive",
      })
    }
  })

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id)
    setExerciseToDelete(null)
  }

  if (error) {
    toast({
      title: t.exercises.errorLoadingExercises,
      description: t.exercises.problemLoadingExercises,
      variant: "destructive",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse space-y-4 w-full max-w-xl">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10"
          placeholder={t.exercises.searchExercises}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t.exercises.noExercisesFound}</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery.trim() 
              ? t.exercises.noExercisesMatch
              : t.exercises.noExercises}
          </p>
          {!searchQuery.trim() && (
            <Button className="mt-4" asChild>
              <Link href="/dashboard/exercises/create">{t.exercises.createFirstExercise}</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map(exercise => (
            <Card key={exercise.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  {exercise.title}
                </CardTitle>
                {exercise.description && (
                  <CardDescription className="line-clamp-2">
                    {exercise.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">{t.exercises.defaultSetsLabel} {exercise.defaultSets}</p>
                  {exercise.sets && exercise.sets.length > 0 && (
                    <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <Target className="h-3 w-3" />
                      {exercise.sets.length} {t.exercises.setsConfigured}
                    </div>
                  )}
                </div>
                
                {exercise.youtubeLink && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <Youtube className="h-3 w-3" />
                    <span>{t.exercises.videoAvailable}</span>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between gap-2 mt-auto">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/exercises/${exercise.id}`}>
                    <Dumbbell className="h-4 w-4 mr-1" />
                    Ver detalles
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/exercises/${exercise.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      {t.common.edit}
                    </Link>
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/5"
                    onClick={() => setExerciseToDelete(exercise.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t.common.delete}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ExerciseDeleteDialog 
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={() => exerciseToDelete && handleDelete(exerciseToDelete)}
      />
    </div>
  )
}
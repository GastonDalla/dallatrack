'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Download, Clock, Target, User, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from '@/contexts/LanguageContext'
import { SharedRoutine } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { $fetch } from 'ofetch'

interface AddSharedRoutineDialogProps {
  onRoutineAdded?: () => void
  children?: React.ReactNode
}

export function AddSharedRoutineDialog({ 
  onRoutineAdded,
  children 
}: AddSharedRoutineDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState('')
  const [searchCode, setSearchCode] = useState<string | null>(null)
  const { toast } = useToast()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const { 
    data: sharedRoutine, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['shared-routine', searchCode],
    queryFn: async () => {
      if (!searchCode) return null
      
      const data = await $fetch<{
        sharedRoutine: SharedRoutine
        sharedBy: { name: string; email?: string }
      }>(`/api/routines/shared/${searchCode}`)
      
      return data
    },
    enabled: !!searchCode,
    retry: false,
    staleTime: 0
  })

  const addRoutineMutation = useMutation({
    mutationFn: async (routineCode: string) => {
      const response = await $fetch<{ message: string }>(`/api/routines/shared/${routineCode}`, {
        method: 'POST'
      })
      return response
    },
    onSuccess: (data) => {
      toast({
        title: t.common.success,
        description: data.message || t.sharing.addSharedRoutine.addedSuccessfully
      })
      
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      
      setIsOpen(false)
      setCode('')
      setSearchCode(null)
      
      onRoutineAdded?.()
    },
    onError: (error: any) => {
      console.error('Error adding shared routine:', error)
      const errorMessage = error?.data?.error || error?.message || t.sharing.addSharedRoutine.errorAdding
      toast({
        title: t.common.error,
        description: errorMessage,
        variant: "destructive"
      })
    }
  })

  const handleSearchCode = () => {
    if (!code.trim()) {
      toast({
        title: t.common.error,
        description: t.sharing.addSharedRoutine.enterValidCode,
        variant: "destructive"
      })
      return
    }

    setSearchCode(code.trim().toUpperCase())
  }

  const handleAddRoutine = () => {
    if (!searchCode) return
    addRoutineMutation.mutate(searchCode)
  }

  const resetDialog = () => {
    setCode('')
    setSearchCode(null)
  }

  const getDifficultyColor = (difficulty: string) => {
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

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.sharing.addSharedRoutine.title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.sharing.addSharedRoutine.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">{t.sharing.addSharedRoutine.routineCode}</Label>
            <div className="flex space-x-2">
              <Input
                id="code"
                placeholder={t.sharing.addSharedRoutine.codePlaceholder}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  if (searchCode) {
                    setSearchCode(null)
                  }
                }}
                className="font-mono"
                maxLength={8}
              />
              <Button 
                onClick={handleSearchCode}
                disabled={isLoading || !code.trim()}
              >
                {isLoading ? t.sharing.addSharedRoutine.searching : t.sharing.addSharedRoutine.searchButton}
              </Button>
            </div>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <Card className="border-destructive/50">
              <CardContent className="py-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-destructive/10 p-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <h4 className="font-medium text-destructive">{t.sharing.addSharedRoutine.errorSearching}</h4>
                    <p className="text-sm text-muted-foreground">
                      {(error as any)?.data?.error || (error as any)?.message || t.sharing.addSharedRoutine.invalidCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {sharedRoutine && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {sharedRoutine.sharedRoutine.title}
                    </CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-1" />
                      {t.sharing.addSharedRoutine.sharedBy} {sharedRoutine.sharedBy.name}
                    </CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(sharedRoutine.sharedRoutine.difficulty)}>
                    {sharedRoutine.sharedRoutine.difficulty}
                  </Badge>
                </div>
                
                {sharedRoutine.sharedRoutine.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {sharedRoutine.sharedRoutine.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {sharedRoutine.sharedRoutine.estimatedDuration} {t.common.min}
                  </div>
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {sharedRoutine.sharedRoutine.exercises.length} {t.sharing.addSharedRoutine.exercises}
                  </div>
                </div>

                {sharedRoutine.sharedRoutine.targetMuscleGroups.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.sharing.addSharedRoutine.muscleGroups}</Label>
                    <div className="flex flex-wrap gap-1">
                      {sharedRoutine.sharedRoutine.targetMuscleGroups.map((muscle, index) => (
                        <Badge key={`target-muscle-${index}-${muscle}`} variant="secondary" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.sharing.addSharedRoutine.exercises}</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sharedRoutine.sharedRoutine.exercises
                      .sort((a, b) => a.order - b.order)
                      .map((exercise, exerciseIndex) => (
                      <div 
                        key={`exercise-${exerciseIndex}-${exercise.exerciseId}`}
                        className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                      >
                        <span className="font-medium">{exercise.exerciseName}</span>
                        <span className="text-muted-foreground">
                          {exercise.sets} {t.common.sets} × {exercise.reps} {t.common.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleAddRoutine}
                  disabled={addRoutineMutation.isPending}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {addRoutineMutation.isPending ? t.sharing.addSharedRoutine.adding : t.sharing.addSharedRoutine.addToMyRoutines}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
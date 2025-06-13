"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Exercise } from '@/types'
import { Plus, ExternalLink, AlertCircle, Search, Check } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/contexts/LanguageContext'

interface ExercisePickerProps {
  exercises: Exercise[]
  onAdd: (exerciseId: string, sets: number) => void
}

export function ExercisePicker({ exercises, onAdd }: ExercisePickerProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const t = useTranslations()

  const filteredExercises = useMemo(() => {
    if (!searchValue) return exercises
    
    return exercises.filter(exercise =>
      exercise.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      (exercise.description && exercise.description.toLowerCase().includes(searchValue.toLowerCase()))
    )
  }, [exercises, searchValue])

  const handleSelect = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id)
    setSelectedExercise(exercise)
    setSearchValue(exercise.title)
    setShowDropdown(false)
  }

  const handleAdd = () => {
    if (selectedExerciseId && selectedExercise) {
      onAdd(selectedExerciseId, selectedExercise.defaultSets)
      setSelectedExerciseId('')
      setSelectedExercise(null)
      setSearchValue('')
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setShowDropdown(value.length > 0)
    
    if (selectedExercise && !selectedExercise.title.toLowerCase().includes(value.toLowerCase())) {
      setSelectedExerciseId('')
      setSelectedExercise(null)
    }
  }

  const handleSearchFocus = () => {
    setShowDropdown(searchValue.length > 0 || exercises.length > 0)
  }

  const handleSearchBlur = () => {
    setTimeout(() => setShowDropdown(false), 200)
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">{t.exercises.noExercisesAvailable}</p>
          <p className="text-sm mt-1">
            {t.exercises.needExercisesForRoutines}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild>
            <Link href="/exercises/create">
              <Plus className="h-4 w-4 mr-1" />
              {t.exercises.createExercise}
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/setup">
              <ExternalLink className="h-4 w-4 mr-1" />
              {t.exercises.exampleExercises}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.exercises.searchExercises}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="pl-10"
          />
        </div>
        
        {showDropdown && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto">
            <CardContent className="p-0">
              {filteredExercises.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {t.exercises.noExercisesFoundSearch}
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0",
                        selectedExerciseId === exercise.id && "bg-muted"
                      )}
                      onClick={() => handleSelect(exercise)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 text-primary",
                          selectedExerciseId === exercise.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{exercise.title}</span>
                        {exercise.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {exercise.description}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {exercise.defaultSets} {t.exercises.defaultSetsText}
                          </span>
                          {exercise.youtubeLink && (
                            <span className="text-xs text-red-500">📹 {t.exercises.videoAvailable}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {selectedExercise && (
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm font-medium">{selectedExercise.title}</p>
          {selectedExercise.description && (
            <p className="text-xs text-muted-foreground mt-1">{selectedExercise.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {t.exercises.willBeAddedWith} {selectedExercise.defaultSets} {t.exercises.defaultSetsText}
          </p>
          {selectedExercise.youtubeLink && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-red-500">📹 {t.exercises.videoAvailable}</span>
            </div>
          )}
        </div>
      )}
      
      {!selectedExerciseId && searchValue && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>{t.exercises.searchAndSelect}</span>
        </div>
      )}
      
      <Button 
        onClick={handleAdd}
        disabled={!selectedExerciseId}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {selectedExerciseId ? t.exercises.addToRoutine : t.exercises.selectExerciseFirst}
      </Button>
    </div>
  )
}
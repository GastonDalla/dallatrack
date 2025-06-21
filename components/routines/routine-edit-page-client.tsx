"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Dumbbell,
  Clock,
  Target,
  Loader2,
  GripVertical,
  PlayCircle,
  Search
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { Routine, Exercise, RoutineExercise, RoutineSet } from '@/types'
import { useTranslations } from '@/contexts/LanguageContext'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LocalRoutineSet {
  id: string;
  routineExerciseId: string;
  setNumber: number;
  targetReps: string;
  targetWeight: number;
}

interface LocalRoutineExercise extends Omit<RoutineExercise, 'sets'> {
  sets: LocalRoutineSet[];
  restTime?: number;
  notes?: string;
}

interface LocalRoutine extends Omit<Routine, 'exercises'> {
  difficulty?: string;
  exercises: LocalRoutineExercise[];
}

interface Props {
  routineId: string;
}

function SortableRoutineExercise({ 
  routineExercise, 
  onUpdate, 
  onRemove,
  index
}: {
  routineExercise: LocalRoutineExercise;
  onUpdate: (routineExerciseId: string, updates: Partial<LocalRoutineExercise>) => void;
  onRemove: (routineExerciseId: string) => void;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: routineExercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const representativeReps = routineExercise.sets?.[0]?.targetReps || "10";
  const representativeWeight = routineExercise.sets?.[0]?.targetWeight || 0;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg' : ''}`}
    >
      <Card className="bg-muted/20 border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors touch-none"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{index + 1}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">{routineExercise.exercise?.title}</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onRemove(routineExercise.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-1 mb-3">
                {((routineExercise.exercise as any)?.muscleGroups || []).map((muscle: string, muscleIdx: number) => (
                  <Badge key={`muscle-${routineExercise.id}-${muscleIdx}-${muscle}`} variant="secondary" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Sets</label>
                  <Input 
                    type="number"
                    value={routineExercise.sets?.length || 1}
                    onChange={(e) => {
                      const newSetCount = Math.max(1, parseInt(e.target.value) || 1)
                      const currentSets = routineExercise.sets || []
                      
                      const newSets = Array.from({ length: newSetCount }, (_, i) => {
                        if (currentSets[i]) {
                          return { ...currentSets[i] }
                        } else {
                          const lastSet = currentSets[currentSets.length - 1]
                          const setTimestamp = Date.now()
                          const setRandomId = Math.random().toString(36).substr(2, 9)
                          return {
                            id: `set-${routineExercise.id}-${i}-${setTimestamp}-${setRandomId}`,
                            routineExerciseId: routineExercise.id,
                            setNumber: i + 1,
                            targetReps: lastSet?.targetReps || "10",
                            targetWeight: lastSet?.targetWeight || 0
                          }
                        }
                      })
                      
                      onUpdate(routineExercise.id, { sets: newSets })
                    }}
                    className="h-8 bg-background border-input text-foreground"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Reps objetivo</label>
                  <Input 
                    type="text"
                    value={representativeReps}
                    onChange={(e) => {
                      const targetReps = e.target.value || "10"
                      const currentSets = [...(routineExercise.sets || [])]
                      
                      const updatedSets = currentSets.map(set => ({
                        ...set,
                        targetReps
                      }))
                      
                      if (updatedSets.length === 0) {
                        const setTimestamp = Date.now()
                        const setRandomId = Math.random().toString(36).substr(2, 9)
                        updatedSets.push({
                          id: `set-${routineExercise.id}-0-${setTimestamp}-${setRandomId}`,
                          routineExerciseId: routineExercise.id,
                          setNumber: 1,
                          targetReps,
                          targetWeight: 0
                        })
                      }
                      
                      onUpdate(routineExercise.id, { sets: updatedSets })
                    }}
                    placeholder="ej: 8-12, Al Fallo, 15"
                    className="h-8 bg-background border-input text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Peso objetivo (kg)</label>
                  <Input 
                    type="number"
                    value={representativeWeight}
                    onChange={(e) => {
                      const targetWeight = Math.max(0, parseInt(e.target.value) || 0)
                      const currentSets = [...(routineExercise.sets || [])]
                      
                      const updatedSets = currentSets.map(set => ({
                        ...set,
                        targetWeight
                      }))
                      
                      if (updatedSets.length === 0) {
                        const setTimestamp = Date.now()
                        const setRandomId = Math.random().toString(36).substr(2, 9)
                        updatedSets.push({
                          id: `set-${routineExercise.id}-0-${setTimestamp}-${setRandomId}`,
                          routineExerciseId: routineExercise.id,
                          setNumber: 1,
                          targetReps: "10",
                          targetWeight
                        })
                      }
                      
                      onUpdate(routineExercise.id, { sets: updatedSets })
                    }}
                    placeholder="0"
                    className="h-8 bg-background border-input text-foreground"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Descanso (seg)</label>
                  <Input 
                    type="number"
                    value={routineExercise.restTime || 90}
                    onChange={(e) => {
                      const restTime = Math.max(0, parseInt(e.target.value) || 90)
                      onUpdate(routineExercise.id, { restTime })
                    }}
                    placeholder="90"
                    className="h-8 bg-background border-input text-foreground"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground">Notas</label>
                <Textarea 
                  value={routineExercise.notes || ""}
                  onChange={(e) => {
                    onUpdate(routineExercise.id, { 
                      notes: e.target.value 
                    })
                  }}
                  placeholder="Notas del ejercicio..."
                  className="h-16 resize-none text-sm bg-background border-input text-foreground"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RoutineEditPageClient({ routineId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations();
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [localRoutine, setLocalRoutine] = useState<LocalRoutine | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const calculateEstimatedDuration = (routine: LocalRoutine): number => {
    if (!routine.exercises || routine.exercises.length === 0) return 0;
    
    let totalMinutes = 0;
    
    routine.exercises.forEach(exercise => {
      const setsCount = exercise.sets?.length || 3;
      const timePerSet = 1.5;
      const setsTime = setsCount * timePerSet;
      
      
      const restTime = (exercise.restTime || 90) / 60; 
      const totalRestTime = Math.max(0, setsCount - 1) * restTime; 
      const exerciseTime = setsTime + totalRestTime;
      totalMinutes += exerciseTime;
    });
    
    totalMinutes += 8;
    
    return Math.round(totalMinutes);
  };

  const routineSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().optional(),
    difficulty: z.string().min(1, "La dificultad es requerida"),
  });

  type RoutineFormValues = z.infer<typeof routineSchema>;

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'intermediate'
    }
  });

  const { data: routine, isLoading: routineLoading, error: routineError } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: async () => {
      const data = await ofetch<{ routine: Routine }>(`/api/routines/${routineId}`)
      return data.routine
    },
    enabled: !!routineId,
  })

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const data = await ofetch<{ exercises: Exercise[] }>('/api/exercises')
      return data.exercises
    },
  })

  const filteredExercises = useMemo(() => {
    return exercises
      .filter(ex => !localRoutine?.exercises.some(re => re.exerciseId === ex.id))
      .filter(ex => 
        ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex as any).muscleGroups?.some((muscle: string) => 
          muscle.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
  }, [exercises, localRoutine?.exercises, searchTerm])

  const updateMutation = useMutation({
    mutationFn: async (data: RoutineFormValues) => {
      if (!localRoutine) throw new Error('No routine data')
      
      
      const exercisesToSend = localRoutine.exercises.map(ex => {
        const exerciseData = {
          id: ex.id,
          exerciseId: ex.exerciseId,
          order: ex.order,
          sets: (Array.isArray(ex.sets) ? ex.sets : []).map(set => ({
            id: set.id,
            routineExerciseId: ex.id, 
            setNumber: set.setNumber,
            targetReps: set.targetReps, 
            targetWeight: set.targetWeight
          })),
          restTime: ex.restTime || 90,
          notes: ex.notes || ''
        }
        
        return exerciseData
      })
      
      const bodyToSend = {
        ...data,
        exercises: exercisesToSend
      }
      
      
      const response = await ofetch<{ routine: Routine }>(`/api/routines/${routineId}`, {
        method: 'PUT',
        body: bodyToSend
      })
      return response.routine
    },
    onSuccess: (updatedRoutine) => {
      queryClient.invalidateQueries({ queryKey: ['routine', routineId] })
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      toast({
        title: "Rutina actualizada",
        description: "Los cambios se han guardado correctamente.",
      })
      router.push(`/dashboard/routines/${routineId}`)
    },
    onError: (error: any) => {
      console.error('Error saving routine:', error)
      toast({
        title: "Error",
        description: error?.data?.error || "Hubo un problema guardando los cambios.",
        variant: "destructive"
      })
    }
  })

  const updateLocalExercise = (routineExerciseId: string, updates: Partial<LocalRoutineExercise>) => {
    if (localRoutine) {
      const updatedExercises = localRoutine.exercises.map(ex => {
        if (ex.id === routineExerciseId) {
          const updatedExercise = { 
            ...ex, 
            ...updates,
            sets: updates.sets ? updates.sets.map(set => ({ ...set })) : ex.sets?.map(set => ({ ...set }))
          }
          
          return updatedExercise
        } else {
          return { 
            ...ex,
            sets: ex.sets?.map(set => ({ ...set }))
          }
        }
      })
      
      setLocalRoutine({
        ...localRoutine,
        exercises: updatedExercises
      })
    } else {
      console.error('No local routine found!')
    }
  };

  const addExerciseLocally = (exercise: Exercise) => {
    if (!localRoutine) return;
    
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const exerciseOrder = localRoutine.exercises.length + 1
    const newExerciseId = `temp-exercise-${exercise.id}-${timestamp}-${randomId}`
    
    const newExercise: LocalRoutineExercise = {
      id: newExerciseId,
      exerciseId: exercise.id,
      routineId: routineId,
      order: exerciseOrder,
      exercise: { ...exercise },
      sets: [
        {
          id: `temp-set-${newExerciseId}-1-${timestamp}-${randomId}`,
          routineExerciseId: newExerciseId,
          setNumber: 1,
          targetReps: "10",
          targetWeight: 0
        },
        {
          id: `temp-set-${newExerciseId}-2-${timestamp}-${randomId}`,
          routineExerciseId: newExerciseId,
          setNumber: 2,
          targetReps: "10",
          targetWeight: 0
        },
        {
          id: `temp-set-${newExerciseId}-3-${timestamp}-${randomId}`,
          routineExerciseId: newExerciseId,
          setNumber: 3,
          targetReps: "10",
          targetWeight: 0
        }
      ],
      restTime: 90,
      notes: ''
    };

    setLocalRoutine({
      ...localRoutine,
      exercises: [...localRoutine.exercises.map(ex => ({ 
        ...ex, 
        sets: ex.sets?.map(set => ({ ...set })),
        exercise: ex.exercise ? { ...ex.exercise } : undefined
      })), newExercise]
    });

    setIsAddingExercise(false);
    setSearchTerm('');
    
    toast({
      title: "Ejercicio agregado",
      description: "El ejercicio se ha añadido a tu rutina. Recuerda guardar los cambios.",
    })
  };

  
  const removeExerciseLocally = (routineExerciseId: string) => {
    if (!localRoutine) return;
    
    setLocalRoutine({
      ...localRoutine,
      exercises: localRoutine.exercises
        .filter(ex => ex.id !== routineExerciseId)
        .map(ex => ({ 
          ...ex, 
          sets: ex.sets?.map(set => ({ ...set })),
          exercise: ex.exercise ? { ...ex.exercise } : undefined
        }))
    });
    
    toast({
      title: "Ejercicio eliminado",
      description: "El ejercicio se ha removido de tu rutina. Recuerda guardar los cambios.",
    })
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && localRoutine) {
      const oldIndex = localRoutine.exercises.findIndex(ex => ex.id === active.id);
      const newIndex = localRoutine.exercises.findIndex(ex => ex.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newExercises = arrayMove(localRoutine.exercises, oldIndex, newIndex);
        
        const reorderedExercises = newExercises.map((ex, index) => ({
          ...ex,
          order: index + 1,
          sets: ex.sets?.map(set => ({ ...set })),
          exercise: ex.exercise ? { ...ex.exercise } : undefined
        }));

        setLocalRoutine({
          ...localRoutine,
          exercises: reorderedExercises
        });

        toast({
          title: "Ejercicios reordenados",
          description: "El orden de los ejercicios se ha actualizado. Recuerda guardar los cambios.",
        });
      }
    }
  };

  useEffect(() => {
    if (routine) {
      
      const timestamp = Date.now()
      
      setLocalRoutine({
        ...routine,
        difficulty: (routine as any).difficulty || 'intermediate',
        exercises: routine.exercises.map((ex, exerciseIndex) => {
          const exerciseRandomId = Math.random().toString(36).substr(2, 9)
          const exerciseId = ex.id || `routine-exercise-${ex.exerciseId}-${exerciseIndex}-${timestamp}-${exerciseRandomId}`
          let processedSets: LocalRoutineSet[] = []
          
          if ((ex as any).setsData && Array.isArray((ex as any).setsData)) {
            processedSets = (ex as any).setsData.map((set: any, setIndex: number) => {
              const setRandomId = Math.random().toString(36).substr(2, 9)
              return {
                id: set.id || `set-${exerciseId}-${setIndex}-${timestamp}-${setRandomId}`,
                routineExerciseId: exerciseId,
                setNumber: set.setNumber || setIndex + 1,
                targetReps: typeof set.targetReps === 'string' ? set.targetReps : (set.targetReps || "10").toString(),
                targetWeight: set.targetWeight || 0
              }
            })
          } else if (Array.isArray(ex.sets) && ex.sets.length > 0) {
            processedSets = ex.sets.map((set: any, setIndex: number) => {
              const setRandomId = Math.random().toString(36).substr(2, 9)
              return {
                id: set.id || `set-${exerciseId}-${setIndex}-${timestamp}-${setRandomId}`,
                routineExerciseId: exerciseId,
                setNumber: set.setNumber || setIndex + 1,
                targetReps: typeof set.targetReps === 'string' ? set.targetReps : (set.targetReps || "10").toString(),
                targetWeight: set.targetWeight || 0
              }
            })
          } else {
            const setCount = typeof ex.sets === 'number' ? ex.sets : 3
            const targetReps = (ex as any).reps || "10" 
            const targetWeight = parseFloat((ex as any).weight) || 0
            processedSets = Array.from({ length: setCount }, (_, setIndex) => {
              const setRandomId = Math.random().toString(36).substr(2, 9)
              return {
                id: `set-${exerciseId}-${setIndex}-${timestamp}-${setRandomId}`,
                routineExerciseId: exerciseId,
                setNumber: setIndex + 1,
                targetReps: targetReps, 
                targetWeight: targetWeight
              }
            })
          }
          return {
            ...ex,
            id: exerciseId,
            sets: processedSets,
            restTime: (ex as any).restTime || 90,
            notes: (ex as any).notes || '',
            exercise: ex.exercise ? { ...ex.exercise } : undefined
          }
        })
      })
      form.reset({
        title: routine.title,
        description: routine.description || '',
        difficulty: (routine as any).difficulty || 'intermediate'
      })
    }
  }, [routine, form])

  useEffect(() => {
    if (routineError) {
      toast({
        title: "Error",
        description: "No se pudo cargar la rutina.",
        variant: "destructive",
      })
    }
  }, [routineError, toast])

  const onSubmit = async (data: RoutineFormValues) => {
    updateMutation.mutate(data)
  };

  if (routineLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.routines.loadingRoutine}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!localRoutine) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">{t.routines.routineNotFound}</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl mb-16 md:mb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/dashboard/routines/${routineId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Rutina</h1>
            <p className="text-muted-foreground">Personaliza tu rutina de entrenamiento</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/training/start?routineId=${routineId}`}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Probar rutina
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Información Básica</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Título</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ej., Entrenamiento de Fuerza" 
                          className="bg-background border-input text-foreground"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe la rutina (opcional)" 
                          className="resize-none bg-background border-input text-foreground" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Dificultad</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-input">
                            <SelectValue placeholder="Selecciona la dificultad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Principiante</SelectItem>
                          <SelectItem value="intermediate">Intermedio</SelectItem>
                          <SelectItem value="advanced">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Rutina
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Exercises */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Dumbbell className="h-5 w-5" />
                Ejercicios ({localRoutine.exercises.length})
              </CardTitle>
              <Dialog open={isAddingExercise} onOpenChange={setIsAddingExercise}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Ejercicio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-background border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Agregar Ejercicio</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Busca y selecciona un ejercicio para agregar a tu rutina
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Buscador */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar ejercicios por nombre, descripción o grupo muscular..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background border-input text-foreground"
                    />
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {filteredExercises.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        {searchTerm ? (
                          <p>No se encontraron ejercicios que coincidan con &ldquo;{searchTerm}&rdquo;</p>
                        ) : (
                          <p>Todos los ejercicios disponibles ya están en tu rutina</p>
                        )}
                      </div>
                    ) : (
                      filteredExercises.map(exercise => (
                        <Card 
                          key={exercise.id} 
                          className="cursor-pointer hover:bg-muted/50 transition-colors bg-card border-border" 
                          onClick={() => addExerciseLocally(exercise)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{exercise.title}</h4>
                                <p className="text-sm text-muted-foreground">{exercise.description}</p>
                                <div className="flex gap-1 mt-2">
                                  {(exercise as any).muscleGroups?.map((muscle: string) => (
                                    <Badge key={muscle} variant="secondary" className="text-xs">
                                      {muscle}
                                    </Badge>
                                  )) || []}
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {localRoutine.exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-foreground">No hay ejercicios en esta rutina</p>
                <p className="text-sm">Agrega ejercicios para comenzar</p>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={localRoutine.exercises.map(ex => ex.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {localRoutine.exercises
                      .sort((a, b) => a.order - b.order)
                      .map((routineExercise, index) => (
                        <SortableRoutineExercise
                          key={routineExercise.id}
                          routineExercise={routineExercise}
                          onUpdate={updateLocalExercise}
                          onRemove={removeExerciseLocally}
                          index={index}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {localRoutine.exercises.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5" />
                Resumen de la Rutina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{localRoutine.exercises.length}</div>
                  <p className="text-sm text-muted-foreground">Ejercicios</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {localRoutine.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Sets totales</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {calculateEstimatedDuration(localRoutine)}min
                  </div>
                  <p className="text-sm text-muted-foreground">Duración estimada</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {Array.from(new Set(
                      localRoutine.exercises.flatMap(ex => (ex.exercise as any)?.muscleGroups || [])
                    )).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Grupos musculares</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
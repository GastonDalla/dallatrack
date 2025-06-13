"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Play,
  Pause,
  Square,
  Clock,
  Dumbbell,
  CheckCircle2,
  Circle,
  Timer,
  Target,
  Plus,
  Minus,
  Save,
  X,
  RotateCcw,
  Loader2,
  AlertCircle,
  Star,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { TrainingSession } from "@/types";
import { useTranslations, useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link'
import { useStats } from '@/hooks/useStats'

interface LocalSet {
  id: string;
  setNumber: number;
  reps: number | undefined;
  weight: number | undefined;
  completed: boolean;
  notes?: string;
  startTime?: Date;
  endTime?: Date;
}

interface LocalExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  targetWeight?: number;
  restTime: number;
  sets: LocalSet[];
  notes?: string;
  muscleGroups: string[];
  order: number;
}

interface LocalSession extends Omit<TrainingSession, 'exercises'> {
  exercises: LocalExercise[];
  currentExerciseIndex: number;
  currentSetIndex: number;
}

interface Props {
  sessionId: string;
}

export function TrainingSessionPageClient({ sessionId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations();
  const { language } = useLanguage();
  const [currentReps, setCurrentReps] = useState<number | undefined>();
  const [currentWeight, setCurrentWeight] = useState<number | undefined>();
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState(false);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [sessionRating, setSessionRating] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState("");
  const [deleteSetDialog, setDeleteSetDialog] = useState<{open: boolean, exerciseIndex: number, setIndex: number} | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { updateStats } = useStats();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['training-session', sessionId],
    queryFn: async () => {
      const data = await ofetch<{ session: TrainingSession }>(`/api/training-sessions/${sessionId}`)
      return data.session
    },
    enabled: !!sessionId,
  })

  useEffect(() => {
    if (session) {
      setIsPaused((session as any).isPaused || false)
    }
  }, [session])

  const completeSetMutation = useMutation({
    mutationFn: async () => {
      if (!session || !currentReps || !currentWeight) throw new Error('Datos incompletos')
      
      const currentExerciseIndex = (session as any).currentExerciseIndex || 0
      const currentSetIndex = (session as any).currentSetIndex || 0
      
      const updatedExercises = [...session.exercises]
      const exercise = updatedExercises[currentExerciseIndex]
      const updatedSets = [...(exercise as any).sets]
      updatedSets[currentSetIndex] = {
        ...updatedSets[currentSetIndex],
        reps: currentReps,
        weight: currentWeight,
        completed: true,
        endTime: new Date()
      }
      exercise.sets = updatedSets
      updatedExercises[currentExerciseIndex] = exercise
      
      let newExerciseIndex = currentExerciseIndex
      let newSetIndex = currentSetIndex + 1
      
      if (newSetIndex >= updatedSets.length) {
        newExerciseIndex += 1
        newSetIndex = 0
      }
      
      const response = await ofetch<{ session: TrainingSession }>(`/api/training-sessions/${sessionId}`, {
        method: 'PUT',
        body: { 
          exercises: updatedExercises,
          currentExerciseIndex: newExerciseIndex,
          currentSetIndex: newSetIndex
        }
      })
      return response.session
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(['training-session', sessionId], updatedSession)
      setCurrentReps(undefined)
      setCurrentWeight(undefined)
      
      const newExerciseIndex = (updatedSession as any).currentExerciseIndex || 0
      if (newExerciseIndex < updatedSession.exercises.length) {
        const nextExercise = updatedSession.exercises[newExerciseIndex]
        setRestTimer((nextExercise as any).restTime || 90)
        setIsResting(true)
      }
      
      toast({
        title: t.training.setCompleted,
        description: t.training.excellentWork,
      })
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.training.problemSavingWorkout,
        variant: "destructive"
      })
    }
  })

  const manageSetMutation = useMutation({
    mutationFn: async ({ exerciseIndex, action, setIndex }: { 
      exerciseIndex: number, 
      action: 'add' | 'delete', 
      setIndex?: number 
    }) => {
      const data = await ofetch<{ session: TrainingSession, message: string }>(`/api/training-sessions/${sessionId}/sets`, {
        method: 'POST',
        body: { exerciseIndex, action, setIndex }
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-session', sessionId] })
      toast({
        title: data.message,
        description: t.common.success,
      })
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.error || error?.message || 'Error desconocido'
      
      let translatedMessage = errorMessage
      if (errorMessage.includes('set actual')) {
        translatedMessage = t.training.errorDeleteCurrentSet
      } else if (errorMessage.includes('completado')) {
        translatedMessage = t.training.errorDeleteCompletedSet  
      } else if (errorMessage.includes('último set')) {
        translatedMessage = t.training.cannotDeleteOnlySet
      }
      
      toast({
        title: "Error",
        description: translatedMessage,
        variant: "destructive",
      })
    }
  })

  const pauseResumeMutation = useMutation({
    mutationFn: async (shouldPause: boolean) => {
      const response = await ofetch<{ session: TrainingSession }>(`/api/training-sessions/${sessionId}`, {
        method: 'PUT',
        body: { 
          isPaused: shouldPause,
          pausedAt: shouldPause ? new Date().toISOString() : null,
          resumedAt: shouldPause ? null : new Date().toISOString()
        }
      })
      return response.session
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(['training-session', sessionId], updatedSession)
      setIsPaused((updatedSession as any).isPaused || false)
      
      if ((updatedSession as any).isPaused) {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current)
        }
        if (restIntervalRef.current) {
          clearInterval(restIntervalRef.current)
        }
        toast({
          title: "Entrenamiento pausado",
          description: "Puedes continuar cuando estés listo",
        })
      } else {
        toast({
          title: "Entrenamiento reanudado",
          description: "¡Sigamos entrenando!",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "Error al pausar/reanudar el entrenamiento",
        variant: "destructive"
      })
    }
  })

  useEffect(() => {
    const sessionData = session
    const isSessionActive = sessionData && (sessionData as any)?.isActive
    const sessionStartTime = sessionData?.startTime

    if (isSessionActive && sessionStartTime && !isPaused) {
      const updateDuration = () => {
        const startTime = new Date(sessionStartTime).getTime();
        const now = Date.now();
        const duration = Math.floor((now - startTime) / 1000);
        setSessionDuration(duration);
      };

      updateDuration();
      const interval = setInterval(updateDuration, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [session, isPaused]);

  useEffect(() => {
    if (isResting && restTimer > 0 && !isPaused) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [isResting, restTimer, isPaused]);

  useEffect(() => {
    const errorMessage = t.common.error
    const failedToLoadMessage = t.training.failedToLoadSession
    
    if (error) {
      toast({
        title: errorMessage,
        description: failedToLoadMessage,
        variant: "destructive",
      })
    }
  }, [error, toast, t.common.error, t.training.failedToLoadSession])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!session) return 0;
    
    const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = session.exercises.reduce((acc, ex) => 
      acc + ex.sets.filter(set => set.completed).length, 0
    );
    
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-6 w-6 cursor-pointer transition-colors ${
          i < rating ? "text-yellow-500 fill-current" : "text-muted-foreground hover:text-yellow-400"
        }`}
        onClick={() => setSessionRating(i + 1)}
      />
    ));
  };

  const skipRestTimer = () => {
    setIsResting(false);
    setRestTimer(0);
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
  };

  const addRestTime = (seconds: number) => {
    setRestTimer(prev => prev + seconds);
  };

  const finishSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await ofetch<{ session: TrainingSession }>(`/api/training-sessions/${sessionId}`, {
        method: 'PUT',
        body: {
          isActive: false,
          endTime: new Date().toISOString(),
          notes: sessionNotes,
          rating: sessionRating > 0 ? sessionRating : undefined
        }
      })
      return response.session
    },
    onSuccess: (completedSession) => {
      const duration = Math.floor(sessionDuration / 60) 
      let totalWeight = 0
      let setsCompleted = 0
      
      completedSession.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.completed) {
            setsCompleted++
            if (set.weight && set.reps) {
              totalWeight += set.weight * set.reps
            }
          }
        })
      })

      updateStats({
        sessionId,
        duration,
        totalWeight,
        setsCompleted
      })
      
      queryClient.invalidateQueries({ queryKey: ['training-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['training-session', sessionId] })
      
      if (session?.routineId) {
        queryClient.invalidateQueries({ queryKey: ['routine', session.routineId] })
        queryClient.invalidateQueries({ queryKey: ['routines'] }) 
      }
      
      if (session?.exercises) {
        session.exercises.forEach(exercise => {
          queryClient.invalidateQueries({ queryKey: ['exercise-usage', exercise.exerciseId] })
        })
      }
      
      toast({
        title: t.training.workoutCompleted,
        description: t.training.sessionSaved,
      })
      router.push(`/dashboard/history/${sessionId}`)
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.training.problemSavingWorkout,
        variant: "destructive"
      })
    }
  })

  const finishWorkout = async () => {
    finishSessionMutation.mutate()
  };

  const handleAddSet = (exerciseIndex: number) => {
    manageSetMutation.mutate({
      exerciseIndex,
      action: 'add'
    })
  }

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    setDeleteSetDialog({ open: true, exerciseIndex, setIndex })
  }

  const confirmDeleteSet = () => {
    if (!deleteSetDialog) return
    
    manageSetMutation.mutate({
      exerciseIndex: deleteSetDialog.exerciseIndex,
      action: 'delete',
      setIndex: deleteSetDialog.setIndex
    })
    
    setDeleteSetDialog(null)
  }

  const handlePauseTraining = () => {
    pauseResumeMutation.mutate(true)
  }

  const handleResumeTraining = () => {
    pauseResumeMutation.mutate(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.training.loadingSession}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t.training.sessionNotFound}</h1>
          <Button onClick={() => router.back()}>
            {t.training.back}
          </Button>
        </div>
      </div>
    );
  }

  if (session.endTime) {
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t.training.sessionAlreadyFinished}</h1>
            <p className="text-muted-foreground mb-1">
              {t.training.sessionFinishedOn}{' '}
              {new Date(session.endTime).toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {t.training.cannotModifyFinished}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <a href={`/dashboard/history/${sessionId}`}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {t.training.viewWorkoutDetails}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/training/start">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  {t.training.startNewWorkout}
                </Link>
              </Button>
              <Button variant="ghost" onClick={() => router.back()}>
                {t.training.back}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentExercise = session.exercises[(session as any).currentExerciseIndex || 0];
  const currentSet = currentExercise?.sets[(session as any).currentSetIndex || 0];
  const progress = getProgress();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl mb-16 md:mb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{(session as any).routineName || t.training.startEmptyWorkout}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(sessionDuration)}
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {Math.round(progress)}% {t.training.progressComplete}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isPaused ? (
            <Button 
              variant="outline" 
              onClick={handlePauseTraining} 
              disabled={pauseResumeMutation.isPending}
            >
              {pauseResumeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              {t.training.pause}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleResumeTraining} 
              disabled={pauseResumeMutation.isPending}
            >
              {pauseResumeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {t.training.resume}
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowFinishDialog(true)}>
            <Square className="h-4 w-4 mr-2" />
            {t.training.finish}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-1">
          {t.training.workoutProgress}: {Math.round(progress)}%
        </p>
      </div>

      {/* Indicador de pausa */}
      {isPaused && (
        <Card className="mb-6 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <Pause className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div className="text-center">
                <h3 className="font-semibold text-foreground">Entrenamiento Pausado</h3>
                <p className="text-sm text-muted-foreground">Haz clic en &ldquo;Reanudar&rdquo; para continuar tu entrenamiento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rest Timer */}
      {isResting && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="font-semibold text-foreground">{t.training.restTime}</h3>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatTime(restTimer)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addRestTime(30)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t.training.addTime.replace('{seconds}', '30')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => addRestTime(60)}>
                  <Plus className="h-4 w-4 mr-1" />
                  1m
                </Button>
                <Button size="sm" onClick={skipRestTimer}>
                  {t.training.skipRest}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Exercise */}
      {currentExercise && (
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Dumbbell className="h-5 w-5" />
                  {(currentExercise as any).exerciseName || "Ejercicio"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set {((session as any).currentSetIndex || 0) + 1} de {currentExercise.sets.length} • 
                  Objetivo: {(currentExercise as any).targetReps || "N/A"} reps
                  {(currentExercise as any).targetWeight && ` • ${(currentExercise as any).targetWeight}kg`}
                </p>
              </div>
              <div className="flex gap-1">
                {((currentExercise as any).muscleGroups || []).map((muscle: string) => (
                  <Badge key={muscle} variant="secondary" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Set Input */}
            {currentSet && !currentSet.completed && (
              <div className="p-4 border rounded-lg bg-muted/50 border-border">
                <h4 className="font-medium mb-3 text-foreground">{t.training.currentSet}</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t.training.repetitions}</label>
                    <Input
                      type="number"
                      value={currentReps || ""}
                      onChange={(e) => setCurrentReps(parseInt(e.target.value) || undefined)}
                      placeholder={t.training.reps}
                      className="bg-background border-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t.training.weight} (kg)</label>
                    <Input
                      type="number"
                      step="0.5"
                      value={currentWeight || ""}
                      onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || undefined)}
                      placeholder={t.common.weight}
                      className="bg-background border-input"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => completeSetMutation.mutate()}
                  disabled={!currentReps || !currentWeight || completeSetMutation.isPending || isPaused}
                >
                  {completeSetMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.training.completing}
                    </>
                  ) : isPaused ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausado
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t.training.completeSet}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* All Sets Overview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">{t.training.allSets}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSet((session as any).currentExerciseIndex || 0)}
                  disabled={manageSetMutation.isPending}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {t.training.addSetButton}
                </Button>
              </div>
              {currentExercise.sets.map((set, setIndex) => (
                <div 
                  key={set.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    setIndex === ((session as any).currentSetIndex || 0)
                      ? 'border-primary bg-primary/10' 
                      : set.completed 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {set.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : setIndex === ((session as any).currentSetIndex || 0) ? (
                      <Circle className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">Set {setIndex + 1}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-4 text-sm">
                      {set.completed ? (
                        <>
                          <span className="text-foreground">{set.reps} {t.training.reps}</span>
                          <span className="text-foreground">{set.weight}kg</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {set.reps && set.weight ? (set.reps * set.weight).toFixed(1) : 0}kg {t.training.total}
                          </span>
                        </>
                      ) : setIndex === ((session as any).currentSetIndex || 0) ? (
                        <span className="text-primary font-medium">{t.training.current}</span>
                      ) : (
                        <span className="text-muted-foreground">{t.training.pending}</span>
                      )}
                    </div>
                    
                    {/* Botón eliminar set (solo si no está completado, no es el actual y hay más de 1 set) */}
                    {!set.completed && 
                     setIndex !== ((session as any).currentSetIndex || 0) && 
                     currentExercise.sets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSet((session as any).currentExerciseIndex || 0, setIndex)}
                        disabled={manageSetMutation.isPending}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Eliminar set pendiente"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Exercise Notes */}
            <div>
              <label className="text-sm font-medium text-foreground">{t.training.exerciseNotes}</label>
              <Textarea
                value={(currentExercise as any).notes || ""}
                onChange={(e) => {
                  
                }}
                placeholder={t.training.addExerciseNotes}
                className="mt-1 bg-background border-input"
                disabled
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Exercises Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{t.training.workoutSummary}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.exercises.map((exercise, exerciseIndex) => {
              const completedSets = exercise.sets.filter(set => set.completed).length;
              const isCurrentExercise = exerciseIndex === ((session as any).currentExerciseIndex || 0);
              
              return (
                <div 
                  key={exercise.id} 
                  className={`p-3 rounded-lg border transition-colors ${
                    isCurrentExercise ? 'border-primary bg-primary/10' : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{(exercise as any).exerciseName || t.common.exercise}</h4>
                      <p className="text-sm text-muted-foreground">
                        {completedSets}/{exercise.sets.length} {t.training.setsCompleted}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(completedSets / exercise.sets.length) * 100} 
                        className="w-20 h-2"
                      />
                      {isCurrentExercise && (
                        <Badge variant="default" className="text-xs">{t.training.current}</Badge>
                      )}
                      {completedSets === exercise.sets.length && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Finish Workout Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t.training.finishWorkout}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t.training.finishWorkoutConfirm}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">{t.training.rateWorkout}</label>
              <div className="flex gap-1 mt-2">
                {getRatingStars(sessionRating)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t.training.sessionNotes}</label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder={t.training.sessionNotesPlaceholder}
                className="mt-1 bg-background border-input text-foreground"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFinishDialog(false)}>
                {t.training.cancel}
              </Button>
              <Button onClick={finishWorkout} disabled={finishSessionMutation.isPending}>
                {finishSessionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.training.finalizingWorkout}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t.training.finalizeWorkout}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Set Confirmation Dialog */}
      <AlertDialog open={deleteSetDialog?.open || false} onOpenChange={(open) => !open && setDeleteSetDialog(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t.training.deleteSetTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t.training.deleteSetConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.training.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.training.deleteSetButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
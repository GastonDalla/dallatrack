"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit,
  PlayCircle,
  Share2,
  Download,
  Dumbbell,
  Clock,
  Target,
  Calendar,
  BarChart3,
  Loader2,
  Copy,
  Trash2,
  Star,
  History
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Routine } from "@/types";
import { useTranslations, useLanguage } from '@/contexts/LanguageContext'

interface Props {
  routineId: string;
}

export function RoutineDetailPageClient({ routineId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations();
  const { language } = useLanguage();

  const calculateEstimatedDuration = (routine: Routine): number => {
    if (!routine.exercises || routine.exercises.length === 0) return 0;
    
    let totalMinutes = 0;
    
    routine.exercises.forEach(exercise => {
      let setsCount = 0;
      if (Array.isArray(exercise.sets)) {
        setsCount = exercise.sets.length;
      } else if ((exercise as any).setsData && Array.isArray((exercise as any).setsData)) {
        setsCount = (exercise as any).setsData.length;
      } else if (typeof exercise.sets === 'number') {
        setsCount = exercise.sets;
      } else {
        setsCount = 3; 
      }
      
      const timePerSet = 1.5;
      const setsTime = setsCount * timePerSet;
      
      const restTime = ((exercise as any).restTime || 90) / 60; 
      const totalRestTime = Math.max(0, setsCount - 1) * restTime; 
      const exerciseTime = setsTime + totalRestTime;
      totalMinutes += exerciseTime;
    });
    
    totalMinutes += 8;
    
    return Math.round(totalMinutes);
  };

  const { data: routine, isLoading, error } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: async () => {
      const data = await ofetch<{ routine: Routine }>(`/api/routines/${routineId}`)
      return data.routine
    },
    enabled: !!routineId,
  })

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const response = await ofetch<{ routine: Routine }>(`/api/routines/${routineId}/duplicate`, {
        method: 'POST'
      })
      return response.routine
    },
    onSuccess: (newRoutine) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      toast({
        title: t.routines.routineDuplicated,
        description: t.routines.routineDuplicatedDescription,
      })
      router.push(`/dashboard/routines/${newRoutine.id}`)
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.routines.failedToDuplicate,
        variant: "destructive"
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await ofetch(`/api/routines/${routineId}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      toast({
        title: t.routines.routineDeleted,
        description: t.routines.routineDeletedSuccess,
      })
      router.push('/dashboard/routines')
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.routines.failedToDelete,
        variant: "destructive"
      })
    }
  })

  useEffect(() => {
    if (error) {
      toast({
        title: t.common.error,
        description: t.routines.failedToLoadRoutine,
        variant: "destructive",
      })
    }
  }, [error, toast, t])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastPerformed = (dateString?: string) => {
    if (!dateString) return t.training.never;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime(); 
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
    if (diffTime < 0 || diffMinutes < 1) return language === 'es' ? "Hace un momento" : "Just now";
    if (diffMinutes < 60) return `${language === 'es' ? 'Hace' : ''} ${diffMinutes} min${language === 'en' ? ' ago' : ''}`;
    if (diffHours < 24) return `${language === 'es' ? 'Hace' : ''} ${diffHours}h${language === 'en' ? ' ago' : ''}`;
    if (diffDays === 1) return t.training.yesterday;
    if (diffDays < 7) return language === 'es' ? `Hace ${diffDays} días` : `${diffDays} days ago`;
    if (diffDays < 30) return language === 'es' ? `Hace ${Math.ceil(diffDays / 7)} semanas` : `${Math.ceil(diffDays / 7)} weeks ago`;
    return language === 'es' ? `Hace ${Math.ceil(diffDays / 30)} meses` : `${Math.ceil(diffDays / 30)} months ago`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante':
      case 'beginner': return 'bg-green-500';
      case 'intermedio':
      case 'intermediate': return 'bg-yellow-500';
      case 'avanzado':
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante':
      case 'beginner': return t.training.beginner;
      case 'intermedio':
      case 'intermediate': return t.training.intermediate;
      case 'avanzado':
      case 'advanced': return t.training.advanced;
      default: return difficulty;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={`star-${i}`} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ));
  };

  const duplicateRoutine = () => {
    duplicateMutation.mutate()
  };

  const deleteRoutine = () => {
    deleteMutation.mutate()
  };

  const startWorkout = () => {
    router.push(`/dashboard/training/start?routineId=${routineId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.routines.loadingRoutine}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground">{t.routines.routineNotFound}</h3>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 mb-16 md:mb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common.back}
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{routine.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={`text-white ${getDifficultyColor((routine as any).difficulty || 'intermedio')}`}
              >
                {getDifficultyLabel((routine as any).difficulty || 'intermedio')}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {calculateEstimatedDuration(routine)} {t.training.minutes} {t.routines.approximateTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {routine.description && (
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-4">
            <p className="text-muted-foreground">{routine.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5" />
                {t.routines.routineStats}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{routine.exercises.length}</div>
                  <p className="text-sm text-muted-foreground">{t.training.exercises}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {routine.exercises.reduce((acc, ex) => {
                      let setsCount = 0;
                      if (Array.isArray(ex.sets)) {
                        setsCount = ex.sets.length;
                      } else if ((ex as any).setsData && Array.isArray((ex as any).setsData)) {
                        setsCount = (ex as any).setsData.length;
                      } else if (typeof ex.sets === 'number') {
                        setsCount = ex.sets;
                      } else {
                        setsCount = 3; 
                      }
                      return acc + setsCount;
                    }, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.routines.totalSets}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{calculateEstimatedDuration(routine)}min</div>
                  <p className="text-sm text-muted-foreground">{t.training.estimatedDuration}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{(routine as any).timesPerformed || 0}</div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.timesPerformed}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.routines.lastWorkout}</p>
                    <p className="font-medium text-foreground">{formatLastPerformed((routine as any).lastPerformed)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.routines.averageRatingLabel}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">{getRatingStars(Math.round((routine as any).averageRating || 0))}</div>
                      <span className="text-sm text-foreground">{(routine as any).averageRating || 0}/5</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.routines.createdLabel}</p>
                    <p className="font-medium text-foreground">{formatDate(routine.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exercises List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Dumbbell className="h-5 w-5" />
                {t.training.exercises} ({routine.exercises.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {routine.exercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-foreground">{t.routines.noExercisesInRoutineMessage}</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/dashboard/routines/${routineId}/edit`}>
                      {t.routines.addExercisesButton}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {routine.exercises
                    .sort((a, b) => a.order - b.order)
                    .map((routineExercise, index) => {
                      let exerciseSets: any[] = []
                      let setsCount = 0
                      let targetReps = "N/A"
                      let targetWeight = "N/A"
                      if (Array.isArray(routineExercise.sets)) {
                        exerciseSets = routineExercise.sets
                        setsCount = exerciseSets.length
                        targetReps = exerciseSets[0]?.targetReps?.toString() || "N/A"
                        targetWeight = exerciseSets[0]?.targetWeight?.toString() || "N/A"
                      } else if ((routineExercise as any).setsData && Array.isArray((routineExercise as any).setsData)) {
                        exerciseSets = (routineExercise as any).setsData
                        setsCount = exerciseSets.length
                        targetReps = exerciseSets[0]?.targetReps?.toString() || "N/A"
                        targetWeight = exerciseSets[0]?.targetWeight?.toString() || "N/A"
                      } else {
                        setsCount = typeof routineExercise.sets === 'number' ? routineExercise.sets : 0
                        targetReps = (routineExercise as any).reps || "N/A"
                        targetWeight = (routineExercise as any).weight || "N/A"
                      }
                      
                      return (
                        <Card key={routineExercise.id} className="border-l-4 border-l-primary/20 bg-muted/20 border-border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium text-foreground">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg text-foreground">
                                    {routineExercise.exercise?.title || t.common.exercise}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {routineExercise.exercise?.description}
                                  </p>
                                  <div className="flex gap-1">
                                    {((routineExercise.exercise as any)?.muscleGroups || []).map((muscle: string, muscleIndex: number) => (
                                      <Badge key={`${routineExercise.id}-muscle-${muscleIndex}`} variant="secondary" className="text-xs">
                                        {muscle}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/exercises/${routineExercise.exerciseId}`}>
                                  <Target className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t.routines.setsLabel}</span>
                                <span className="ml-2 font-medium text-foreground">{setsCount}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.routines.targetRepsLabel}</span>
                                <span className="ml-2 font-medium text-foreground">{targetReps}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.routines.targetWeightLabel}</span>
                                <span className="ml-2 font-medium text-foreground">{targetWeight}kg</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t.routines.restLabel}</span>
                                <span className="ml-2 font-medium text-foreground">
                                  {(routineExercise as any).restTime ? `${(routineExercise as any).restTime}s` : "90s"}
                                </span>
                              </div>
                            </div>

                            {(routineExercise as any).notes && (
                              <div className="p-2 bg-muted/50 rounded text-sm">
                                <strong className="text-foreground">{t.routines.notesLabel}</strong> <span className="text-muted-foreground">{(routineExercise as any).notes}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Ratings */}
          {(routine as any).recentRatings && (routine as any).recentRatings.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Star className="h-5 w-5" />
                  {t.routines.recentRatings}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(routine as any).recentRatings.map((ratingData: any, index: number) => (
                    <div key={`rating-${index}`} className="flex items-start justify-between p-3 rounded-lg bg-muted/20 border border-border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {getRatingStars(ratingData.rating)}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {ratingData.rating}/5
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatLastPerformed(ratingData.date)}
                        </p>
                        {ratingData.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            &ldquo;{ratingData.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {(routine as any).recentRatings.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.routines.noRatingsYet}</p>
                    <p className="text-xs">{t.routines.noRatingsMessage}</p>
                  </div>
                )}
                
                {(routine as any).timesPerformed > (routine as any).recentRatings.length && (
                  <div className="text-center mt-3 pt-3 border-t border-border">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/history?routineId=${routineId}`}>
                        {t.routines.viewAllSessions}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t.routines.actions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={startWorkout}>
                <PlayCircle className="h-4 w-4 mr-2" />
                {t.routines.startWorkout}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/routines/${routineId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t.routines.editRoutineAction}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={duplicateRoutine}
                disabled={duplicateMutation.isPending}
              >
                {duplicateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.routines.duplicating}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {t.routines.duplicateRoutine}
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/history?routineId=${routineId}`}>
                  <History className="h-4 w-4 mr-2" />
                  {t.routines.viewHistory}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">{t.routines.dangerZone}</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.routines.deleting}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.routines.deleteRoutineAction}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">{t.routines.confirmDelete}</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      {t.routines.confirmDeleteDescription}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.routines.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteRoutine} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t.routines.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
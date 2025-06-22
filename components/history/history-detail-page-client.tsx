"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
  Target,
  Timer,
  CheckCircle,
  BarChart3,
  History,
  Loader2,
  Edit,
  Share2,
  Download,
  Star,
  Zap,
  Award,
  Activity,
  Flame,
  Trophy,
  Gauge,
  Heart,
  Users,
  MapPin,
  AlertCircle,
  Play
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { TrainingSession } from "@/types";
import { useTranslations } from '@/contexts/LanguageContext';

interface Props {
  sessionId: string;
}

export function HistoryDetailPageClient({ sessionId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['training-session', sessionId],
    queryFn: async () => {
      const data = await ofetch<{ session: TrainingSession }>(`/api/training-sessions/${sessionId}`)
      return data.session
    },
    enabled: !!sessionId,
    staleTime: 0, 
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (error) {
      toast({
        title: t.common.error,
        description: t.history.detail.sessionLoadError,
        variant: "destructive",
      })
    }
  }, [error, toast, t.common.error, t.history.detail.sessionLoadError])

  const isTrainingCompleted = session?.endTime != null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return t.history.detail.inProgress;
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const minutes = Math.floor((end - start) / (1000 * 60));
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={`star-${i}`} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-muted-foreground"}`} />
    ));
  };

  const calculateTotals = (session: TrainingSession) => {
    let totalSets = 0;
    let completedSets = 0;
    let totalReps = 0;
    let totalWeight = 0;
    let totalPlannedSets = 0;
    let totalPlannedReps = 0;
    let personalRecords = 0;

    session.exercises.forEach(exercise => {
      totalPlannedSets += exercise.sets.length;
      exercise.sets.forEach(set => {
        if (set.completed) {
          totalSets++;
          completedSets++;
          totalReps += set.reps || 0;
          totalWeight += (set.weight || 0) * (set.reps || 0);
          
          if ((set.weight || 0) > 50) personalRecords++;
        }
        totalPlannedReps += set.reps || 0;
      });
    });

    const completionRate = totalPlannedSets > 0 ? (completedSets / totalPlannedSets) * 100 : 0;
    const avgWeight = totalSets > 0 ? totalWeight / totalSets : 0;
    const caloriesBurned = Math.round(totalWeight * 0.05 + (totalReps * 2.5));

    return { 
      totalSets, 
      completedSets,
      totalReps, 
      totalWeight, 
      completionRate,
      avgWeight,
      caloriesBurned,
      personalRecords,
      totalPlannedSets,
      totalPlannedReps
    };
  };

  const getWorkoutIntensity = (totals: any, duration: string) => {
    if (duration === t.history.detail.inProgress) return { level: t.history.detail.medium, color: "text-yellow-500", icon: Gauge };
    
    const durationMinutes = parseInt(duration.replace(/[^\d]/g, '')) || 60;
    const intensity = totals.totalWeight / durationMinutes;
    
    if (intensity > 50) return { level: t.history.detail.high, color: "text-red-500", icon: Flame };
    if (intensity > 25) return { level: t.history.detail.medium, color: "text-yellow-500", icon: Gauge };
    return { level: t.history.detail.low, color: "text-green-500", icon: Heart };
  };

  const getMuscleGroups = (session: TrainingSession) => {
    const muscles = new Set<string>();
    session.exercises.forEach(exercise => {
      if ((exercise.exercise as any)?.muscleGroups) {
        ((exercise.exercise as any).muscleGroups as string[]).forEach(muscle => muscles.add(muscle));
      }
    });
    return Array.from(muscles);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.history.detail.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground">{t.history.detail.notFound}</h3>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.history.detail.back}
          </Button>
        </div>
      </div>
    );
  }

  if (!isTrainingCompleted) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6 mb-16 md:mb-0">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.history.detail.back}
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">
              {session.routine?.title || t.training.freeWorkout}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">{formatDate(session.startTime)}</p>
          </div>
        </div>

        {/* Advertencia de entrenamiento no finalizado */}
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="space-y-3 min-w-0 flex-1">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                    {t.history.detail.workoutNotCompleted}
                  </h3>
                  <p className="text-sm md:text-base text-yellow-700 dark:text-yellow-300 mt-1">
                    {t.history.detail.workoutInProgress}
                  </p>
                </div>
                
                <div className="bg-yellow-100/80 dark:bg-yellow-800/30 p-3 md:p-4 rounded-lg">
                  <h4 className="text-sm md:text-base font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    {t.history.detail.whatCanYouDo}
                  </h4>
                  <ul className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• {t.history.detail.continueWorkout}</li>
                    <li>• {t.history.detail.finishSession}</li>
                    <li>• {t.history.detail.incompleteWorkouts}</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm md:text-base" size="sm">
                    <Link href={`/dashboard/training/${sessionId}`}>
                      <Play className="h-4 w-4 mr-2" />
                      {t.history.detail.continueTraining}
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard/history')} size="sm" className="text-sm md:text-base">
                    <History className="h-4 w-4 mr-2" />
                    {t.history.detail.backToHistory}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información básica del entrenamiento */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Dumbbell className="h-4 w-4 md:h-5 md:w-5" />
              {t.history.detail.basicInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-primary" />
                <div className="text-base md:text-lg font-semibold">{t.history.detail.inProgress}</div>
                <p className="text-xs md:text-sm text-muted-foreground">{t.history.detail.duration}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <Dumbbell className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-base md:text-lg font-semibold">{session.exercises.length}</div>
                <p className="text-xs md:text-sm text-muted-foreground">{t.history.detail.exercises}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg sm:col-span-2 lg:col-span-1">
                <Target className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-green-600" />
                <div className="text-base md:text-lg font-semibold">
                  {session.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{t.history.detail.setsCompleted}</p>
              </div>
            </div>
            
            <div className="p-3 md:p-4 bg-muted/30 rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground">
                <strong>{t.history.detail.started}:</strong> {formatTime(session.startTime)} del {formatDate(session.startTime)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = calculateTotals(session);
  const duration = formatDuration(session.startTime, session.endTime);
  const intensity = getWorkoutIntensity(totals, duration);
  const muscleGroups = getMuscleGroups(session);
  const IntensityIcon = intensity.icon;

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 lg:py-10 space-y-4 md:space-y-6 mb-16 md:mb-0">
      {/* Header Mejorado */}
      <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 min-w-0">
          <Button variant="ghost" onClick={() => router.back()} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.history.detail.back}
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground truncate">
              {session.routine?.title || t.training.freeWorkout}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
              <p className="text-sm md:text-base text-muted-foreground">{formatDate(session.startTime)}</p>
              <Badge variant="secondary" className={`text-xs md:text-sm ${intensity.color}`}>
                <IntensityIcon className="h-3 w-3 mr-1" />
                {t.history.detail.intensity} {intensity.level}
              </Badge>
              {session.endTime && (
                <Badge variant="outline" className="text-xs md:text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t.history.detail.completed}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Principal Mejorado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Estadísticas Principales */}
        <div className="lg:col-span-2 order-1">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-foreground">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                {t.history.detail.sessionSummary}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Métricas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-background/50 rounded-lg">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg md:text-2xl font-bold text-foreground">{duration}</div>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.history.detail.duration}</p>
                </div>
                <div className="text-center p-3 md:p-4 bg-background/50 rounded-lg">
                  <Target className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-lg md:text-2xl font-bold text-foreground">{totals.completedSets}</div>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.history.detail.setsCompleted}</p>
                </div>
                <div className="text-center p-3 md:p-4 bg-background/50 rounded-lg">
                  <Activity className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg md:text-2xl font-bold text-foreground">{totals.totalReps}</div>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.history.detail.totalReps}</p>
                </div>
                <div className="text-center p-3 md:p-4 bg-background/50 rounded-lg">
                  <Dumbbell className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-lg md:text-2xl font-bold text-foreground">{Math.round(totals.totalWeight)}kg</div>
                  <p className="text-xs md:text-sm text-muted-foreground">{t.history.detail.totalVolume}</p>
                </div>
              </div>

              {/* Progreso de completitud */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base font-medium text-foreground">{t.history.detail.sessionProgress}</span>
                  <span className="text-sm text-muted-foreground">
                    {t.history.detail.setsCompletedOf.replace('{completed}', totals.completedSets.toString()).replace('{total}', totals.totalPlannedSets.toString())}
                  </span>
                </div>
                <Progress value={totals.completionRate} className="h-2 md:h-3" />
                <p className="text-sm text-muted-foreground">
                  {t.history.detail.setsCompletedPercentage.replace('{percentage}', Math.round(totals.completionRate).toString())}
                </p>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <div className="text-xs md:text-sm min-w-0">
                    <span className="text-foreground font-medium">{t.history.detail.schedule} </span>
                    <span className="text-muted-foreground">
                      {formatTime(session.startTime)}
                      {session.endTime && ` - ${formatTime(session.endTime)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <div className="text-xs md:text-sm">
                    <span className="text-foreground font-medium">{t.history.detail.exercises}: </span>
                    <span className="text-muted-foreground">{session.exercises.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <div className="text-xs md:text-sm">
                    <span className="text-foreground font-medium">{t.history.detail.averageWeight} </span>
                    <span className="text-muted-foreground">{Math.round(totals.avgWeight)}kg</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral con estadísticas adicionales */}
        <div className="space-y-4 order-2 lg:order-3">
          {/* Logros y destacados */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {t.history.detail.achievements}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-foreground">{t.history.detail.caloriesBurned}</span>
                </div>
                <span className="font-bold text-orange-500">{totals.caloriesBurned}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-foreground">{t.history.detail.personalRecords}</span>
                </div>
                <span className="font-bold text-purple-500">{totals.personalRecords}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <IntensityIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-foreground">{t.history.detail.intensity}</span>
                </div>
                <span className={`font-bold ${intensity.color}`}>{intensity.level}</span>
              </div>
            </CardContent>
          </Card>

          {/* Grupos musculares trabajados */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5" />
                {t.history.detail.muscleGroups}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {muscleGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {muscleGroups.map((muscle, index) => (
                    <Badge key={`muscle-${index}`} variant="secondary" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.history.detail.muscleGroupsEmpty}</p>
              )}
            </CardContent>
          </Card>

          {/* Calificación de la sesión */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Star className="h-5 w-5 text-yellow-500" />
                {t.history.detail.rating}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  {getRatingStars((session as any).rating || 4)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.history.detail.stars.replace('{rating}', ((session as any).rating || 4).toString())}
                </p>
                {(session as any).notes && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                    <strong className="text-foreground">{t.history.detail.notes}</strong>
                    <p className="text-muted-foreground mt-1">{(session as any).notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ejercicios detallados - mantengo la estructura existente pero mejorada */}
      <div className="space-y-4 order-3 lg:order-2 lg:col-span-3">
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2 text-foreground">
          <Dumbbell className="h-4 w-4 md:h-5 md:w-5" />
          {t.history.detail.exercisesPerformed.replace('{count}', session.exercises.length.toString())}
        </h2>

        {session.exercises.map((exercise, exerciseIndex) => {
          const completedSets = exercise.sets.filter(set => set.completed)
          const exerciseWeight = completedSets.reduce((acc, set) => acc + ((set.weight || 0) * (set.reps || 0)), 0)
          const maxWeight = Math.max(...completedSets.map(set => set.weight || 0))
          const completionPercentage = (completedSets.length / exercise.sets.length) * 100
          
          return (
            <Card key={`${session.id}-exercise-${exercise.exerciseId || exerciseIndex}`} className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 md:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-base md:text-lg text-foreground">
                    {exercise.exercise?.title || t.history.detail.exercise.replace('{number}', (exerciseIndex + 1).toString())}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {exercise.sets.length} {t.history.detail.sets}
                    </Badge>
                    <Badge 
                      variant={completionPercentage === 100 ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {t.history.detail.completedPercentage.replace('{percentage}', Math.round(completionPercentage).toString())}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {completedSets.length} {t.history.detail.sets} {t.common.completed} {t.common.of} {exercise.sets.length} {t.common.planned}
                  </p>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exercise.sets.map((set, setIndex) => (
                    <div 
                      key={set.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        set.completed 
                          ? 'bg-green-500/10 border-green-500/30 dark:bg-green-950/20 dark:border-green-800/30' 
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {set.completed ? (
                            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <div className="h-3 w-3 md:h-4 md:w-4 border border-muted-foreground rounded-full" />
                          )}
                          <span className="text-sm md:text-base font-medium text-foreground">{t.common.sets} {setIndex + 1}</span>
                        </div>
                        <div className="text-xs md:text-sm text-foreground">
                          <span className="font-medium">{set.reps}</span> reps × <span className="font-medium">{set.weight}</span>kg
                        </div>
                      </div>
                      <div className="flex items-center text-xs md:text-sm">
                        {set.completed && (
                          <div className="text-green-600 dark:text-green-400 font-medium">
                            {(set.weight || 0) * (set.reps || 0)}kg {t.history.detail.volumeTotal.toLowerCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Estadísticas del ejercicio mejoradas */}
                {completedSets.length > 0 && (
                  <div className="mt-4 p-3 md:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="text-sm md:text-base font-medium text-foreground mb-3 flex items-center gap-2">
                      <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                      {t.history.detail.exerciseStats}
                    </h4>
                    <div className="grid grid-cols-3 gap-3 md:gap-4 text-center">
                      <div>
                        <div className="text-base md:text-lg font-bold text-foreground">
                          {completedSets.reduce((acc, set) => acc + (set.reps || 0), 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.history.detail.totalRepsExercise}</div>
                      </div>
                      <div>
                        <div className="text-base md:text-lg font-bold text-foreground">{maxWeight}kg</div>
                        <div className="text-xs text-muted-foreground">{t.history.detail.maxWeight}</div>
                      </div>
                      <div>
                        <div className="text-base md:text-lg font-bold text-foreground">{Math.round(exerciseWeight)}kg</div>
                        <div className="text-xs text-muted-foreground">{t.history.detail.volumeTotal}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Acciones finales mejoradas */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 order-4">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <History className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <div>
                <h4 className="text-sm md:text-base font-medium text-foreground">{t.history.detail.excellentWorkout}</h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t.history.detail.repeatOrExplore}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {session.routineId && (
                <Button asChild size="sm" className="text-xs md:text-sm">
                  <Link href={`/dashboard/routines/${session.routineId}`}>
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    {t.history.detail.viewOriginalRoutine}
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild size="sm" className="text-xs md:text-sm">
                <Link href="/dashboard/training/start">
                  <Dumbbell className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  {t.history.detail.trainAgain}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
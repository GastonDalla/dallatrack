"use client"

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  PlayCircle,
  Clock,
  Dumbbell,
  Target,
  TrendingUp,
  Calendar,
  Plus,
  Filter,
  Loader2,
  Star,
  User,
  History
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Routine, TrainingSession } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useTranslations, useLanguage } from '@/contexts/LanguageContext'

interface QuickStartOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export function TrainingStartPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>("all");

  const { data: allRoutines = [], isLoading, error } = useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const data = await ofetch<{ routines: Routine[] }>('/api/routines')
      return data.routines
    },
  })

  const routines = useMemo(() => {
    let filtered = allRoutines;

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(routine => 
        routine.title.toLowerCase().includes(searchLower) ||
        routine.description?.toLowerCase().includes(searchLower) ||
        routine.targetMuscleGroups?.some((muscle: string) => 
          muscle.toLowerCase().includes(searchLower)
        )
      );
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(routine => routine.difficulty === difficultyFilter);
    }

    if (muscleGroupFilter !== 'all') {
      filtered = filtered.filter(routine => 
        routine.targetMuscleGroups?.some((muscle: string) => 
          muscle.toLowerCase() === muscleGroupFilter.toLowerCase()
        )
      );
    }

    return filtered;
  }, [allRoutines, searchQuery, difficultyFilter, muscleGroupFilter])

  const calculateEstimatedDuration = (routine: Routine): number => {
    if (!routine.exercises || routine.exercises.length === 0) return 30; 
  
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

  const createSessionMutation = useMutation({
    mutationFn: async ({ routineId, routine }: { routineId: string, routine: Routine }) => {
      const sessionData = {
        routineId,
        exercises: routine.exercises.map(routineExercise => {
          let setsCount = 3; 
          let targetReps = 10; 
          let targetWeight = 0; 
          
          if (Array.isArray(routineExercise.sets) && routineExercise.sets.length > 0) {
            setsCount = routineExercise.sets.length;
            const firstTargetReps = routineExercise.sets[0]?.targetReps;
            targetReps = typeof firstTargetReps === 'string' ? parseInt(firstTargetReps) || 10 : firstTargetReps || 10;
            targetWeight = routineExercise.sets[0]?.targetWeight || 0;
          } else if ((routineExercise as any).setsData && Array.isArray((routineExercise as any).setsData) && (routineExercise as any).setsData.length > 0) {
            setsCount = (routineExercise as any).setsData.length;
            const firstTargetReps = (routineExercise as any).setsData[0]?.targetReps;
            targetReps = typeof firstTargetReps === 'string' ? parseInt(firstTargetReps) || 10 : firstTargetReps || 10;
            targetWeight = (routineExercise as any).setsData[0]?.targetWeight || 0;
          } else if (typeof routineExercise.sets === 'number') {
            setsCount = routineExercise.sets;
            targetReps = parseInt((routineExercise as any).reps) || 10;
            targetWeight = parseFloat((routineExercise as any).weight) || 0;
          }
          
          return {
            exerciseId: routineExercise.exerciseId,
            exerciseName: routineExercise.exercise?.title || '',
            targetSets: setsCount,
            targetReps: targetReps.toString(),
            targetWeight: targetWeight,
            restTime: (routineExercise as any).restTime || 90,
            notes: (routineExercise as any).notes || '',
            muscleGroups: (routineExercise.exercise as any)?.muscleGroups || []
          }
        })
      }
      
      const response = await ofetch<{ session: TrainingSession }>('/api/training-sessions', {
        method: 'POST',
        body: sessionData
      })
      return response.session
    },
    onSuccess: (session) => {
      router.push(`/dashboard/training/${session.id}`)
    },
    onError: (error: any) => {
      toast({
        title: t.common.error,
        description: error?.data?.error || t.training.problemStartingSession,
        variant: "destructive"
      })
    }
  })

  const startWorkout = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId)
    if (!routine) {
      toast({
        title: t.common.error,
        description: t.training.routineNotFound,
        variant: "destructive"
      })
      return
    }
    
    if (routine.exercises.length === 0) {
      toast({
        title: t.common.error,
        description: t.training.routineNoExercises,
        variant: "destructive"
      })
      return
    }

    createSessionMutation.mutate({ routineId, routine })
  };

  const startEmptyWorkout = () => {
    router.push(`/dashboard/training/new`);
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

  const formatLastPerformed = (dateString?: string) => {
    if (!dateString) return t.training.never;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime(); 
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0 || diffMinutes < 1) return t.common.justNow;
    if (diffMinutes < 60) {
      return language === 'es' 
        ? `${t.common.ago} ${diffMinutes} min` 
        : `${diffMinutes} min ${t.common.ago}`;
    }
    if (diffHours < 24) {
      return language === 'es' 
        ? `${t.common.ago} ${diffHours}h` 
        : `${diffHours}h ${t.common.ago}`;
    }
    if (diffDays === 1) return t.training.yesterday;
    if (diffDays < 7) {
      return language === 'es' 
        ? `${t.common.ago} ${diffDays} ${t.common.days}` 
        : `${diffDays} ${t.common.days} ${t.common.ago}`;
    }
    if (diffDays < 30) {
      const weeks = Math.ceil(diffDays / 7);
      return language === 'es' 
        ? `${t.common.ago} ${weeks} ${t.common.weeks}` 
        : `${weeks} ${t.common.weeks} ${t.common.ago}`;
    }
    const months = Math.ceil(diffDays / 30);
    return language === 'es' 
      ? `${t.common.ago} ${months} ${t.common.months}` 
      : `${months} ${t.common.months} ${t.common.ago}`;
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const allMuscleGroups = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", 
    "Piernas", "Cuádriceps", "Isquiotibiales", "Glúteos", "Pantorrillas",
    "Abdominales", "Core"
  ];

  const quickStartOptions: QuickStartOption[] = [
    {
      id: "empty",
      title: t.training.startEmptyWorkout,
      description: t.training.emptyWorkoutDescription,
      icon: <Plus className="h-8 w-8" />,
      action: startEmptyWorkout
    },
    {
      id: "last",
      title: t.training.lastRoutine,
      description: t.training.lastRoutineDescription,
      icon: <History className="h-8 w-8" />,
      action: () => {
        const lastRoutine = routines
          .filter(r => r.lastPerformed)
          .sort((a, b) => new Date(b.lastPerformed!).getTime() - new Date(a.lastPerformed!).getTime())[0];
        if (lastRoutine) {
          startWorkout(lastRoutine.id);
        }
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t.training.loadingRoutines}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t.training.failedToLoad}</h1>
          <p className="text-muted-foreground mb-4">{t.training.problemLoadingRoutines}</p>
          <Button onClick={() => window.location.reload()}>
            {t.common.retry}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl mb-16 md:mb-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.training.startTraining}</h1>
        <p className="text-muted-foreground">
          {t.training.chooseRoutineDescription}
        </p>
      </div>

      {/* Quick Start Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {quickStartOptions.map((option) => (
          <Card key={option.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={option.action}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <PlayCircle className="h-6 w-6 ml-auto text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t.training.searchRoutines}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t.training.difficulty} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.training.allDifficulties}</SelectItem>
                <SelectItem value="principiante">{t.training.beginner}</SelectItem>
                <SelectItem value="intermedio">{t.training.intermediate}</SelectItem>
                <SelectItem value="avanzado">{t.training.advanced}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t.training.muscleGroup} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.training.allMuscleGroups}</SelectItem>
                {allMuscleGroups.map(group => (
                  <SelectItem key={group} value={group.toLowerCase()}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Routines Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {t.training.myRoutines} ({routines.length})
          </h2>
          <Button variant="outline" asChild>
            <Link href="/dashboard/routines/create">
              <Plus className="h-4 w-4 mr-2" />
              {t.routines.createRoutine}
            </Link>
          </Button>
        </div>

        {routines.length === 0 ? (
          <Card className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.training.noRoutines}</p>
              <p className="text-sm">{t.routines.createFirstRoutine}</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/routines/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.routines.createRoutine}
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routines.map((routine) => (
              <Card key={routine.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{routine.title}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {routine.description}
                      </p>
                    </div>
                    {routine.difficulty && (
                      <Badge className={getDifficultyColor(routine.difficulty)}>
                        {getDifficultyLabel(routine.difficulty)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{calculateEstimatedDuration(routine)}{t.common.min}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span>{routine.exercises.length} {t.training.exercises}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{routine.timesPerformed || 0} {t.common.times}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatLastPerformed(routine.lastPerformed)}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  {routine.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex">{getRatingStars(routine.rating)}</div>
                      <span className="text-sm text-muted-foreground">
                        {routine.rating}/5
                      </span>
                    </div>
                  )}

                  {/* Muscle Groups */}
                  {routine.targetMuscleGroups && routine.targetMuscleGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {routine.targetMuscleGroups.slice(0, 3).map((group) => (
                        <Badge key={group} variant="secondary" className="text-xs">
                          {group}
                        </Badge>
                      ))}
                      {routine.targetMuscleGroups.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{routine.targetMuscleGroups.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => startWorkout(routine.id)}
                      disabled={createSessionMutation.isPending}
                      className="flex-1"
                    >
                      {createSessionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.training.startingSession}
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {t.common.start}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/dashboard/routines/${routine.id}`}>
                        <Target className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {routines.some(r => r.lastPerformed) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.training.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routines
                .filter(r => r.lastPerformed)
                .sort((a, b) => new Date(b.lastPerformed!).getTime() - new Date(a.lastPerformed!).getTime())
                .slice(0, 3)
                .map((routine) => (
                  <div key={routine.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{routine.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatLastPerformed(routine.lastPerformed)} • {calculateEstimatedDuration(routine)}{t.common.min}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={createSessionMutation.isPending}
                      onClick={() => startWorkout(routine.id)}
                    >
                      {createSessionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.training.startingSession}
                        </>
                      ) : (
                        t.training.repeatWorkout
                      )}
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
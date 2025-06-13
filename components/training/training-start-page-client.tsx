"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from '@tanstack/react-query'
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

interface QuickStartOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export function TrainingStartPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>("all");

  const { data: routines = [], isLoading, error } = useQuery({
    queryKey: ['routines', searchQuery, difficultyFilter, muscleGroupFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter)
      if (muscleGroupFilter !== 'all') params.append('muscleGroup', muscleGroupFilter)
      
      const data = await ofetch<{ routines: Routine[] }>(`/api/routines?${params.toString()}`)
      return data.routines
    },
  })

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
        title: "Error",
        description: error?.data?.error || "No se pudo iniciar la sesión de entrenamiento.",
        variant: "destructive"
      })
    }
  })

  const startWorkout = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId)
    if (!routine) {
      toast({
        title: "Error",
        description: "Rutina no encontrada.",
        variant: "destructive"
      })
      return
    }
    
    if (routine.exercises.length === 0) {
      toast({
        title: "Error",
        description: "La rutina no tiene ejercicios.",
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
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return difficulty;
    }
  };

  const formatLastPerformed = (dateString?: string) => {
    if (!dateString) return "Nunca";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime(); 
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0 || diffMinutes < 1) return "Hace un momento";
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return `Hace ${Math.ceil(diffDays / 30)} meses`;
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
      title: "Entrenamiento Libre",
      description: "Comienza un entrenamiento sin rutina predefinida",
      icon: <Plus className="h-8 w-8" />,
      action: startEmptyWorkout
    },
    {
      id: "last",
      title: "Última Rutina",
      description: "Continúa con tu rutina más reciente",
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
            <p className="text-muted-foreground">Cargando rutinas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error al cargar rutinas</h1>
          <p className="text-muted-foreground mb-4">Hubo un problema cargando tus rutinas.</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl mb-16 md:mb-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Comenzar Entrenamiento</h1>
        <p className="text-muted-foreground">
          Elige una rutina para comenzar tu sesión de entrenamiento
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
                  placeholder="Buscar rutinas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Dificultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las dificultades</SelectItem>
                <SelectItem value="beginner">Principiante</SelectItem>
                <SelectItem value="intermediate">Intermedio</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Grupo muscular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
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
            Rutinas Disponibles ({routines.length})
          </h2>
          <Button variant="outline" asChild>
            <Link href="/dashboard/routines/create">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Rutina
            </Link>
          </Button>
        </div>

        {routines.length === 0 ? (
          <Card className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes rutinas creadas</p>
              <p className="text-sm">Crea tu primera rutina para comenzar a entrenar</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/routines/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Rutina
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
                      <span>{calculateEstimatedDuration(routine)}min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span>{routine.exercises.length} ejercicios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{routine.timesPerformed || 0} veces</span>
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
                          Iniciando...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Comenzar
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
              Actividad Reciente
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
                          {formatLastPerformed(routine.lastPerformed)} • {calculateEstimatedDuration(routine)}min
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
                          Iniciando...
                        </>
                      ) : (
                        "Repetir"
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
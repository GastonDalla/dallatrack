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
  Target,
  Clock,
  BarChart3,
  Loader2,
  Copy,
  Trash2,
  Star,
  TrendingUp,
  History,
  Youtube,
  User,
  Calendar,
  Zap,
  Heart,
  Users
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

interface Exercise {
  id: string;
  title: string;
  description?: string;
  youtubeLink?: string;
  defaultSets: number;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  instructions?: string[];
  tips?: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface Props {
  exerciseId: string;
}

export function ExerciseDetailPageClient({ exerciseId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: exercise, isLoading, error } = useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: async () => {
      const data = await ofetch<{ exercise: Exercise }>(`/api/exercises/${exerciseId}`)
      return data.exercise
    },
    enabled: !!exerciseId,
  })

  const { data: usageStats } = useQuery({
    queryKey: ['exercise-usage', exerciseId],
    queryFn: async () => {
      try {
        const data = await ofetch<{ 
          usageCount: number;
          lastUsed?: string;
          totalSets: number;
          totalReps: number;
          averageWeight: number;
          bestSet?: { weight: number; reps: number; date: string };
        }>(`/api/exercises/${exerciseId}/usage`)
        return data
      } catch (error) {
        return {
          usageCount: 0,
          totalSets: 0,
          totalReps: 0,
          averageWeight: 0
        }
      }
    },
    enabled: !!exerciseId,
  })

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const response = await ofetch<{ exercise: Exercise }>(`/api/exercises/${exerciseId}/duplicate`, {
        method: 'POST'
      })
      return response.exercise
    },
    onSuccess: (newExercise) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      toast({
        title: "Ejercicio duplicado",
        description: "Se ha creado una copia de tu ejercicio.",
      })
      router.push(`/dashboard/exercises/${newExercise.id}`)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "No se pudo duplicar el ejercicio.",
        variant: "destructive"
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await ofetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      toast({
        title: "Ejercicio eliminado",
        description: "El ejercicio se ha eliminado correctamente.",
      })
      router.push('/dashboard/exercises')
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "No se pudo eliminar el ejercicio.",
        variant: "destructive"
      })
    }
  })

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el ejercicio.",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return "Nunca usado";
    
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante': return 'bg-green-500';
      case 'intermedio': return 'bg-yellow-500';
      case 'avanzado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const duplicateExercise = () => {
    duplicateMutation.mutate()
  };

  const deleteExercise = () => {
    deleteMutation.mutate()
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando ejercicio...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-foreground">Ejercicio no encontrado</h3>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 mb-16 md:mb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{exercise.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge 
                variant="secondary" 
                className={`text-white ${getDifficultyColor(exercise.difficulty)}`}
              >
                {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {exercise.defaultSets} sets por defecto
              </span>
              {exercise.youtubeLink && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    <Youtube className="h-3 w-3 mr-1" />
                    Video disponible
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Description */}
      {exercise.description && (
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-4">
            <p className="text-muted-foreground">{exercise.description}</p>
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
                Estadísticas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{usageStats?.usageCount || 0}</div>
                  <p className="text-sm text-muted-foreground">Veces usado</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{usageStats?.totalSets || 0}</div>
                  <p className="text-sm text-muted-foreground">Sets totales</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{usageStats?.totalReps || 0}</div>
                  <p className="text-sm text-muted-foreground">Reps totales</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{Math.round(usageStats?.averageWeight || 0)}kg</div>
                  <p className="text-sm text-muted-foreground">Peso promedio</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Último uso</p>
                    <p className="font-medium text-foreground">{formatLastUsed(usageStats?.lastUsed)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creado</p>
                    <p className="font-medium text-foreground">{formatDate(exercise.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mejor set</p>
                    <p className="font-medium text-foreground">
                      {usageStats?.bestSet 
                        ? `${usageStats.bestSet.weight}kg × ${usageStats.bestSet.reps}`
                        : "Sin datos"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Target className="h-5 w-5" />
                  Instrucciones de Ejecución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={`instruction-${index}`} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-foreground">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Zap className="h-5 w-5" />
                  Consejos y Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {exercise.tips.map((tip, index) => (
                    <li key={`tip-${index}`} className="flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Video */}
          {exercise.youtubeLink && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Youtube className="h-5 w-5 text-red-600" />
                  Video Tutorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Button asChild>
                    <a href={exercise.youtubeLink} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="h-6 w-6 mr-2" />
                      Ver en YouTube
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link href={`/dashboard/exercises/${exerciseId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Ejercicio
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={duplicateExercise}
                disabled={duplicateMutation.isPending}
              >
                {duplicateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Duplicando...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar Ejercicio
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/history?exerciseId=${exerciseId}`}>
                  <History className="h-4 w-4 mr-2" />
                  Ver Historial
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Muscle Groups */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5" />
                Grupos Musculares
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exercise.muscleGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {exercise.muscleGroups.map((muscle, index) => (
                    <Badge key={`muscle-${index}`} variant="secondary" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay grupos musculares especificados</p>
              )}
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Dumbbell className="h-5 w-5" />
                Equipamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exercise.equipment.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {exercise.equipment.map((item, index) => (
                    <Badge key={`equipment-${index}`} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay equipamiento especificado</p>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
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
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar Ejercicio
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Esta acción no se puede deshacer. Esto eliminará permanentemente el ejercicio
                      y todos los datos asociados con él.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteExercise} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Eliminar
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
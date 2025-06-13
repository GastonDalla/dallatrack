"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Trash2,
  Copy,
  Play,
  Target,
  Dumbbell,
  Youtube
} from 'lucide-react'
import Link from 'next/link'
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'

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

const muscleGroupOptions = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Antebrazos',
  'Abdominales',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Pantorrillas',
  'Trapecio'
];

const equipmentOptions = [
  'Peso corporal',
  'Mancuernas',
  'Barra olímpica',
  'Máquinas',
  'Bandas elásticas',
  'Kettlebells',
  'Poleas',
  'Banco',
  'Rack de sentadillas',
  'Barras paralelas',
  'Balón medicinal',
  'TRX'
];

export function ExerciseEditPageClient({ exerciseId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const exerciseSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().optional(),
    youtubeLink: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    defaultSets: z.coerce.number().int().min(1, "Debe tener al menos 1 set"),
    difficulty: z.enum(["principiante", "intermedio", "avanzado"]),
    instructions: z.string().optional(),
    tips: z.string().optional()
  });

  type ExerciseFormValues = z.infer<typeof exerciseSchema>;

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeLink: "",
      defaultSets: 1,
      difficulty: "principiante",
      instructions: "",
      tips: ""
    }
  });

  const { data: exercise, isLoading, error } = useQuery({
    queryKey: ['exercise', exerciseId],
    queryFn: async () => {
      const data = await ofetch<{ exercise: Exercise }>(`/api/exercises/${exerciseId}`)
      return data.exercise
    },
    enabled: !!exerciseId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExerciseFormValues) => {
      const updateData = {
        ...data,
        muscleGroups: selectedMuscleGroups,
        equipment: selectedEquipment,
        instructions: data.instructions ? data.instructions.split('\n').filter(line => line.trim()) : [],
        tips: data.tips ? data.tips.split('\n').filter(line => line.trim()) : [],
      };
      
      const response = await ofetch<{ exercise: Exercise }>(`/api/exercises/${exerciseId}`, {
        method: 'PUT',
        body: updateData,
      });
      return response.exercise;
    },
    onSuccess: (updatedExercise) => {
      queryClient.setQueryData(['exercise', exerciseId], updatedExercise);
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Ejercicio actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
      router.push(`/dashboard/exercises/${exerciseId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "Hubo un problema actualizando el ejercicio.",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await ofetch(`/api/exercises/${exerciseId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.removeQueries({ queryKey: ['exercise', exerciseId] });
      toast({
        title: "Ejercicio eliminado",
        description: "El ejercicio ha sido eliminado correctamente.",
      });
      router.push('/dashboard/exercises');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "No se pudo eliminar el ejercicio.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (exercise) {
      form.reset({
        title: exercise.title || "",
        description: exercise.description || "",
        youtubeLink: exercise.youtubeLink || "",
        defaultSets: exercise.defaultSets || 1,
        difficulty: exercise.difficulty || "principiante",
        instructions: (exercise.instructions && exercise.instructions.length > 0) ? exercise.instructions.join('\n') : "",
        tips: (exercise.tips && exercise.tips.length > 0) ? exercise.tips.join('\n') : ""
      });
      setSelectedMuscleGroups(exercise.muscleGroups || []);
      setSelectedEquipment(exercise.equipment || []);
    }
  }, [exercise, form]);

  const onSubmit = async (data: ExerciseFormValues) => {
    updateMutation.mutate(data);
  };

  const handleMuscleGroupChange = (muscleGroup: string, checked: boolean) => {
    setSelectedMuscleGroups(prev => 
      checked 
        ? [...prev, muscleGroup]
        : prev.filter(mg => mg !== muscleGroup)
    );
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setSelectedEquipment(prev => 
      checked 
        ? [...prev, equipment]
        : prev.filter(eq => eq !== equipment)
    );
  };

  const duplicateExercise = async () => {
    if (!exercise) return;
    
    const duplicateData = {
      title: `${exercise.title} (Copia)`,
      description: exercise.description,
      youtubeLink: exercise.youtubeLink,
      defaultSets: exercise.defaultSets,
      muscleGroups: exercise.muscleGroups,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      instructions: exercise.instructions,
      tips: exercise.tips,
    };

    try {
      await ofetch('/api/exercises', {
        method: 'POST',
        body: duplicateData,
      });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: "Ejercicio duplicado",
        description: "Se ha creado una copia del ejercicio.",
      });
      router.push('/dashboard/exercises');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "No se pudo duplicar el ejercicio.",
        variant: "destructive"
      });
    }
  };

  const deleteExercise = async () => {
    deleteMutation.mutate();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante': return 'bg-green-100 text-green-800';
      case 'intermedio': return 'bg-yellow-100 text-yellow-800';
      case 'avanzado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (error) {
    toast({
      title: "Error",
      description: "No se pudo cargar el ejercicio.",
      variant: "destructive"
    });
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse space-y-6 w-full max-w-4xl">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Ejercicio no encontrado</h3>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/exercises">Volver a ejercicios</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 mb-16 md:mb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" asChild>
            <Link href="/dashboard/exercises">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              Editar Ejercicio
            </h1>
            <p className="text-muted-foreground">{exercise.title}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={duplicateExercise}>
            <Copy className="h-4 w-4 mr-1" />
            Duplicar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/5">
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El ejercicio será eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={deleteExercise}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="ej., Press de Banca" {...field} />
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
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe el ejercicio..." 
                            className="resize-none h-20" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="defaultSets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sets por Defecto *</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
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
                          <FormLabel>Dificultad *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona dificultad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="principiante">Principiante</SelectItem>
                              <SelectItem value="intermedio">Intermedio</SelectItem>
                              <SelectItem value="avanzado">Avanzado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="youtubeLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Youtube className="h-4 w-4 text-red-600" />
                          Enlace de YouTube
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.youtube.com/watch?v=..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Muscle Groups */}
                  <div>
                    <FormLabel className="text-sm font-medium">Grupos Musculares</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {muscleGroupOptions.map((muscleGroup) => (
                        <div key={muscleGroup} className="flex items-center space-x-2">
                          <Checkbox
                            id={muscleGroup}
                            checked={selectedMuscleGroups.includes(muscleGroup)}
                            onCheckedChange={(checked) => 
                              handleMuscleGroupChange(muscleGroup, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={muscleGroup}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {muscleGroup}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <FormLabel className="text-sm font-medium">Equipamiento</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {equipmentOptions.map((equipment) => (
                        <div key={equipment} className="flex items-center space-x-2">
                          <Checkbox
                            id={equipment}
                            checked={selectedEquipment.includes(equipment)}
                            onCheckedChange={(checked) => 
                              handleEquipmentChange(equipment, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={equipment}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {equipment}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrucciones</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Una instrucción por línea..." 
                            className="resize-none h-32" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consejos</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Un consejo por línea..." 
                            className="resize-none h-32" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    <Save className="h-4 w-4 mr-1" />
                    Guardar Cambios
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Exercise Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dificultad</span>
                <Badge className={getDifficultyColor(exercise.difficulty)}>
                  {exercise.difficulty}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uso</span>
                <div className="flex items-center gap-1 text-sm">
                  <Target className="h-3 w-3" />
                  {exercise.usageCount} veces
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Creado</span>
                <span className="text-sm">{formatDate(exercise.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actualizado</span>
                <span className="text-sm">{formatDate(exercise.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercise.youtubeLink && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={exercise.youtubeLink} target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4 mr-1" />
                    Ver Video
                  </a>
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/dashboard/exercises/${exercise.id}`}>
                  <Target className="h-4 w-4 mr-1" />
                  Ver Detalles
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
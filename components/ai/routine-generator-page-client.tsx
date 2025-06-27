"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { $fetch } from "ofetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Dumbbell, 
  Clock, 
  Target, 
  Users, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Share2,
  Save,
  BookOpen,
  ArrowRight,
  Brain,
  Zap,
  TrendingUp,
  PlayCircle,
  Star,
  Calendar,
  Timer
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from "@/contexts/LanguageContext";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  muscleGroups: string[];
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
}

interface GeneratedRoutine {
  name: string;
  description: string;
  duration: string;
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  goals: string[];
  exercises: Exercise[];
  warmup: string[];
  cooldown: string[];
  tips: string[];
  frequency: string;
}

interface FormData {
  goal: string[];
  customGoals: string[];
  currentCustomGoal: string;
  experience: string;
  timeAvailable: string;
  customTime: string;
  equipment: string[];
  customEquipment: string[];
  currentCustomEquipment: string;
  muscleGroups: string[];
  customMuscleGroups: string[];
  currentCustomMuscleGroup: string;
  limitations: string;
  preferences: string;
}

interface APIFormData {
  goal: string;
  experience: string;
  timeAvailable: string;
  equipment: string[];
  muscleGroups: string[];
  limitations: string;
  preferences: string;
}

export function RoutineGeneratorPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    goal: [],
    customGoals: [],
    currentCustomGoal: '',
    experience: '',
    timeAvailable: '',
    customTime: '',
    equipment: [] as string[],
    customEquipment: [] as string[],
    currentCustomEquipment: '',
    muscleGroups: [] as string[],
    customMuscleGroups: [] as string[],
    currentCustomMuscleGroup: '',
    limitations: '',
    preferences: ''
  });
  
  const [generatedRoutine, setGeneratedRoutine] = useState<GeneratedRoutine | null>(null);
  const [savedRoutineId, setSavedRoutineId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const goalOptions = [
    t.routineGenerator.weightLoss,
    t.routineGenerator.muscleGain,
    t.routineGenerator.generalStrength,
    t.routineGenerator.endurance,
    t.routineGenerator.toning,
    t.routineGenerator.rehabilitation,
    t.routineGenerator.sportsPerformance,
    t.routineGenerator.maintenance
  ];

  const equipmentOptions = [
    t.routineGenerator.dumbbells,
    t.routineGenerator.barbell,
    t.routineGenerator.gymMachines,
    t.routineGenerator.resistanceBands,
    t.routineGenerator.bodyweight,
    t.routineGenerator.kettlebells,
    t.routineGenerator.cables,
    t.routineGenerator.bench,
    t.routineGenerator.squat_rack,
    t.routineGenerator.parallelBars
  ];

  const muscleGroupOptions = [
    t.routineGenerator.chest,
    t.routineGenerator.back,
    t.routineGenerator.shoulders,
    t.routineGenerator.biceps,
    t.routineGenerator.triceps,
    t.routineGenerator.legs,
    t.routineGenerator.glutes,
    t.routineGenerator.abs,
    t.routineGenerator.calves,
    t.routineGenerator.forearms
  ];

  const generateRoutineMutation = useMutation({
    mutationFn: async (formData: APIFormData) => {
      const response = await $fetch<GeneratedRoutine>('/api/ai/generate-routine', {
        method: 'POST',
        body: formData,
      });
      return response;
    },
    onSuccess: (routine) => {
      setGeneratedRoutine(routine);
      setError('');
      setSavedRoutineId(null);
      setCurrentStep(4);
      toast({
        title: "Éxito",
        description: '¡Rutina generada exitosamente!'
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || 'Error al generar la rutina. Inténtalo de nuevo.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      console.error(error);
    }
  });
  
  const saveRoutineMutation = useMutation({
    mutationFn: async (routine: GeneratedRoutine) => {
      console.log('🚀 Iniciando guardado de rutina:', routine.name);
      console.log('📦 Datos de rutina a enviar:', JSON.stringify(routine, null, 2));
      
      const response = await $fetch<{ routineId: string; message: string }>('/api/ai/save-routine', {
        method: 'POST',
        body: { routine },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Respuesta del servidor:', response);
      return response;
    },
    onSuccess: (result) => {
      console.log('🎉 Rutina guardada exitosamente:', result);
      setSavedRoutineId(result.routineId);
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setError('');
      toast({
        title: "Éxito",
        description: `¡Rutina guardada exitosamente! ID: ${result.routineId}`
      });
    },
    onError: (error: any) => {
      console.error('💥 Error al guardar rutina:', error);
      console.error('📄 Detalles del error:', {
        message: error?.message,
        data: error?.data,
        status: error?.status,
        statusText: error?.statusText
      });
      
      let errorMessage = 'Error al guardar la rutina. Inténtalo de nuevo.';
      
      if (error?.data?.error) {
        errorMessage = error.data.error;
        if (error.data.details) {
          errorMessage += ` (${error.data.details})`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      equipment: checked 
        ? [...prev.equipment, equipment]
        : prev.equipment.filter(e => e !== equipment)
    }));
  };

  const handleMuscleGroupChange = (muscleGroup: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: checked 
        ? [...prev.muscleGroups, muscleGroup]
        : prev.muscleGroups.filter(m => m !== muscleGroup)
    }));
  };

  const addCustomGoal = () => {
    const goal = formData.currentCustomGoal.trim();
    if (goal && !formData.customGoals.includes(goal)) {
      setFormData(prev => ({
        ...prev,
        customGoals: [...prev.customGoals, goal],
        currentCustomGoal: ''
      }));
    }
  };

  const removeCustomGoal = (goalToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      customGoals: prev.customGoals.filter(goal => goal !== goalToRemove)
    }));
  };

  const handleCustomGoalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomGoal();
    }
  };

  const addCustomEquipment = () => {
    const equipment = formData.currentCustomEquipment.trim();
    if (equipment && !formData.customEquipment.includes(equipment)) {
      setFormData(prev => ({
        ...prev,
        customEquipment: [...prev.customEquipment, equipment],
        currentCustomEquipment: ''
      }));
    }
  };

  const removeCustomEquipment = (equipmentToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      customEquipment: prev.customEquipment.filter(equipment => equipment !== equipmentToRemove)
    }));
  };

  const handleCustomEquipmentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomEquipment();
    }
  };

  const addCustomMuscleGroup = () => {
    const muscleGroup = formData.currentCustomMuscleGroup.trim();
    if (muscleGroup && !formData.customMuscleGroups.includes(muscleGroup)) {
      setFormData(prev => ({
        ...prev,
        customMuscleGroups: [...prev.customMuscleGroups, muscleGroup],
        currentCustomMuscleGroup: ''
      }));
    }
  };

  const removeCustomMuscleGroup = (muscleGroupToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      customMuscleGroups: prev.customMuscleGroups.filter(group => group !== muscleGroupToRemove)
    }));
  };

  const handleCustomMuscleGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomMuscleGroup();
    }
  };

  const generateRoutine = async () => {
    const hasGoals = formData.goal.length > 0 || formData.customGoals.length > 0;
    const hasEquipment = formData.equipment.length > 0 || formData.customEquipment.length > 0;
    const hasMuscleGroups = formData.muscleGroups.length > 0 || formData.customMuscleGroups.length > 0;
    const hasValidTime = formData.timeAvailable && 
      (formData.timeAvailable !== 'custom' || (formData.customTime && parseInt(formData.customTime) >= 15 && parseInt(formData.customTime) <= 300));
    
    if (!hasGoals || !formData.experience || !hasValidTime || !hasEquipment || !hasMuscleGroups) {
      setError(t.routineGenerator.completeRequiredFields);
      toast({
        title: "Error",
        description: t.routineGenerator.completeRequiredFields,
        variant: "destructive"
      });
      return;
    }

    let goals = [...formData.goal, ...formData.customGoals];
    
    if (formData.currentCustomGoal.trim()) {
      goals.push(formData.currentCustomGoal.trim());
    }

    let equipment = [...formData.equipment, ...formData.customEquipment];
    if (formData.currentCustomEquipment.trim()) {
      equipment.push(formData.currentCustomEquipment.trim());
    }

    let muscleGroups = [...formData.muscleGroups, ...formData.customMuscleGroups];
    if (formData.currentCustomMuscleGroup.trim()) {
      muscleGroups.push(formData.currentCustomMuscleGroup.trim());
    }

    const timeAvailable = formData.timeAvailable === 'custom' ? formData.customTime : formData.timeAvailable;

    const dataToSend: APIFormData = {
      goal: goals.join(', '),
      experience: formData.experience,
      timeAvailable: timeAvailable,
      equipment: equipment,
      muscleGroups: muscleGroups,
      limitations: formData.limitations,
      preferences: formData.preferences
    };

    generateRoutineMutation.mutate(dataToSend);
  };

  const saveRoutine = async () => {
    if (!generatedRoutine) return;
    saveRoutineMutation.mutate(generatedRoutine);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante': return 'bg-green-500';
      case 'intermedio': return 'bg-yellow-500';
      case 'avanzado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante': return t.routineGenerator.beginnerLevel;
      case 'intermedio': return t.routineGenerator.intermediateLevel;
      case 'avanzado': return t.routineGenerator.advancedLevel;
      default: return difficulty;
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      generateRoutine();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepValidation = () => {
    switch (currentStep) {
      case 1:
        const hasGoals = formData.goal.length > 0 || formData.customGoals.length > 0;
        const hasValidTime = formData.timeAvailable && 
          (formData.timeAvailable !== 'custom' || (formData.customTime && parseInt(formData.customTime) >= 15 && parseInt(formData.customTime) <= 300));
        return hasGoals && formData.experience && hasValidTime;
      case 2:
        const hasEquipment = formData.equipment.length > 0 || formData.customEquipment.length > 0;
        const hasMuscleGroups = formData.muscleGroups.length > 0 || formData.customMuscleGroups.length > 0;
        return hasEquipment && hasMuscleGroups;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const startWorkoutWithRoutine = () => {
    if (savedRoutineId) {
      router.push(`/dashboard/training?routineId=${savedRoutineId}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl mb-16 md:mb-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t.routineGenerator.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.routineGenerator.subtitle}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t.routineGenerator.step} {currentStep} {t.routineGenerator.of} 4</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / 4) * 100)}% {t.routineGenerator.completed}</span>
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Paso 1: Objetivos básicos */}
      {currentStep === 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t.routineGenerator.objectivesAndExperience}
            </CardTitle>
            <p className="text-muted-foreground">{t.routineGenerator.objectivesDescription}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="goal" className="text-base font-semibold">{t.routineGenerator.mainObjective}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {goalOptions.map(goal => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.goal.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, goal: [...prev.goal, goal] }));
                        } else {
                          setFormData(prev => ({ ...prev, goal: prev.goal.filter(g => g !== goal) }));
                        }
                      }}
                    />
                    <Label htmlFor={goal} className="cursor-pointer text-sm">{goal}</Label>
                  </div>
                ))}
              </div>
              
              {/* Objetivo personalizado */}
              <div className="mt-3">
                <Label htmlFor="customGoals" className="text-sm font-medium">{t.routineGenerator.customGoalsLabel}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="customGoals"
                    placeholder={t.routineGenerator.customGoalPlaceholder}
                    value={formData.currentCustomGoal}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentCustomGoal: e.target.value }))}
                    onKeyDown={handleCustomGoalKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomGoal}
                    disabled={!formData.currentCustomGoal.trim()}
                  >
                    {t.routineGenerator.addGoal}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.routineGenerator.customGoalHelp}
                </p>
                
                {/* Mostrar objetivos personalizados agregados */}
                {formData.customGoals.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">{t.routineGenerator.customGoalsAdded}:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.customGoals.map(goal => (
                        <Badge key={goal} variant="secondary" className="flex items-center gap-1">
                          {goal}
                          <button
                            type="button"
                            onClick={() => removeCustomGoal(goal)}
                            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mostrar objetivos seleccionados */}
              {(formData.goal.length > 0 || formData.customGoals.length > 0) && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">{t.routineGenerator.objectivesSelected}</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.goal.map(goal => (
                      <Badge key={goal} variant="secondary">{goal}</Badge>
                    ))}
                    {formData.customGoals.map(goal => (
                      <Badge key={goal} variant="secondary">{goal}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="experience" className="text-base font-semibold">{t.routineGenerator.experienceLevel}</Label>
              <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t.routineGenerator.selectLevel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principiante">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {t.routineGenerator.beginner}
                    </div>
                  </SelectItem>
                  <SelectItem value="intermedio">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {t.routineGenerator.intermediate}
                    </div>
                  </SelectItem>
                  <SelectItem value="avanzado">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      {t.routineGenerator.advanced}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time" className="text-base font-semibold">{t.routineGenerator.timeAvailable}</Label>
              <Select value={formData.timeAvailable} onValueChange={(value) => setFormData(prev => ({ ...prev, timeAvailable: value }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t.routineGenerator.selectDuration} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 {t.routineGenerator.minutes}</SelectItem>
                  <SelectItem value="45">45 {t.routineGenerator.minutes}</SelectItem>
                  <SelectItem value="60">60 {t.routineGenerator.minutes}</SelectItem>
                  <SelectItem value="75">75 {t.routineGenerator.minutes}</SelectItem>
                  <SelectItem value="90">90 {t.routineGenerator.minutes}</SelectItem>
                  <SelectItem value="120">2 {t.routineGenerator.hours}</SelectItem>
                  <SelectItem value="custom">{t.routineGenerator.customTime}</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Campo de tiempo personalizado */}
              {formData.timeAvailable === 'custom' && (
                <div className="mt-3">
                  <Label htmlFor="customTime" className="text-sm font-medium">{t.routineGenerator.customTimeLabel}</Label>
                  <Input
                    id="customTime"
                    type="number"
                    min="15"
                    max="300"
                    placeholder={t.routineGenerator.customTimePlaceholder}
                    value={formData.customTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, customTime: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.routineGenerator.customTimeHelp}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Equipamiento y grupos musculares */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {t.routineGenerator.availableEquipment}
              </CardTitle>
              <p className="text-muted-foreground">{t.routineGenerator.equipmentDescription}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {equipmentOptions.map(equipment => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment}
                      checked={formData.equipment.includes(equipment)}
                      onCheckedChange={(checked) => handleEquipmentChange(equipment, checked as boolean)}
                    />
                    <Label htmlFor={equipment} className="cursor-pointer">{equipment}</Label>
                  </div>
                ))}
              </div>
              
              {/* Equipamiento personalizado */}
              <div className="mt-4">
                <Label htmlFor="customEquipment" className="text-sm font-medium">{t.routineGenerator.customEquipmentLabel}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="customEquipment"
                    placeholder={t.routineGenerator.customEquipmentPlaceholder}
                    value={formData.currentCustomEquipment}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentCustomEquipment: e.target.value }))}
                    onKeyDown={handleCustomEquipmentKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomEquipment}
                    disabled={!formData.currentCustomEquipment.trim()}
                  >
                    {t.routineGenerator.addEquipment}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.routineGenerator.customEquipmentHelp}
                </p>
                
                {/* Mostrar equipamiento personalizado agregado */}
                {formData.customEquipment.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">{t.routineGenerator.customEquipmentAdded}:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.customEquipment.map(equipment => (
                        <Badge key={equipment} variant="secondary" className="flex items-center gap-1">
                          {equipment}
                          <button
                            type="button"
                            onClick={() => removeCustomEquipment(equipment)}
                            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mostrar equipamiento seleccionado */}
              {(formData.equipment.length > 0 || formData.customEquipment.length > 0) && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t.routineGenerator.selectedEquipment}</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.equipment.map(equipment => (
                      <Badge key={equipment} variant="secondary">{equipment}</Badge>
                    ))}
                    {formData.customEquipment.map(equipment => (
                      <Badge key={equipment} variant="secondary">{equipment}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t.routineGenerator.muscleGroups}
              </CardTitle>
              <p className="text-muted-foreground">{t.routineGenerator.muscleGroupsDescription}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {muscleGroupOptions.map(muscleGroup => (
                  <div key={muscleGroup} className="flex items-center space-x-2">
                    <Checkbox
                      id={muscleGroup}
                      checked={formData.muscleGroups.includes(muscleGroup)}
                      onCheckedChange={(checked) => handleMuscleGroupChange(muscleGroup, checked as boolean)}
                    />
                    <Label htmlFor={muscleGroup} className="cursor-pointer">{muscleGroup}</Label>
                  </div>
                ))}
              </div>
              
              {/* Grupos musculares personalizados */}
              <div className="mt-4">
                <Label htmlFor="customMuscleGroups" className="text-sm font-medium">{t.routineGenerator.customMuscleGroupsLabel}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="customMuscleGroups"
                    placeholder={t.routineGenerator.customMuscleGroupsPlaceholder}
                    value={formData.currentCustomMuscleGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentCustomMuscleGroup: e.target.value }))}
                    onKeyDown={handleCustomMuscleGroupKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomMuscleGroup}
                    disabled={!formData.currentCustomMuscleGroup.trim()}
                  >
                    {t.routineGenerator.addMuscleGroup}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.routineGenerator.customMuscleGroupsHelp}
                </p>
                
                {/* Mostrar grupos musculares personalizados agregados */}
                {formData.customMuscleGroups.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">{t.routineGenerator.customMuscleGroupsAdded}:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.customMuscleGroups.map(group => (
                        <Badge key={group} variant="secondary" className="flex items-center gap-1">
                          {group}
                          <button
                            type="button"
                            onClick={() => removeCustomMuscleGroup(group)}
                            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mostrar grupos musculares seleccionados */}
              {(formData.muscleGroups.length > 0 || formData.customMuscleGroups.length > 0) && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t.routineGenerator.selectedMuscleGroups}</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.muscleGroups.map(group => (
                      <Badge key={group} variant="secondary">{group}</Badge>
                    ))}
                    {formData.customMuscleGroups.map(group => (
                      <Badge key={group} variant="secondary">{group}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Paso 3: Limitaciones y preferencias */}
      {currentStep === 3 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.routineGenerator.limitationsAndPreferences}
            </CardTitle>
            <p className="text-muted-foreground">{t.routineGenerator.limitationsDescription}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="limitations" className="text-base font-semibold">{t.routineGenerator.physicalLimitations}</Label>
              <Textarea
                id="limitations"
                placeholder={t.routineGenerator.limitationsPlaceholder}
                value={formData.limitations}
                onChange={(e) => setFormData(prev => ({ ...prev, limitations: e.target.value }))}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t.routineGenerator.limitationsHelp}
              </p>
            </div>

            <div>
              <Label htmlFor="preferences" className="text-base font-semibold">{t.routineGenerator.additionalPreferences}</Label>
              <Textarea
                id="preferences"
                placeholder={t.routineGenerator.preferencesPlaceholder}
                value={formData.preferences}
                onChange={(e) => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {t.routineGenerator.preferencesHelp}
              </p>
            </div>

            {/* Resumen */}
            <div className="bg-muted/50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-3">{t.routineGenerator.routineSummary}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t.routineGenerator.objective}</span> 
                  {(() => {
                    const allGoals = [...formData.goal, ...formData.customGoals];
                    return allGoals.length > 0 ? allGoals.join(', ') : t.routineGenerator.selectObjective;
                  })()}
                </div>
                <div>
                  <span className="font-medium">{t.routineGenerator.experience}</span> {getDifficultyText(formData.experience)}
                </div>
                <div>
                  <span className="font-medium">{t.routineGenerator.duration}</span> {formData.timeAvailable === 'custom' ? `${formData.customTime} ${t.routineGenerator.minutes}` : `${formData.timeAvailable} ${t.routineGenerator.minutes}`}
                </div>
                <div>
                  <span className="font-medium">{t.routineGenerator.equipment}</span> {(() => {
                    const totalEquipment = formData.equipment.length + formData.customEquipment.length;
                    return `${totalEquipment} ${t.routineGenerator.elements}`;
                  })()}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">{t.routineGenerator.muscleGroupsLabel}</span> {(() => {
                    const allMuscleGroups = [...formData.muscleGroups, ...formData.customMuscleGroups];
                    return allMuscleGroups.length > 0 ? allMuscleGroups.join(', ') : t.routineGenerator.selectMuscleGroups;
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 4: Rutina generada */}
      {currentStep === 4 && generatedRoutine && (
        <div className="space-y-6">
          {/* Header de la rutina */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{generatedRoutine.name}</CardTitle>
                  <p className="text-muted-foreground mb-4">{generatedRoutine.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {generatedRoutine.duration}
                    </Badge>
                    <Badge variant="outline" className={`text-white ${getDifficultyColor(generatedRoutine.difficulty)}`}>
                      {getDifficultyText(generatedRoutine.difficulty)}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {generatedRoutine.frequency}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {generatedRoutine.goals.map((goal, index) => (
                      <Badge key={index} variant="secondary">{goal}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  onClick={saveRoutine} 
                  disabled={saveRoutineMutation.isPending || savedRoutineId !== null}
                  className="flex items-center gap-2"
                >
                  {saveRoutineMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : savedRoutineId ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {savedRoutineId ? t.routineGenerator.saved : t.routineGenerator.saveRoutine}
                </Button>
                
                {savedRoutineId && (
                  <Button onClick={startWorkoutWithRoutine} className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    {t.routineGenerator.startTraining}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calentamiento */}
          {generatedRoutine.warmup.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-orange-500" />
                  {t.routineGenerator.warmup}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedRoutine.warmup.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-medium text-orange-600">
                        {index + 1}
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ejercicios principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dumbbell className="h-5 w-5 text-blue-500" />
                {t.routineGenerator.mainExercises}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedRoutine.exercises.map((exercise, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{exercise.name}</h4>
                      <Badge variant="outline" className={`text-white ${getDifficultyColor(exercise.difficulty)}`}>
                        {getDifficultyText(exercise.difficulty)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.routineGenerator.sets}</span>
                        <Badge variant="secondary">{exercise.sets}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.routineGenerator.reps}</span>
                        <Badge variant="secondary">{exercise.reps}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.routineGenerator.rest}</span>
                        <Badge variant="secondary">{exercise.rest}</Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {exercise.muscleGroups.map((muscle, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{muscle}</Badge>
                      ))}
                    </div>

                    {exercise.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        <span className="font-medium">{t.routineGenerator.notes}</span> {exercise.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enfriamiento */}
          {generatedRoutine.cooldown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  {t.routineGenerator.cooldown}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedRoutine.cooldown.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                        {index + 1}
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consejos */}
          {generatedRoutine.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {t.routineGenerator.importantTips}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedRoutine.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-medium text-yellow-600 mt-0.5">
                        {index + 1}
                      </div>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Generando rutina */}
      {generateRoutineMutation.isPending && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.routineGenerator.generatingRoutine}</h3>
              <p className="text-muted-foreground">
                {t.routineGenerator.generatingDescription}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación */}
      {currentStep < 4 && !generateRoutineMutation.isPending && (
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            {t.routineGenerator.previous}
          </Button>
          
          <Button 
            onClick={nextStep} 
            disabled={!getStepValidation()}
            className="flex items-center gap-2"
          >
            {currentStep === 3 ? (
              <>
                <Sparkles className="w-4 h-4" />
                {t.routineGenerator.generateRoutine}
              </>
            ) : (
              <>
                {t.routineGenerator.next}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Botón para generar nueva rutina */}
      {currentStep === 4 && (
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStep(1);
              setGeneratedRoutine(null);
              setSavedRoutineId(null);
              setError('');
            }}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t.routineGenerator.generateNewRoutine}
          </Button>
        </div>
      )}
    </div>
  );
} 
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PlayCircle,
  Dumbbell,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { TrainingSession } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useTranslations, useLanguage } from '@/contexts/LanguageContext';

export function TrainingNewPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const { language } = useLanguage();

  const createEmptySessionMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        exercises: []
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

  const startEmptyWorkout = () => {
    createEmptySessionMutation.mutate()
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl mb-16 md:mb-0">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/training/start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.common.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.training.startEmptyWorkout}</h1>
          <p className="text-muted-foreground">{t.training.emptyWorkoutDescription}</p>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
            <Dumbbell className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl">{t.training.createCustomWorkout}</CardTitle>
          <p className="text-muted-foreground">
            {t.training.customWorkoutDescription}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {language === 'es' ? '¿Qué puedes hacer?' : 'What can you do?'}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                {language === 'es' ? 'Agregar ejercicios sobre la marcha' : 'Add exercises on the go'}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                {language === 'es' ? 'Personalizar sets y repeticiones' : 'Customize sets and repetitions'}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                {language === 'es' ? 'Reordenar ejercicios con drag & drop' : 'Reorder exercises with drag & drop'}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                {language === 'es' ? 'Entrenar sin limitaciones de rutina' : 'Train without routine limitations'}
              </li>
            </ul>
          </div>

          <Button 
            onClick={startEmptyWorkout}
            disabled={createEmptySessionMutation.isPending}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {createEmptySessionMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t.training.startingSession}
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                {t.training.startTraining}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {language === 'es' 
              ? 'Podrás agregar ejercicios una vez que comience la sesión'
              : 'You can add exercises once the session starts'
            }
          </p>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
              <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                {language === 'es' ? 'Consejo' : 'Tip'}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {language === 'es' 
                  ? 'El entrenamiento libre es perfecto para días espontáneos o cuando quieres experimentar con nuevos ejercicios sin seguir una rutina específica.'
                  : 'Free training is perfect for spontaneous days or when you want to experiment with new exercises without following a specific routine.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
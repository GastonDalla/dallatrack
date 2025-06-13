"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/contexts/LanguageContext'

export function ExerciseCreatePageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()
  const queryClient = useQueryClient()

  const exerciseSchema = z.object({
    title: z.string().min(1, t.forms?.titleRequired || "El título es requerido"),
    description: z.string().optional(),
    youtubeLink: z.string().url(t.forms?.validUrl || "Debe ser una URL válida").optional().or(z.literal("")),
    defaultSets: z.coerce.number().int().min(1, t.forms?.minOneSets || "Debe tener al menos 1 set")
  })

  type ExerciseFormValues = z.infer<typeof exerciseSchema>

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeLink: "",
      defaultSets: 3
    }
  })

  const createMutation = useMutation({
    mutationFn: async (exerciseData: ExerciseFormValues) => {
      const apiData = {
        ...exerciseData,
        muscleGroups: [],
        equipment: [],
        difficulty: 'principiante' as const,
        instructions: [],
        tips: []
      }
      
      const data = await ofetch<{ exercise: any }>('/api/exercises', {
        method: 'POST',
        body: apiData,
      })
      return data.exercise
    },
    onSuccess: (newExercise) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      
      toast({
        title: t.exercises?.exerciseCreated || "Ejercicio creado",
        description: t.exercises?.exerciseCreated || "Tu nuevo ejercicio ha sido agregado exitosamente."
      })
      router.push('/dashboard/exercises')
    },
    onError: (error: any) => {
      toast({
        title: t.common?.error || "Error",
        description: error?.data?.error || t.exercises?.failedToCreate || "Hubo un problema creando tu ejercicio.",
        variant: "destructive"
      })
    }
  })

  const onSubmit = async (data: ExerciseFormValues) => {
    createMutation.mutate(data)
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 mb-16 md:mb-0">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/dashboard/exercises">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common?.back || "Volver"}
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">{t.exercises?.createNewExercise || "Crear Nuevo Ejercicio"}</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t.exercises?.exerciseDetails || "Detalles del Ejercicio"}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.forms?.title || "Título"}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.placeholders?.exerciseTitle || "ej., Press de Banca"} {...field} />
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
                    <FormLabel>{t.forms?.description || "Descripción"}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t.forms?.describeOptional || "Describe el ejercicio (opcional)"} 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="youtubeLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.exercises?.youtubeOptional || "Enlace de YouTube (opcional)"}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t.placeholders?.youtubeLink || "https://www.youtube.com/watch?v=..."}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="defaultSets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.exercises?.defaultSets || "Número de Sets por Defecto"}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (t.buttons?.creating || "Creando...") : (t.exercises?.createExercise || "Crear Ejercicio")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 
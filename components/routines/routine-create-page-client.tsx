"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/contexts/LanguageContext'
import { Routine } from '@/types'

export function RoutineCreatePageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations()

  const routineSchema = z.object({
    title: z.string().min(1, t.forms?.titleRequired || "El título es requerido"),
    description: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
      required_error: "La dificultad es requerida"
    }),
  })

  type RoutineFormValues = z.infer<typeof routineSchema>

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: undefined
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: RoutineFormValues) => {
      const response = await ofetch<{ routine: Routine }>('/api/routines', {
        method: 'POST',
        body: {
          ...data,
          exercises: [], 
          estimatedDuration: 60 
        }
      })
      return response.routine
    },
    onSuccess: (routine) => {
      toast({
        title: t.routines?.routineCreated || "Rutina creada",
        description: t.routines?.routineCreated || "Tu rutina ha sido creada. ¡Ahora agrega ejercicios!"
      })
      router.push(`/dashboard/routines/${routine.id}/edit`)
    },
    onError: (error: any) => {
      toast({
        title: t.common?.error || "Error",
        description: error?.data?.error || t.errors?.failedToCreate || "Hubo un problema creando tu rutina.",
        variant: "destructive"
      })
    }
  })

  const onSubmit = async (data: RoutineFormValues) => {
    createMutation.mutate(data)
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 mb-16 md:mb-0">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/dashboard/routines">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common?.back || "Volver"}
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">{t.routines?.createRoutine || "Crear Nueva Rutina"}</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t.routines?.routineDetails || "Detalles de la Rutina"}</CardTitle>
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
                      <Input placeholder={t.placeholders?.routineTitle || "ej., Entrenamiento de Fuerza de Tren Superior"} {...field} />
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
                        placeholder={t.forms?.describeRoutineOptional || "Describe la rutina (opcional)"} 
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
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de Dificultad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el nivel de dificultad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Principiante</SelectItem>
                        <SelectItem value="intermediate">Intermedio</SelectItem>
                        <SelectItem value="advanced">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
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
                {createMutation.isPending ? (t.buttons?.creating || "Creando...") : (t.routines?.createRoutine || "Crear Rutina")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 
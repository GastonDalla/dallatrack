'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ExerciseList } from '@/components/exercises/exercise-list'
import { useTranslations } from '@/contexts/LanguageContext'

export function ExercisePageClient() {
  const t = useTranslations()

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 mb-16 md:mb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t.exercises.title}</h1>
        <Link href="/dashboard/exercises/create">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            {t.exercises.createExercise}
          </Button>
        </Link>
      </div>
      
      <div className="mt-6">
        <ExerciseList />
      </div>
    </div>
  )
} 
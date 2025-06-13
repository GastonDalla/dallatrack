'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, BarChart3 } from 'lucide-react'
import { RoutineList } from '@/components/routines/routine-list'
import { useTranslations } from '@/contexts/LanguageContext'

export function RoutinePageClient() {
  const t = useTranslations()

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 mb-16 md:mb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t.routines.title}</h1>
        <div className="flex gap-3">
          <Link href="/dashboard/routines/statistics">
            <Button variant="outline" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              {t.sharing.statistics.title}
            </Button>
          </Link>
          <Link href="/dashboard/routines/create">
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              {t.routines.createRoutine}
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-6">
        <RoutineList />
      </div>
    </div>
  )
} 
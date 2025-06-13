"use client"

import { Routine } from '@/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { formatDistanceToNow } from 'date-fns'
import { useTranslations } from '@/contexts/LanguageContext'

interface RoutineSelectorProps {
  routines: Routine[]
  selectedRoutineId: string | null
  onSelect: (routineId: string) => void
}

export function RoutineSelector({ routines, selectedRoutineId, onSelect }: RoutineSelectorProps) {
  const t = useTranslations()

  return (
    <RadioGroup value={selectedRoutineId || undefined} onValueChange={onSelect} className="space-y-4">
      {routines.map(routine => (
        <div key={routine.id} className="space-y-2">
          <RadioGroupItem
            value={routine.id}
            id={`routine-${routine.id}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`routine-${routine.id}`}
            className="cursor-pointer"
          >
            <Card className={`transition-all hover:border-primary peer-data-[state=checked]:border-primary ${
              selectedRoutineId === routine.id ? 'border-primary' : ''
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{routine.title}</CardTitle>
                    {routine.description && (
                      <CardDescription className="mt-1.5">
                        {routine.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">
                    {routine.exercises.length} {routine.exercises.length !== 1 ? t.routines.exercises.toLowerCase() : t.common.exercise.toLowerCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-sm text-muted-foreground">
                  {t.common.updated} {formatDistanceToNow(new Date(routine.updatedAt), { addSuffix: true })}
                </div>
              </CardContent>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
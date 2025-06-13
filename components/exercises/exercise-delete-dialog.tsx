"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslations } from '@/contexts/LanguageContext'

interface ExerciseDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ExerciseDeleteDialog({
  isOpen,
  onClose,
  onConfirm
}: ExerciseDeleteDialogProps) {
  const t = useTranslations()

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.exercises.deleteExercise}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.exercises.deleteExerciseConfirm}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            {t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
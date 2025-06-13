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

interface RoutineDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function RoutineDeleteDialog({
  isOpen,
  onClose,
  onConfirm
}: RoutineDeleteDialogProps) {
  const t = useTranslations()

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.routines.deleteRoutine}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.routines.deleteRoutineConfirm}
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
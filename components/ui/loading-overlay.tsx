"use client"

import { useLanguage } from '@/contexts/LanguageContext'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function LoadingOverlay() {
  const { isLoading } = useLanguage()
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowOverlay(true), 100)
      return () => clearTimeout(timer)
    } else {
      setShowOverlay(false)
    }
  }, [isLoading])

  if (!showOverlay) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card border shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cambiando idioma...</p>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { X, Download, Smartphone, Monitor, Share, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const PWAInstallPrompt = () => {
  const {
    showInstallPrompt,
    isIOS,
    platform,
    installPWA,
    dismissPrompt,
    canInstall,
    isInstalled
  } = usePWAInstall()

  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setHasBeenDismissed(true)
    }
  }, [])

  useEffect(() => {
    if (showInstallPrompt && !hasBeenDismissed && !isInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [showInstallPrompt, hasBeenDismissed, isInstalled])

  const handleInstall = async () => {
    if (isIOS) {
      return
    }
    
    const success = await installPWA()
    if (success) {
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setHasBeenDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
    dismissPrompt()
  }

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        title: 'Instalar Dallatrack',
        description: 'Añade esta app a tu pantalla de inicio para acceso rápido',
        steps: [
          { icon: Share, text: 'Toca el botón compartir' },
          { icon: Plus, text: 'Selecciona "Añadir a inicio"' },
          { icon: Smartphone, text: 'Confirma la instalación' }
        ],
        showButton: false
      }
    }

    return {
      title: 'Instalar Dallatrack',
      description: 'Instala nuestra app para una mejor experiencia',
      steps: [
        { icon: Download, text: 'Funciona sin conexión' },
        { icon: platform === 'mobile' ? Smartphone : Monitor, text: 'Acceso rápido desde tu dispositivo' },
        { icon: Plus, text: 'Sin usar espacio del navegador' }
      ],
      showButton: true
    }
  }

  if (!isVisible || isInstalled) return null

  const instructions = getInstallInstructions()

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-2 border-primary/20 shadow-lg backdrop-blur-sm bg-background/95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">{instructions.title}</CardTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-xs mb-3">
            {instructions.description}
          </CardDescription>
          
          <div className="space-y-2 mb-4">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <step.icon className="w-3 h-3 text-primary flex-shrink-0" />
                <span>{step.text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {instructions.showButton && canInstall && (
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1 text-xs h-8"
              >
                <Download className="w-3 h-3 mr-1" />
                Instalar
              </Button>
            )}
            
            {isIOS && (
              <div className="flex-1 text-xs text-center text-muted-foreground p-2 bg-muted/50 rounded">
                Usa el botón <Share className="w-3 h-3 inline mx-1" /> de Safari
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
              className="text-xs h-8"
            >
              Ahora no
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
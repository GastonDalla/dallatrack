import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallState {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  isStandalone: boolean
  showInstallPrompt: boolean
  platform: 'desktop' | 'mobile' | 'unknown'
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installState, setInstallState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
    showInstallPrompt: false,
    platform: 'unknown'
  })

  const detectPlatform = useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        isIOS: false,
        isAndroid: false,
        isMobile: false,
        isStandalone: false,
        platform: 'unknown'
      }
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    const isAndroid = /android/i.test(userAgent)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true || 
                        document.referrer.includes('android-app://')

    return {
      isIOS,
      isAndroid,
      isMobile,
      isStandalone,
      platform: isMobile ? 'mobile' : 'desktop'
    }
  }, [])

  const checkIfInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    const { isStandalone } = detectPlatform()
    return isStandalone
  }, [detectPlatform])

  const shouldShowInstallPrompt = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    const { isIOS, isStandalone } = detectPlatform()
    const hasPrompt = !!installPrompt
    const isInstalled = checkIfInstalled()
    const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed')
    
    if (isInstalled || hasBeenDismissed) {
      return false
    }
    
    return hasPrompt || isIOS
  }, [installPrompt, detectPlatform, checkIfInstalled])

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault()
    const prompt = e as BeforeInstallPromptEvent
    setInstallPrompt(prompt)
    
    console.log('📱 beforeinstallprompt event capturado', prompt)
    
    const platformInfo = detectPlatform()
    setInstallState(prev => ({
      ...prev,
      isInstallable: true,
      isInstalled: checkIfInstalled(),
      isIOS: platformInfo.isIOS,
      isStandalone: platformInfo.isStandalone,
      showInstallPrompt: shouldShowInstallPrompt(),
      platform: platformInfo.platform as 'desktop' | 'mobile'
    }))
  }, [detectPlatform, checkIfInstalled, shouldShowInstallPrompt])

  const handleAppInstalled = useCallback(() => {
    console.log('📱 App instalada exitosamente')
    setInstallState(prev => ({
      ...prev,
      isInstalled: true,
      showInstallPrompt: false
    }))
    setInstallPrompt(null)
  }, [])

  const installPWA = useCallback(async () => {
    if (!installPrompt) {
      console.log('❌ No hay prompt disponible para instalar')
      return false
    }

    try {
      console.log('🔄 Iniciando instalación PWA...')
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      console.log('✅ Usuario eligió:', outcome)
      
      if (outcome === 'accepted') {
        setInstallState(prev => ({
          ...prev,
          isInstalled: true,
          showInstallPrompt: false
        }))
        setInstallPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Error al instalar PWA:', error)
      return false
    }
  }, [installPrompt])

  const dismissPrompt = useCallback(() => {
    console.log('❌ Usuario descartó el prompt de instalación')
    setInstallState(prev => ({
      ...prev,
      showInstallPrompt: false
    }))
  }, [])

  const resetPrompt = useCallback(() => {
    console.log('🔄 Reseteando prompt de instalación')
    const shouldShow = shouldShowInstallPrompt()
    setInstallState(prev => ({
      ...prev,
      showInstallPrompt: shouldShow
    }))
  }, [shouldShowInstallPrompt])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const platformInfo = detectPlatform()
    const isInstalled = checkIfInstalled()
    
    console.log('🔍 Detectando plataforma:', {
      ...platformInfo,
      isInstalled,
      hasPrompt: !!installPrompt
    })
    
    setInstallState(prev => ({
      ...prev,
      isInstalled,
      isIOS: platformInfo.isIOS,
      isStandalone: platformInfo.isStandalone,
      platform: platformInfo.platform as 'desktop' | 'mobile',
      showInstallPrompt: shouldShowInstallPrompt()
    }))
  }, [detectPlatform, checkIfInstalled, installPrompt, shouldShowInstallPrompt])

  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('👂 Configurando listeners PWA...')
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    window.addEventListener('load', () => {
      console.log('📄 Página cargada, verificando criterios PWA...')
      
      setTimeout(() => {
        const platformInfo = detectPlatform()
        if (platformInfo.isIOS && !checkIfInstalled()) {
          console.log('📱 Dispositivo iOS detectado, habilitando prompt manual')
          setInstallState(prev => ({
            ...prev,
            isInstallable: true,
            showInstallPrompt: shouldShowInstallPrompt()
          }))
        }
      }, 1000)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [handleBeforeInstallPrompt, handleAppInstalled, detectPlatform, checkIfInstalled, shouldShowInstallPrompt])

  return {
    ...installState,
    installPWA,
    dismissPrompt,
    resetPrompt,
    canInstall: (installState.isInstallable || installState.isIOS) && !installState.isInstalled
  }
} 
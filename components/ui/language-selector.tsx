"use client"

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/contexts/LanguageContext'
import { Globe, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'

export function LanguageSelector() {
  const { language, setLanguage, t, isLoading } = useLanguage()
  const [isChanging, setIsChanging] = useState(false)

  const handleLanguageChange = useCallback(async (newLanguage: 'es' | 'en') => {
    if (newLanguage === language || isChanging) return
    
    setIsChanging(true)
    try {
      await setLanguage(newLanguage)
    } catch (error) {
      console.error('Error changing language:', error)
    } finally {
      setIsChanging(false)
    }
  }, [language, setLanguage, isChanging])

  const isDisabled = isLoading || isChanging

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={isDisabled}>
          {isDisabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isDisabled 
              ? 'Cargando...' 
              : language === 'es' 
                ? 'Español'
                : 'English'
            }
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange('es')}
          className={language === 'es' ? 'bg-accent' : ''}
          disabled={isDisabled}
        >
          <span className="mr-2">🇪🇸</span>
          Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('en')}
          className={language === 'en' ? 'bg-accent' : ''}
          disabled={isDisabled}
        >
          <span className="mr-2">🇺🇸</span>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
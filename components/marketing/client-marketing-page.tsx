"use client"

import { useTranslations } from '@/contexts/LanguageContext'
import { MarketingPage } from './marketing-page'
import { MarketingStats } from '@/lib/stats'

interface ClientMarketingPageProps {
  stats: MarketingStats
}

export function ClientMarketingPage({ stats }: ClientMarketingPageProps) {
  const translations = useTranslations()
  
  return <MarketingPage translations={translations} stats={stats} />
} 
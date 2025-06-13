import { getMarketingStats } from '@/lib/stats'
import { Metadata } from 'next'
import { ClientMarketingPage } from '@/components/marketing/client-marketing-page'

export const metadata: Metadata = {
  title: 'DallaTrack - Tu Compañero de Entrenamiento',
  description: 'Rastrea tus entrenamientos, crea rutinas y monitorea tu progreso'
}

export default async function LandingPage() {
  const stats = await getMarketingStats()
  
  return <ClientMarketingPage stats={stats} />
} 
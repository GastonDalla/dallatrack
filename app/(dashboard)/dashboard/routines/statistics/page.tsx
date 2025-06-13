import { Metadata } from "next"
import { Suspense } from "react"
import { ShareStatisticsDashboard } from '@/components/routines/share-statistics-dashboard'
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Estadísticas de Rutinas | DallaTrack",
  description: "Ve las estadísticas de tus rutinas compartidas en DallaTrack.",
  keywords: ["estadísticas", "rutinas", "compartidas", "fitness", "gimnasio"],
  openGraph: {
    title: "Estadísticas de Rutinas | DallaTrack",
    description: "Ve las estadísticas de tus rutinas compartidas en DallaTrack.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RoutineStatisticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<PageLoader />}>
        <ShareStatisticsDashboard />
      </Suspense>
    </div>
  )
} 
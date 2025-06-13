import { Metadata } from "next"
import { RoutineGeneratorPageClient } from "@/components/ai/routine-generator-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"


export const metadata: Metadata = {
  title: "Generador de Rutinas IA | DallaTrack",
  description: "Crea rutinas de entrenamiento personalizadas y optimizadas usando inteligencia artificial.",
  keywords: ["generador de rutinas", "IA", "rutinas", "entrenamiento", "personalizado"],
  openGraph: {
    title: "Generador de Rutinas IA | DallaTrack",
    description: "Genera rutinas de entrenamiento con IA.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RoutineGeneratorPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RoutineGeneratorPageClient />
    </Suspense>
  )
} 
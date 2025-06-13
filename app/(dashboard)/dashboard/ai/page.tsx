import { Metadata } from "next"
import { Suspense } from "react"
import { AIPageClient } from "@/components/ai/ai-page-client"
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Centro de IA | DallaTrack",
  description: "Tu suite completa de herramientas de inteligencia artificial para optimizar tu entrenamiento y alcanzar tus objetivos fitness.",
  keywords: ["inteligencia artificial", "AI", "entrenamiento", "rutinas", "análisis", "progreso"],
  openGraph: {
    title: "Centro de IA | DallaTrack",
    description: "Herramientas de IA para optimizar tu entrenamiento.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function AIPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AIPageClient />
    </Suspense>
  )
} 
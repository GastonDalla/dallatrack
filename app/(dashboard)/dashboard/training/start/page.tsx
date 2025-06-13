import { Metadata } from "next"
import { Suspense } from "react"
import { TrainingStartPageClient } from "@/components/training/training-start-page-client"
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Iniciar Entrenamiento | DallaTrack",
  description: "Comienza tu sesión de entrenamiento y realiza seguimiento en tiempo real.",
  keywords: ["iniciar entrenamiento", "sesión", "entrenamiento", "tiempo real"],
  openGraph: {
    title: "Iniciar Entrenamiento | DallaTrack",
    description: "Comienza tu sesión de entrenamiento.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function TrainingStartPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TrainingStartPageClient />
    </Suspense>
  )
}
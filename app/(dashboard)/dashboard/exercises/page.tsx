import { Metadata } from "next"
import { Suspense } from "react"
import { ExercisePageClient } from "@/components/exercises/exercise-page-client"
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Ejercicios | DallaTrack",
  description: "Explora y gestiona tu biblioteca de ejercicios en DallaTrack. Crea ejercicios personalizados y administra tu repertorio.",
  keywords: ["ejercicios", "biblioteca", "movimientos", "fitness", "entrenamiento"],
  openGraph: {
    title: "Ejercicios | DallaTrack",
    description: "Explora y gestiona tu biblioteca de ejercicios en DallaTrack.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ExercisesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExercisePageClient />
    </Suspense>
  )
}
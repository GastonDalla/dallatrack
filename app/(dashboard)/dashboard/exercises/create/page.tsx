import { Metadata } from "next"
import { ExerciseCreatePageClient } from "@/components/exercises/exercise-create-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"


export const metadata: Metadata = {
  title: "Crear Ejercicio | DallaTrack",
  description: "Crea y personaliza nuevos ejercicios para tus rutinas de entrenamiento.",
  keywords: ["crear ejercicio", "nuevo ejercicio", "personalizar", "entrenamiento"],
  openGraph: {
    title: "Crear Ejercicio | DallaTrack",
    description: "Crea nuevos ejercicios personalizados.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function CreateExercisePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExerciseCreatePageClient />
    </Suspense>
  )
}
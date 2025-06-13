import { Metadata } from "next"
import { ExerciseEditPageClient } from "@/components/exercises/exercise-edit-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"


export const metadata: Metadata = {
  title: "Editar Ejercicio | DallaTrack",
  description: "Edita y personaliza ejercicios para tus rutinas de entrenamiento.",
  keywords: ["editar ejercicio", "modificar ejercicio", "personalizar", "entrenamiento"],
  openGraph: {
    title: "Editar Ejercicio | DallaTrack",
    description: "Edita ejercicios personalizados.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EditExercisePage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<PageLoader />}>
      <ExerciseEditPageClient exerciseId={id} />
    </Suspense>
  )
}
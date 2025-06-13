import { Metadata } from "next"
import { ExerciseDetailPageClient } from "@/components/exercises/exercise-detail-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"


export const metadata: Metadata = {
  title: "Detalle de Ejercicio | DallaTrack",
  description: "Revisa los detalles completos de tu ejercicio, incluyendo instrucciones, músculos trabajados y estadísticas de uso.",
  keywords: ["ejercicio", "detalles", "instrucciones", "músculos", "entrenamiento"],
  openGraph: {
    title: "Detalle de Ejercicio | DallaTrack",
    description: "Revisa los detalles de tu ejercicio.",
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

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<PageLoader />}>
      <ExerciseDetailPageClient exerciseId={id} />
    </Suspense>
  )
} 
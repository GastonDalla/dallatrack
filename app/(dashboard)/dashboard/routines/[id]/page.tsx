import { Metadata } from "next"
import { RoutineDetailPageClient } from "@/components/routines/routine-detail-page-client"

export const metadata: Metadata = {
  title: "Detalle de Rutina | DallaTrack",
  description: "Revisa los detalles completos de tu rutina de entrenamiento.",
  keywords: ["rutina", "detalle", "entrenamiento", "ejercicios"],
  openGraph: {
    title: "Detalle de Rutina | DallaTrack",
    description: "Revisa los detalles de tu rutina.",
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

export default async function RoutineDetailPage({ params }: Props) {
  const { id } = await params
  return <RoutineDetailPageClient routineId={id} />
} 
import { Metadata } from "next"
import { TrainingSessionPageClient } from "@/components/training/training-session-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Sesión de Entrenamiento | DallaTrack",
  description: "Realiza seguimiento en tiempo real de tu sesión de entrenamiento.",
  keywords: ["sesión entrenamiento", "tiempo real", "seguimiento", "progreso"],
  openGraph: {
    title: "Sesión de Entrenamiento | DallaTrack",
    description: "Sesión activa de entrenamiento.",
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

export default async function TrainingSessionPage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<PageLoader />}>
      <TrainingSessionPageClient sessionId={id} />
    </Suspense>
  )
}
import { Metadata } from "next"
import { HistoryDetailPageClient } from "@/components/history/history-detail-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"


export const metadata: Metadata = {
  title: "Detalle de Entrenamiento | DallaTrack",
  description: "Revisa los detalles completos de tu sesión de entrenamiento.",
  keywords: ["detalle entrenamiento", "sesión", "historial", "progreso"],
  openGraph: {
    title: "Detalle de Entrenamiento | DallaTrack",
    description: "Revisa los detalles de tu entrenamiento.",
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

export default async function HistoryDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<PageLoader />}>
      <HistoryDetailPageClient sessionId={id} />
    </Suspense>
  )
}
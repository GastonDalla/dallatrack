import { Metadata } from "next"
import { Suspense } from "react"
import { HistoryPageClient } from "@/components/history/history-page-client"
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Historial | DallaTrack",
  description: "Revisa tu historial completo de entrenamientos y analiza tu progreso fitness a lo largo del tiempo.",
  keywords: ["historial", "progreso", "entrenamientos", "análisis", "estadísticas"],
  openGraph: {
    title: "Historial | DallaTrack",
    description: "Revisa tu historial completo de entrenamientos y analiza tu progreso.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HistoryPageClient />
    </Suspense>
  )
}
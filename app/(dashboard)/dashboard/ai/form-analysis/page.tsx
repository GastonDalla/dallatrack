import { Metadata } from "next"
import { FormAnalysisPageClient } from "@/components/ai/form-analysis-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"


export const metadata: Metadata = {
  title: "Análisis de Formas IA | DallaTrack",
  description: "Analiza tus formas de ejercicio con IA.",
  keywords: ["análisis de formas", "IA", "ejercicio", "personalizado"],
  openGraph: {
    title: "Análisis de Formas IA | DallaTrack",
    description: "Analiza tus formas de ejercicio con IA.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function FormAnalysisPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FormAnalysisPageClient />
    </Suspense>
  )
} 
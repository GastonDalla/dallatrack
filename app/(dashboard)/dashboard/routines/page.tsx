import { Metadata } from "next"
import { Suspense } from "react"
import { RoutinePageClient } from '@/components/routines/routine-page-client'
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Rutinas | DallaTrack",
  description: "Gestiona tus rutinas de ejercicios en DallaTrack. Crea, edita y organiza tus entrenamientos personalizados.",
  keywords: ["rutinas", "entrenamientos", "ejercicios", "fitness", "gimnasio"],
  openGraph: {
    title: "Rutinas | DallaTrack",
    description: "Gestiona tus rutinas de ejercicios en DallaTrack.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RoutinesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RoutinePageClient />
    </Suspense>
  )
}
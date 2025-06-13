import { Metadata } from "next"
import { RoutineCreatePageClient } from "@/components/routines/routine-create-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Crear Rutina | DallaTrack",
  description: "Crea y personaliza nuevas rutinas de entrenamiento para optimizar tu progreso.",
  keywords: ["crear rutina", "nueva rutina", "personalizar", "entrenamiento"],
  openGraph: {
    title: "Crear Rutina | DallaTrack",
    description: "Crea nuevas rutinas de entrenamiento personalizadas.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function CreateRoutinePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RoutineCreatePageClient />
    </Suspense>
  )
}
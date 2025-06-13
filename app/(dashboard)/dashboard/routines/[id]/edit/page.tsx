import { Metadata } from "next"
import { RoutineEditPageClient } from "@/components/routines/routine-edit-page-client"
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from "react"


export const metadata: Metadata = {
  title: "Editar Rutina | DallaTrack",
  description: "Edita y personaliza rutinas de entrenamiento para optimizar tu progreso.",
  keywords: ["editar rutina", "modificar rutina", "personalizar", "entrenamiento"],
  openGraph: {
    title: "Editar Rutina | DallaTrack",
    description: "Edita rutinas de entrenamiento personalizadas.",
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

export default async function EditRoutinePage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<PageLoader />}>
      <RoutineEditPageClient routineId={id} />
    </Suspense>
  )
}
import { Metadata } from "next"
import { Suspense } from "react"
import { SharedRoutinePageClient } from '@/components/routines/shared-routine-page-client'
import { PageLoader } from "@/components/ui/page-loader"

interface SharedRoutinePageProps {
  params: Promise<{
    code: string
  }>
}

export async function generateMetadata({ params }: SharedRoutinePageProps): Promise<Metadata> {
  const { code } = await params
  
  return {
    title: `Rutina Compartida ${code} | DallaTrack`,
    description: "Ve y agrega esta rutina compartida a tu colección en DallaTrack.",
    keywords: ["rutina", "compartida", "fitness", "gimnasio", "ejercicios"],
    openGraph: {
      title: `Rutina Compartida | DallaTrack`,
      description: "Ve y agrega esta rutina compartida a tu colección en DallaTrack.",
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function SharedRoutinePage({ params }: SharedRoutinePageProps) {
  const { code } = await params
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<PageLoader />}>
        <SharedRoutinePageClient code={code} />
      </Suspense>
    </div>
  )
} 
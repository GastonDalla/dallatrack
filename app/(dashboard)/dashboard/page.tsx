import { Metadata } from "next"
import { Suspense } from "react"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Dashboard | DallaTrack",
  description: "Tu panel principal de DallaTrack con resumen de entrenamientos, rutinas y progreso fitness.",
  keywords: ["dashboard", "gimnasio", "fitness", "progreso", "entrenamientos", "rutinas"],
  openGraph: {
    title: "Dashboard | DallaTrack",
    description: "Tu panel principal de DallaTrack con resumen de entrenamientos y progreso.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function Dashboard() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardClient />
    </Suspense>
  )
} 
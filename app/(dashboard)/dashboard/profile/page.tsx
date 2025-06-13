import { Metadata } from "next"
import { Suspense } from "react"
import { ProfilePageClient } from "@/components/profile/profile-page-client"
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: "Mi Perfil | DallaTrack",
  description: "Administra tu información personal, preferencias y configuración de cuenta en DallaTrack.",
  keywords: ["perfil", "usuario", "configuración", "preferencias", "cuenta"],
  openGraph: {
    title: "Mi Perfil | DallaTrack",
    description: "Administra tu información personal y preferencias en DallaTrack.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProfilePageClient />
    </Suspense>
  )
} 
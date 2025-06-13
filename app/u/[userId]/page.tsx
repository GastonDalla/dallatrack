import { Metadata } from "next"
import { PublicProfilePageClient } from "@/components/profile/public-profile-page-client"
import { $fetch } from "ofetch"

interface PageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params
  return <PublicProfilePageClient userId={userId} />
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { userId } = await params
    const profile = await $fetch(`${process.env.AUTH_URL}/api/user/profile/${userId}`)
    
    return {
      title: `${profile.name} - Perfil Público | DallaTrack`,
      description: `Ve el perfil público de ${profile.name} en DallaTrack. Logros y estadísticas de entrenamiento.`,
      openGraph: {
        title: `${profile.name} - Perfil Público`,
        description: `Ve el perfil público de ${profile.name} en DallaTrack`,
        images: profile.image ? [{ url: profile.image }] : []
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: "Perfil Público | DallaTrack",
      description: "Perfil público de usuario en DallaTrack"
    }
  }
} 
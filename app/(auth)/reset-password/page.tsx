import { Metadata } from 'next'
import { Suspense } from 'react'
import ResetPasswordPageClient from '@/components/auth/reset-password-page-client'
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: 'Resetear Contraseña - DallaTrack',
  description: 'Resetea tu contraseña de DallaTrack',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordPageClient />
    </Suspense>
  )
} 
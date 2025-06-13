import { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/forgot-password-form'
import { PageLoader } from "@/components/ui/page-loader"
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Recuperar Contraseña - DallaTrack',
  description: 'Recupera tu contraseña de DallaTrack',
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ForgotPasswordForm />
    </Suspense>
  )
} 
import { Metadata } from 'next'
import { Suspense } from 'react'
import { SignUpPageClient } from '@/components/auth/signup-page-client'
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: 'Crear Cuenta - DallaTrack',
  description: 'Crea tu cuenta en DallaTrack',
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SignUpPageClient />
    </Suspense>
  )
} 
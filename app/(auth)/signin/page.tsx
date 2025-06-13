import { Metadata } from 'next'
import { Suspense } from 'react'
import { SignInPageClient } from '@/components/auth/signin-page-client'
import { PageLoader } from "@/components/ui/page-loader"

export const metadata: Metadata = {
  title: 'Iniciar Sesión - DallaTrack',
  description: 'Inicia sesión en tu cuenta de DallaTrack',
}

export default function SignInPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SignInPageClient />
    </Suspense>
  )
} 
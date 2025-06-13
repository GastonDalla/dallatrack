"use client"

import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ofetch } from 'ofetch'
import ResetPasswordForm from '@/components/auth/reset-password-form'
import InvalidTokenPage from '@/components/auth/invalid-token-page'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTranslations } from '@/contexts/LanguageContext'

async function validateToken(token: string): Promise<{ valid: boolean; message: string }> {
  const response = await ofetch<{ valid: boolean; message: string }>(`/api/auth/validate-reset-token?token=${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response
}

export default function ResetPasswordPageClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const t = useTranslations()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['validate-reset-token', token],
    queryFn: () => validateToken(token!),
    enabled: !!token,
    retry: false, 
    refetchOnWindowFocus: false, 
  })

  if (!token) {
    return <InvalidTokenPage />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">{t.auth.validatingToken}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !data?.valid) {
    return <InvalidTokenPage />
  }

  return <ResetPasswordForm token={token} />
} 
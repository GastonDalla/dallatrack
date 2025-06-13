"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { ofetch } from "ofetch"
import { useTranslations } from '@/contexts/LanguageContext'

interface ResetPasswordFormProps {
  token: string
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const t = useTranslations()

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      return await ofetch<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: data
      })
    },
    onSuccess: () => {
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
    },
    onError: (error: any) => {
      setError(error?.data?.message || t.auth.passwordUpdateError)
    }
  })

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    if (passwords.newPassword.length < 6) {
      setError(t.auth.passwordMinLength)
      return
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: passwords.newPassword
    })
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-6 text-2xl">{t.auth.passwordUpdated}</CardTitle>
            <CardDescription>
              {t.auth.passwordUpdatedDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/signin">
                {t.auth.signIn}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t.auth.resetPassword}</CardTitle>
          <CardDescription className="text-center">
            {t.auth.resetPasswordDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.auth.newPassword}</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                required
                disabled={resetPasswordMutation.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.auth.confirmNewPassword}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder={t.auth.confirmNewPasswordPlaceholder}
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                required
                disabled={resetPasswordMutation.isPending}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={resetPasswordMutation.isPending || !passwords.newPassword || !passwords.confirmPassword}
            >
              {resetPasswordMutation.isPending ? t.auth.updating : t.auth.updatePassword}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link
              href="/signin"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {t.auth.backToSignIn}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Key, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { ofetch } from "ofetch"
import { useTranslations } from '@/contexts/LanguageContext'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [devToken, setDevToken] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [devNote, setDevNote] = useState<string | null>(null)
  const [error, setError] = useState("")
  const t = useTranslations()

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      return await ofetch<{ 
        message: string; 
        devToken?: string; 
        emailSent?: boolean;
        devNote?: string;
      }>('/api/auth/reset-password', {
        method: 'POST',
        body: { email }
      })
    },
    onSuccess: (response) => {
      setIsSubmitted(true)
      setEmailSent(response.emailSent || false)
      
      if (response.devToken) {
        setDevToken(response.devToken)
        setDevNote(response.devNote || null)
        console.log("🔑 Token de desarrollo:", response.devToken)
      }
    },
    onError: (error: any) => {
      setError(error?.data?.message || t.auth.requestError)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    forgotPasswordMutation.mutate(email)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${emailSent ? 'bg-green-100' : 'bg-blue-100'}`}>
              <Mail className={`h-6 w-6 ${emailSent ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <CardTitle className="mt-6 text-2xl">
              {emailSent ? t.auth.emailSent : t.auth.checkYourEmail}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? t.auth.emailSentDescription
                : t.auth.checkEmailDescription
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailSent && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  {t.auth.emailSentSuccessfully}
                </h3>
                <div className="text-xs text-green-700 space-y-1">
                  {t.auth.emailInstructions.split('\n').map((line: string, index: number) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
            )}

            {!emailSent && devToken && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  {t.auth.developmentMode}
                </h3>
                {devNote && (
                  <p className="text-xs text-yellow-700 mb-2">{devNote}</p>
                )}
                <p className="text-xs text-yellow-700 mb-2">
                  {t.auth.tokenForReset}
                </p>
                <code className="block text-xs bg-yellow-100 p-2 rounded break-all">
                  {devToken}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  asChild
                >
                  <Link href={`/reset-password?token=${devToken}`}>
                    <Key className="h-4 w-4 mr-2" />
                    {t.auth.useTokenDev}
                  </Link>
                </Button>
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/signin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.auth.backToSignIn}
                </Link>
              </Button>
              
              <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                {t.auth.tryAnotherEmail}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t.auth.forgotPasswordTitle}</CardTitle>
          <CardDescription className="text-center">
            {t.auth.forgotPasswordDescription}
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
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={forgotPasswordMutation.isPending}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending || !email}>
              {forgotPasswordMutation.isPending ? t.auth.sending : t.auth.sendInstructions}
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
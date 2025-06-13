"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { SignInForm } from "@/components/auth/signin-form"
import { AuthRedirect } from "@/components/auth/auth-redirect"
import { useTranslations } from "@/contexts/LanguageContext"

export function SignInPageClient() {
  const t = useTranslations()
  
  return (
    <AuthRedirect>
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t.auth.signIn}</CardTitle>
            <CardDescription className="text-center">
              {t.auth.signInDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignInForm />
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t.auth.dontHaveAccount} </span>
              <Link
                href="/signup"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t.auth.signUpHere}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthRedirect>
  )
} 
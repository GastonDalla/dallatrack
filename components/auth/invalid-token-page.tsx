"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useTranslations } from '@/contexts/LanguageContext'

export default function InvalidTokenPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-6 text-2xl">{t.auth.invalidToken}</CardTitle>
          <CardDescription>
            {t.auth.invalidTokenDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/forgot-password">
                {t.auth.requestNewReset}
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/signin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.auth.backToSignIn}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
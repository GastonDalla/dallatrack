"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { useTranslations } from '@/contexts/LanguageContext'
import Link from "next/link"

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const t = useTranslations()

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("🚀 Intentando iniciar sesión con:", email)
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("📋 Resultado del signIn:", result)

      if (result?.error) {
        console.error("❌ Error en signIn:", result.error)
        
        let errorMessage = t.auth.checkCredentials
        
        if (result.error === "CredentialsSignin") {
          errorMessage = t.auth.invalidCredentials
        } else if (result.error.includes("Usuario no encontrado")) {
          errorMessage = t.auth.userNotFound
        } else if (result.error.includes("Contraseña incorrecta")) {
          errorMessage = t.auth.incorrectPassword
        }
        
        setError(errorMessage)
      } else if (result?.ok) {
        console.log("✅ Login exitoso")
        router.push("/dashboard")
        router.refresh()
      } else {
        console.log("⚠️ Login sin error pero tampoco ok")
        setError(t.auth.unexpectedError)
      }
    } catch (error) {
      console.error("❌ Error inesperado:", error)
      setError(t.auth.unexpectedError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" })
    } catch (error) {
      setError(t.auth.oauthError.replace('{provider}', provider))
    }
  }

  return (
    <>
      {/* OAuth Buttons */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthSignIn("google")}
          disabled={isLoading}
        >
          <Icons.google className="mr-2 h-4 w-4" />
          {t.auth.continueWithGoogle}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t.auth.orContinueWithEmail}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t.auth.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.auth.password}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="*******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t.auth.signingIn : t.auth.signIn}
        </Button>
      </form>
    </>
  )
} 
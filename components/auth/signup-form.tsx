"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { $fetch } from "ofetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/ui/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { useTranslations } from '@/contexts/LanguageContext'

export function SignUpForm() {
  const router = useRouter()
  const t = useTranslations()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const response = await $fetch<{ success: boolean; message: string }>('/api/auth/register', {
        method: 'POST',
        body: data
      })
      return response
    },
    onSuccess: async (response, variables) => {
      const result = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push("/dashboard")
      } else {
        router.push("/signin")
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || t.auth.signUpError
      setError(errorMessage)
    }
  })

  const oauthMutation = useMutation({
    mutationFn: async (provider: string) => {
      return signIn(provider, { callbackUrl: "/dashboard" })
    },
    onError: (error, provider) => {
      setError(t.auth.oauthError.replace('{provider}', provider))
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    if (formData.password.length < 6) {
      setError(t.auth.passwordMinLength)
      return
    }

    if (!formData.name.trim()) {
      setError(t.auth.nameRequired)
      return
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    })
  }

  const handleOAuthSignIn = async (provider: string) => {
    oauthMutation.mutate(provider)
  }

  const isLoading = registerMutation.isPending || oauthMutation.isPending

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
          {t.auth.signUpWithGoogle}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t.auth.orSignUpWithEmail}
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

      {/* Registration Form */}
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t.auth.name}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder={t.auth.namePlaceholder}
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t.auth.emailPlaceholder}
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.auth.password}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t.auth.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t.auth.confirmPasswordPlaceholder}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t.auth.signingUp : t.auth.createAccount}
        </Button>
      </form>
    </>
  )
} 
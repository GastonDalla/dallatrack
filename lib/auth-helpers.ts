import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function getUserId(request?: NextRequest): Promise<string | null> {
  try {
    const session = await auth()
    return session?.user?.id || null
  } catch (error) {
    console.error('Error getting user session:', error)
    return null
  }
}

export async function requireAuth(request?: NextRequest): Promise<string> {
  const userId = await getUserId(request)
  if (!userId) {
    throw new Error('Usuario no autenticado')
  }
  return userId
} 
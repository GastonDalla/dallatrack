import authConfig from "./lib/auth.config"
import NextAuth from "next-auth"

const { auth } = NextAuth(authConfig)
export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/api/auth/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/reset-password'
  ]

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth/')
  const isPublicProfileRoute = nextUrl.pathname.startsWith('/u/')
  const isPublicProfileApi = nextUrl.pathname.startsWith('/api/user/profile/')
  const isSharedRoutineRoute = nextUrl.pathname.startsWith('/rutinas/compartida/')
  const isSharedRoutineApi = nextUrl.pathname.startsWith('/api/routines/shared/') && 
                             nextUrl.pathname.match(/^\/api\/routines\/shared\/[A-Z0-9]+$/) && 
                             req.method === 'GET'
  
  if (isApiAuthRoute) {
    return
  }

  if (isPublicProfileRoute || isPublicProfileApi) {
    return
  }

  if (isSharedRoutineRoute || isSharedRoutineApi) {
    return
  }

  if (publicRoutes.includes(nextUrl.pathname)) {
    return
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL('/signin', nextUrl))
  }

  return
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ],
} 
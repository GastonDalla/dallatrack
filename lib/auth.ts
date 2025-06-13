import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import authConfig from "@/lib/auth.config"

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI no está definido en las variables de entorno')
}

const client = new MongoClient(process.env.MONGODB_URI!)

async function getMongoConnection() {
  try {
    await client.connect()
    return client
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error)
    throw error
  }
}

const clientPromise = getMongoConnection()

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 Intento de autenticación para:", credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Credenciales faltantes")
          throw new Error("Email y contraseña son requeridos")
        }

        try {
          const mongoClient = await clientPromise
          const db = mongoClient.db()
          const users = db.collection("users")
          
          console.log("🔍 Buscando usuario en la base de datos...")
          const user = await users.findOne({ email: credentials.email })
          
          if (!user) {
            console.log("❌ Usuario no encontrado:", credentials.email)
            throw new Error("Usuario no encontrado")
          }

          console.log("👤 Usuario encontrado:", { id: user._id, email: user.email, hasPassword: !!user.password })

          if (!user.password || typeof user.password !== 'string') {
            console.log("❌ Usuario sin contraseña válida")
            throw new Error("Configuración de usuario inválida")
          }

          console.log("🔒 Verificando contraseña...")
          const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password)
          
          if (!isPasswordValid) {
            console.log("❌ Contraseña incorrecta para:", credentials.email)
            throw new Error("Contraseña incorrecta")
          }

          console.log("✅ Autenticación exitosa para:", credentials.email)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error("❌ Error en autenticación:", error)
          throw error
        }
      }
    }),
    
    ...authConfig.providers,
  ],
  
  pages: {
    signIn: "/signin",
    error: "/error",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      console.log("✅ Usuario creado:", user.email)
    },
    async signIn({ user, account, profile }) {
      console.log("✅ Usuario logueado:", user.email, "Proveedor:", account?.provider)
    },
    async signOut() {
      console.log("👋 Usuario deslogueado")
    },
  },

  debug: process.env.NODE_ENV === "development",
}) 
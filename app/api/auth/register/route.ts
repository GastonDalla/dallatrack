import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import { sendWelcomeEmail } from "@/lib/email"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { message: "Ya existe un usuario con este email" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = {
      name,
      email,
      password: hashedPassword,
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        age: null,
        weight: null,
        height: null,
        fitnessLevel: "principiante",
        goals: [],
        isPublic: false,
      },
      preferences: {
        units: "metric", 
        notifications: {
          workoutReminders: true,
          progressUpdates: true,
          achievements: true,
        },
        privacy: {
          shareProgress: false,
          publicProfile: false,
        },
      },
      stats: {
        totalWorkouts: 0,
        totalTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
      }
    }

    const result = await users.insertOne(newUser)

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        await sendWelcomeEmail(email, name)
        console.log(`✅ Email de bienvenida enviado a: ${email}`)
      } catch (emailError) {
        console.warn(`⚠️ No se pudo enviar email de bienvenida a ${email}:`, emailError)
      }
    }

    return NextResponse.json(
      { 
        message: "Usuario creado exitosamente",
        userId: result.insertedId 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 
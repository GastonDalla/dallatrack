import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        valid: false,
        message: "Token requerido"
      })
    }

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    const user = await users.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    })
    
    if (!user) {
      const expiredUser = await users.findOne({ resetToken: token })
      if (expiredUser) {
        return NextResponse.json({
          valid: false,
          message: "Token expirado"
        })
      } else {
        return NextResponse.json({
          valid: false,
          message: "Token inválido"
        })
      }
    }

    return NextResponse.json({
      valid: true,
      message: "Token válido"
    })

  } catch (error) {
    console.error("Error validando token:", error)
    return NextResponse.json({
      valid: false,
      message: "Error interno del servidor"
    })
  } finally {
    await client.close()
  }
} 
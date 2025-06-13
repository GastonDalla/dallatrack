import { NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendResetPasswordEmail } from "@/lib/email"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json()

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    if (email && !token && !newPassword) {
      const user = await users.findOne({ email })
      if (!user) {
        return NextResponse.json({
          message: "Si el email existe, recibirás instrucciones para resetear tu contraseña"
        })
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) 

      await users.updateOne(
        { email },
        {
          $set: {
            resetToken,
            resetTokenExpiry,
            updatedAt: new Date()
          }
        }
      )

      let emailSent = false
      try {
        emailSent = await sendResetPasswordEmail(email, resetToken)
      } catch (emailError) {
        console.error("Error enviando email:", emailError)
      }

      if (emailSent) {
        console.log(`✅ Email de reset enviado exitosamente a: ${email}`)
        return NextResponse.json({
          message: "Hemos enviado las instrucciones de reset a tu email",
          emailSent: true
        })
      } else {
        console.log(`🔑 Token de reset para ${email}: ${resetToken}`)
        
        return NextResponse.json({
          message: "Si el email existe, recibirás instrucciones para resetear tu contraseña",
          emailSent: false,
          devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
          devNote: process.env.NODE_ENV === 'development' ? "Email no configurado, usando token de desarrollo" : undefined
        })
      }

    } else if (token && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        )
      }

      const user = await users.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() }
      })

      if (!user) {
        return NextResponse.json(
          { message: "Token inválido o expirado" },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12)

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          },
          $unset: {
            resetToken: "",
            resetTokenExpiry: ""
          }
        }
      )

      return NextResponse.json({
        message: "Contraseña actualizada exitosamente"
      })

    } else {
      return NextResponse.json(
        { message: "Datos de solicitud inválidos" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error en reset password:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { MongoClient, ObjectId } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autenticado" },
        { status: 401 }
      )
    }

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    const user = await users.findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } } 
    )

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error("Error obteniendo perfil:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autenticado" },
        { status: 401 }
      )
    }

    const updates = await request.json()
    
    delete updates._id
    delete updates.password
    delete updates.email 
    
    updates.updatedAt = new Date()

    await client.connect()
    const db = client.db()
    const users = db.collection("users")

    const result = await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: updates }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    const updatedUser = await users.findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } }
    )

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      user: updatedUser
    })

  } catch (error) {
    console.error("Error actualizando perfil:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 
import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { auth } from "@/lib/auth"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de chat inválido" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db()
    const chatsCollection = db.collection("ai_chats")

    const result = await chatsCollection.deleteOne({
      _id: new ObjectId(id),
      userEmail: session.user.email
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Chat no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error deleting AI chat:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const { title } = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID de chat inválido" },
        { status: 400 }
      )
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Título requerido" },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db()
    const chatsCollection = db.collection("ai_chats")

    const result = await chatsCollection.updateOne(
      {
        _id: new ObjectId(id),
        userEmail: session.user.email
      },
      {
        $set: {
          title: title.trim(),
          lastMessageAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Chat no encontrado" },
        { status: 404 }
      )
    }

    const updatedChat = await chatsCollection.findOne({ 
      _id: new ObjectId(id) 
    })

    if (!updatedChat) {
      return NextResponse.json(
        { error: "Error al obtener chat actualizado" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: updatedChat._id.toString(),
      title: updatedChat.title,
      messages: updatedChat.messages,
      createdAt: updatedChat.createdAt,
      lastMessageAt: updatedChat.lastMessageAt
    })

  } catch (error) {
    console.error("Error updating chat title:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 
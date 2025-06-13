import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { auth } from "@/lib/auth"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    await client.connect()
    const db = client.db()
    const chatsCollection = db.collection("ai_chats")

    const chats = await chatsCollection
      .find({ userEmail: session.user.email })
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      chats: chats.map(chat => ({
        id: chat._id.toString(),
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        lastMessageAt: chat.lastMessageAt
      }))
    })

  } catch (error) {
    console.error("Error fetching AI chats:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id, title, messages, action } = await request.json()

    await client.connect()
    const db = client.db()
    const chatsCollection = db.collection("ai_chats")

    if (action === 'create') {
      const newChat = {
        userEmail: session.user.email,
        title: title || 'Nueva Conversación',
        messages: messages || [],
        createdAt: new Date(),
        lastMessageAt: new Date()
      }

      const result = await chatsCollection.insertOne(newChat)

      return NextResponse.json({
        id: result.insertedId.toString(),
        title: newChat.title,
        messages: newChat.messages,
        createdAt: newChat.createdAt,
        lastMessageAt: newChat.lastMessageAt
      })

    } else if (action === 'update' && id) {
      const updateData = {
        title,
        messages,
        lastMessageAt: new Date()
      }

      await chatsCollection.updateOne(
        { _id: new ObjectId(id), userEmail: session.user.email },
        { $set: updateData }
      )

      const updatedChat = await chatsCollection.findOne({ _id: new ObjectId(id) })

      if (!updatedChat) {
        return NextResponse.json(
          { error: "Chat no encontrado" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: updatedChat._id.toString(),
        title: updatedChat.title,
        messages: updatedChat.messages,
        createdAt: updatedChat.createdAt,
        lastMessageAt: updatedChat.lastMessageAt
      })

    } else {
      return NextResponse.json(
        { error: "Acción no válida" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error managing AI chat:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 
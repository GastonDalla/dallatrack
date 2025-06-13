import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { MongoClient, ObjectId } from "mongodb"
import { checkAchievements, type UserStats } from "@/lib/achievements"

const client = new MongoClient(process.env.MONGODB_URI!)

export async function POST(request: NextRequest) {
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

    const user = await users.findOne({ _id: new ObjectId(session.user.id) })

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    const userStats: UserStats = {
      totalWorkouts: user.stats?.totalWorkouts || 0,
      currentStreak: user.stats?.currentStreak || 0,
      longestStreak: user.stats?.longestStreak || 0,
      totalTime: user.stats?.totalTime || 0,
      totalWeight: user.stats?.totalWeight || 0
    }

    const currentAchievements = user.stats?.achievements || []

    const newAchievements = checkAchievements(userStats, currentAchievements)

    if (newAchievements.length > 0) {
      const updatedAchievements = [...currentAchievements, ...newAchievements]
      
      await users.updateOne(
        { _id: new ObjectId(session.user.id) },
        {
          $set: {
            "stats.achievements": updatedAchievements,
            updatedAt: new Date()
          }
        }
      )

      return NextResponse.json({
        newAchievements,
        totalAchievements: updatedAchievements.length,
        message: `¡${newAchievements.length} nuevo(s) logro(s) desbloqueado(s)!`
      })
    }

    return NextResponse.json({
      newAchievements: [],
      totalAchievements: currentAchievements.length,
      message: "No hay nuevos logros"
    })

  } catch (error) {
    console.error("Error verificando logros:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 
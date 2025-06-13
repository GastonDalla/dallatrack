import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { MongoClient, ObjectId } from "mongodb"
import { checkAchievements, type UserStats } from "@/lib/achievements"

const client = new MongoClient(process.env.MONGODB_URI!)

interface UpdateStatsRequest {
  sessionId: string
  duration: number 
  totalWeight?: number 
  setsCompleted: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autenticado" },
        { status: 401 }
      )
    }

    const { sessionId, duration, totalWeight = 0, setsCompleted }: UpdateStatsRequest = await request.json()

    await client.connect()
    const db = client.db()
    const users = db.collection("users")
    const trainingSessions = db.collection("training_sessions")

    const trainingSession = await trainingSessions.findOne({
      _id: new ObjectId(sessionId),
      userId: session.user.id
    })

    if (!trainingSession) {
      return NextResponse.json(
        { message: "Sesión de entrenamiento no encontrada" },
        { status: 404 }
      )
    }

    if (trainingSession.isActive) {
      return NextResponse.json(
        { message: "La sesión aún está activa" },
        { status: 400 }
      )
    }

    const user = await users.findOne({ _id: new ObjectId(session.user.id) })

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    const currentStats = user.stats || {
      totalWorkouts: 0,
      totalTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      totalWeight: 0,
      setsCompleted: 0
    }

    const newStats = {
      totalWorkouts: currentStats.totalWorkouts + 1,
      totalTime: currentStats.totalTime + duration,
      totalWeight: (currentStats.totalWeight || 0) + totalWeight,
      setsCompleted: (currentStats.setsCompleted || 0) + setsCompleted,
      currentStreak: calculateNewStreak(user, trainingSession.endTime || trainingSession.updatedAt),
      longestStreak: Math.max(currentStats.longestStreak || 0, calculateNewStreak(user, trainingSession.endTime || trainingSession.updatedAt)),
      achievements: currentStats.achievements || []
    }

    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          stats: newStats,
          updatedAt: new Date()
        }
      }
    )

    const userStatsForAchievements: UserStats = {
      totalWorkouts: newStats.totalWorkouts,
      currentStreak: newStats.currentStreak,
      longestStreak: newStats.longestStreak,
      totalTime: newStats.totalTime,
      totalWeight: newStats.totalWeight
    }

    const newAchievements = checkAchievements(userStatsForAchievements, newStats.achievements)

    if (newAchievements.length > 0) {
      const updatedAchievements = [...newStats.achievements, ...newAchievements]
      
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
        stats: { ...newStats, achievements: updatedAchievements },
        newAchievements,
        message: `Estadísticas actualizadas. ¡${newAchievements.length} nuevo(s) logro(s) desbloqueado(s)!`
      })
    }

    return NextResponse.json({
      stats: newStats,
      newAchievements: [],
      message: "Estadísticas actualizadas correctamente"
    })

  } catch (error) {
    console.error("Error actualizando estadísticas:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}


function calculateNewStreak(user: any, lastWorkoutDate: Date): number {
  const now = new Date()
  const lastWorkout = new Date(lastWorkoutDate)
  const daysDifference = Math.floor((now.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDifference > 1) {
    return 1 
  }
  
  return (user.stats?.currentStreak || 0) + 1
} 
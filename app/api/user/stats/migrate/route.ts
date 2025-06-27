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
    const trainingSessions = db.collection("training_sessions")

    const completedSessions = await trainingSessions.find({
      userId: session.user.id,
      isActive: false,
      endTime: { $exists: true }
    }).toArray()

    console.log(`Encontradas ${completedSessions.length} sesiones completadas para migrar`)

    let totalWorkouts = 0
    let totalTime = 0 
    let totalWeight = 0
    let totalSetsCompleted = 0
    let currentStreak = 0
    let longestStreak = 0

    const sessionDates: Date[] = []
    
    for (const trainingSession of completedSessions) {
      totalWorkouts++
      
      const startTime = new Date(trainingSession.startTime)
      const endTime = new Date(trainingSession.endTime)
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)) 
      totalTime += duration

      let sessionWeight = 0
      let sessionSets = 0

      if (trainingSession.exercises) {
        trainingSession.exercises.forEach((exercise: any) => {
          if (exercise.sets) {
            exercise.sets.forEach((set: any) => {
              if (set.completed) {
                sessionSets++
                if (set.weight && set.reps) {
                  sessionWeight += set.weight * set.reps
                }
              }
            })
          }
        })
      }

      totalWeight += sessionWeight
      totalSetsCompleted += sessionSets
      sessionDates.push(endTime)
    }

    if (sessionDates.length > 0) {
      const workoutDays = new Set<string>()
      sessionDates.forEach(date => {
        const dayString = date.toISOString().split('T')[0]
        workoutDays.add(dayString)
      })
      
      const uniqueDays = Array.from(workoutDays).sort().reverse()
      
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      
      currentStreak = 0
      let checkDate = new Date(today)
      
      while (true) {
        const checkDateString = checkDate.toISOString().split('T')[0]
        
        if (workoutDays.has(checkDateString)) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          if (currentStreak === 0) {
            checkDate.setDate(checkDate.getDate() - 1)
            const yesterdayString = checkDate.toISOString().split('T')[0]
            if (workoutDays.has(yesterdayString)) {
              currentStreak = 1
              checkDate.setDate(checkDate.getDate() - 1)
              continue
            }
          }
          break
        }
      }
      
      longestStreak = 0
      let tempStreak = 0
      
      const firstWorkoutDate = new Date(Math.min(...sessionDates.map(d => d.getTime())))
      const daysBetween = Math.ceil((today.getTime() - firstWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))
      
      for (let i = 0; i <= daysBetween; i++) {
        const currentDate = new Date(firstWorkoutDate)
        currentDate.setDate(firstWorkoutDate.getDate() + i)
        const currentDateString = currentDate.toISOString().split('T')[0]
        
        if (workoutDays.has(currentDateString)) {
          tempStreak++
          longestStreak = Math.max(longestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }
      
    }

    const newStats = {
      totalWorkouts,
      totalTime,
      totalWeight,
      setsCompleted: totalSetsCompleted,
      currentStreak,
      longestStreak,
      achievements: [] as string[] 
    }

    console.log('Nuevas estadísticas calculadas:', newStats)

    const userStatsForAchievements: UserStats = {
      totalWorkouts: newStats.totalWorkouts,
      currentStreak: newStats.currentStreak,
      longestStreak: newStats.longestStreak,
      totalTime: newStats.totalTime,
      totalWeight: newStats.totalWeight
    }

    const achievedIds = checkAchievements(userStatsForAchievements, [])
    newStats.achievements = achievedIds

    console.log('Logros calculados:', achievedIds)

    const result = await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          stats: newStats,
          updatedAt: new Date()
        }
      }
    )

    console.log('Resultado de la actualización:', result)

    return NextResponse.json({
      message: "Estadísticas migradas correctamente",
      stats: newStats,
      sessionsProcessed: completedSessions.length,
      newAchievements: achievedIds
    })

  } catch (error) {
    console.error("Error migrando estadísticas:", error)
    return NextResponse.json(
      { message: "Error interno del servidor", error: error },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
} 
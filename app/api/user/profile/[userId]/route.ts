import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { TrainingSession } from "@/lib/mongosee"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const db = await getDb()
    
    const { userId } = await params
    
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "ID de usuario inválido" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }
    
    const session = await auth()
    const currentUserId = session?.user?.id

    
    const isPublic = user.profile?.isPublic === true
    const isOwner = currentUserId && currentUserId === userId
    
    if (!isPublic && !isOwner) {
      console.log('ACCESO DENEGADO: Perfil privado y usuario no es propietario')
      return NextResponse.json(
        { error: "Este perfil es privado" },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }
    
    const sessions = await db.collection<TrainingSession>('training_sessions').find({ 
      userId: userId,
      isActive: false,
      endTime: { $exists: true }
    }).toArray()
    
    const totalSets = sessions.reduce((acc: number, session) => {
      return acc + session.exercises.reduce((setAcc: number, exercise: any) => {
        return setAcc + exercise.sets.filter((set: any) => set.completed).length
      }, 0)
    }, 0)
    
    const totalWeight = sessions.reduce((acc: number, session) => {
      return acc + session.exercises.reduce((weightAcc: number, exercise: any) => {
        return weightAcc + exercise.sets
          .filter((set: any) => set.completed)
          .reduce((setWeightAcc: number, set: any) => {
            return setWeightAcc + ((set.weight || 0) * (set.reps || 0))
          }, 0)
      }, 0)
    }, 0)
    
    const publicProfile = {
      _id: user._id,
      name: user.name,
      image: user.image,
      profile: {
        fitnessLevel: user.profile?.fitnessLevel,
        isPublic: user.profile?.isPublic
      },
      stats: {
        totalWorkouts: user.stats?.totalWorkouts || 0,
        totalTime: user.stats?.totalTime || 0,
        currentStreak: user.stats?.currentStreak || 0,
        longestStreak: user.stats?.longestStreak || 0,
        achievements: user.stats?.achievements || [],
        totalWeight: user.stats?.totalWeight || totalWeight,
        setsCompleted: user.stats?.setsCompleted || totalSets,
        workoutsThisWeek: user.stats?.workoutsThisWeek || 0,
        workoutsThisMonth: user.stats?.workoutsThisMonth || 0
      },
      createdAt: user.createdAt,
      isOwner 
    }
    
    return NextResponse.json(publicProfile, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate' 
      }
    })
    
  } catch (error) {
    console.error("Error obteniendo perfil público:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
} 
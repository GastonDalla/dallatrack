import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { SharedRoutine, toClientFormat } from '@/lib/mongosee'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function generateUniqueShareCode(db: any): Promise<string> {
  let code: string
  let exists = true
  
  while (exists) {
    code = generateShareCode()
    const existing = await db.collection('sharedRoutines').findOne({ shareCode: code })
    exists = !!existing
  }
  
  return code!
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const body = await request.json()

    const { routineId, maxUses, expiresIn } = body

    if (!routineId) {
      return NextResponse.json({ 
        error: 'ID de rutina requerido' 
      }, { status: 400 })
    }

    const routine = await db.collection('routines')
      .findOne({ _id: new ObjectId(routineId), userId })

    if (!routine) {
      return NextResponse.json({ 
        error: 'Rutina no encontrada' 
      }, { status: 404 })
    }

    if (routine.isSharedRoutine === true) {
      return NextResponse.json({ 
        error: 'No puedes compartir una rutina que fue agregada desde otra rutina compartida. Solo puedes compartir rutinas que creaste originalmente.' 
      }, { status: 403 })
    }

    const exerciseIds = routine.exercises.map((ex: any) => new ObjectId(ex.exerciseId))
    const exercises = await db.collection('exercises')
      .find({ _id: { $in: exerciseIds } })
      .toArray()

    const exerciseMap = new Map(exercises.map(ex => [ex._id.toString(), ex]))

    const sharedExercises = routine.exercises.map((routineEx: any) => {
      const exercise = exerciseMap.get(routineEx.exerciseId)
      return {
        exerciseId: routineEx.exerciseId,
        exerciseName: exercise?.title || 'Ejercicio desconocido',
        sets: routineEx.sets,
        reps: routineEx.reps,
        weight: routineEx.weight,
        restTime: routineEx.restTime,
        notes: routineEx.notes,
        order: routineEx.order,
        muscleGroups: exercise?.muscleGroups || [],
        equipment: exercise?.equipment || [],
        instructions: exercise?.instructions || []
      }
    })

    const shareCode = await generateUniqueShareCode(db)

    let expiresAt: Date | undefined
    if (expiresIn) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresIn)
    }

    const now = new Date()
    const sharedRoutineData: Omit<SharedRoutine, '_id' | 'id'> = {
      routineId: routine._id.toString(),
      userId,
      shareCode,
      title: routine.title,
      description: routine.description,
      difficulty: routine.difficulty,
      estimatedDuration: routine.estimatedDuration,
      targetMuscleGroups: routine.targetMuscleGroups,
      exercises: sharedExercises,
      isActive: true,
      maxUses,
      currentUses: 0,
      expiresAt,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.collection<SharedRoutine>('sharedRoutines')
      .insertOne(sharedRoutineData)
    
    const sharedRoutine = toClientFormat({
      ...sharedRoutineData,
      _id: result.insertedId
    })

    const baseUrl = process.env.AUTH_URL || 
                   (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://dallatrack.vercel.app')
    
    return NextResponse.json({ 
      sharedRoutine,
      shareUrl: `${baseUrl}/dashboard/routines/share/${shareCode}`
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating shared routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()

    const sharedRoutines = await db.collection<SharedRoutine>('sharedRoutines')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()

    const sharedRoutinesWithId = sharedRoutines.map(routine => toClientFormat(routine))

    return NextResponse.json({ sharedRoutines: sharedRoutinesWithId })

  } catch (error) {
    console.error('Error fetching shared routines:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
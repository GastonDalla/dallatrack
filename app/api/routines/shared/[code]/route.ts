import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { SharedRoutine, RoutineUsage, Routine, toClientFormat } from '@/lib/mongosee'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

interface RouteParams {
  params: Promise<{ code: string }>
}

export async function GET(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const { code } = await params
    const db = await getDb()

    const sharedRoutine = await db.collection<SharedRoutine>('sharedRoutines')
      .findOne({ shareCode: code.toUpperCase(), isActive: true })

    if (!sharedRoutine) {
      return NextResponse.json({ 
        error: 'Código de rutina no válido o expirado' 
      }, { status: 404 })
    }

    if (sharedRoutine.expiresAt && new Date() > sharedRoutine.expiresAt) {
      return NextResponse.json({ 
        error: 'Este código de rutina ha expirado' 
      }, { status: 410 })
    }

    if (sharedRoutine.maxUses && sharedRoutine.currentUses >= sharedRoutine.maxUses) {
      return NextResponse.json({ 
        error: 'Este código de rutina ha alcanzado su límite de usos' 
      }, { status: 410 })
    }

    const sharer = await db.collection('users')
      .findOne({ _id: new ObjectId(sharedRoutine.userId) })

    const sharedRoutineWithId = toClientFormat(sharedRoutine)

    return NextResponse.json({ 
      sharedRoutine: sharedRoutineWithId,
      sharedBy: {
        name: sharer?.name || 'Usuario desconocido',
        email: sharer?.email
      }
    })

  } catch (error) {
    console.error('Error fetching shared routine:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const userId = await requireAuth(request)
    const { code } = await params
    const db = await getDb()

    const sharedRoutine = await db.collection<SharedRoutine>('sharedRoutines')
      .findOne({ shareCode: code.toUpperCase(), isActive: true })

    if (!sharedRoutine) {
      return NextResponse.json({ 
        error: 'Código de rutina no válido o expirado' 
      }, { status: 404 })
    }

    if (sharedRoutine.expiresAt && new Date() > sharedRoutine.expiresAt) {
      return NextResponse.json({ 
        error: 'Este código de rutina ha expirado' 
      }, { status: 410 })
    }

    if (sharedRoutine.maxUses && sharedRoutine.currentUses >= sharedRoutine.maxUses) {
      return NextResponse.json({ 
        error: 'Este código de rutina ha alcanzado su límite de usos' 
      }, { status: 410 })
    }

    if (sharedRoutine.userId === userId) {
      return NextResponse.json({ 
        error: 'No puedes agregar tu propia rutina compartida' 
      }, { status: 400 })
    }

    const existingRoutine = await db.collection('routines')
      .findOne({ 
        userId, 
        $or: [
          { originalShareCode: sharedRoutine.shareCode },
          { title: `${sharedRoutine.title} (Compartida)` }
        ]
      })

    if (existingRoutine) {
      return NextResponse.json({ 
        error: 'Ya tienes esta rutina en tu lista. No puedes agregar la misma rutina compartida dos veces.' 
      }, { status: 409 })
    }

    const now = new Date()
    const newRoutineData: Omit<Routine, '_id' | 'id'> = {
      userId,
      title: `${sharedRoutine.title} (Compartida)`,
      description: `${sharedRoutine.description || ''}\n\n📤 Rutina compartida por otro usuario`,
      estimatedDuration: sharedRoutine.estimatedDuration,
      difficulty: sharedRoutine.difficulty,
      targetMuscleGroups: sharedRoutine.targetMuscleGroups,
      timesPerformed: 0,
      isSharedRoutine: true,
      originalShareCode: sharedRoutine.shareCode,
      createdAt: now,
      updatedAt: now,
      exercises: sharedRoutine.exercises.map((ex, index) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        restTime: ex.restTime,
        notes: ex.notes,
        order: ex.order
      }))
    }

    const routineResult = await db.collection<Routine>('routines')
      .insertOne(newRoutineData)

    const user = await db.collection('users')
      .findOne({ _id: new ObjectId(userId) })

    const usageData: Omit<RoutineUsage, '_id' | 'id'> = {
      sharedRoutineId: sharedRoutine._id!.toString(),
      shareCode: sharedRoutine.shareCode,
      usedById: userId,
      usedByName: user?.name,
      usedByEmail: user?.email,
      routineTitle: sharedRoutine.title,
      usedAt: now,
      addedToRoutines: true,
      createdAt: now
    }

    await db.collection<RoutineUsage>('routineUsages').insertOne(usageData)

    await db.collection('sharedRoutines').updateOne(
      { _id: sharedRoutine._id },
      { 
        $inc: { currentUses: 1 },
        $set: { updatedAt: now }
      }
    )

    const newRoutine = toClientFormat({
      ...newRoutineData,
      _id: routineResult.insertedId
    })

    return NextResponse.json({ 
      routine: newRoutine,
      message: 'Rutina agregada exitosamente a tus rutinas'
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding shared routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
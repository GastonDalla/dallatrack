import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { Routine, RoutineExercise } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const body = await request.json()

    const { id } = await params

    const {
      exerciseId,
      sets = 3,
      reps = "8-12",
      weight,
      restTime = 90,
      notes,
      order
    } = body

    const routine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!routine) {
      return NextResponse.json({ 
        error: 'Rutina no encontrada' 
      }, { status: 404 })
    }

    const exercise = await db.collection('exercises').findOne({
      _id: new ObjectId(exerciseId),
      userId
    })

    if (!exercise) {
      return NextResponse.json({ 
        error: 'Ejercicio no encontrado' 
      }, { status: 404 })
    }

    const exerciseExists = routine.exercises.some(ex => ex.exerciseId === exerciseId)
    if (exerciseExists) {
      return NextResponse.json({ 
        error: 'El ejercicio ya está en la rutina' 
      }, { status: 400 })
    }

    const newExercise = {
      id: new ObjectId().toString(),
      exerciseId,
      routineId: id,
      order: order || routine.exercises.length + 1,
      sets: Array.from({ length: sets }, (_, i) => ({
        id: new ObjectId().toString(),
        routineExerciseId: '',
        setNumber: i + 1,
        targetReps: parseInt(reps) || 10,
        targetWeight: weight || 0
      }))
    }

    const result = await db.collection('routines').updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { exercises: newExercise } as any,
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        error: 'No se pudo agregar el ejercicio' 
      }, { status: 500 })
    }

    const updatedRoutine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id)
    })

    return NextResponse.json({ 
      routine: { ...updatedRoutine, id: updatedRoutine?._id.toString() }
    })

  } catch (error) {
    console.error('Error adding exercise to routine:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
} 
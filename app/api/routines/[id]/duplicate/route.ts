import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { Routine } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await requireAuth(request)
    const db = await getDb()

    const originalRoutine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!originalRoutine) {
      return NextResponse.json({ 
        error: 'Rutina no encontrada' 
      }, { status: 404 })
    }

    const now = new Date()
    const duplicatedRoutine = {
      ...originalRoutine,
      _id: new ObjectId(),
      title: `${originalRoutine.title} (Copia)`,
      createdAt: now,
      updatedAt: now,
      timesPerformed: 0,
      lastPerformed: undefined,
      averageRating: undefined,
      exercises: originalRoutine.exercises.map(exercise => {
        const newExercise = {
          ...exercise,
          id: new ObjectId().toString()
        };

        if (Array.isArray(exercise.sets)) {
          newExercise.sets = exercise.sets.map(set => ({
            ...set,
            id: new ObjectId().toString(),
            routineExerciseId: new ObjectId().toString()
          }));
        } else {
          newExercise.sets = exercise.sets;
        }

        return newExercise;
      })
    }

    const result = await db.collection('routines').insertOne(duplicatedRoutine)

    if (!result.insertedId) {
      return NextResponse.json({ 
        error: 'No se pudo duplicar la rutina' 
      }, { status: 500 })
    }

    const newRoutine = await db.collection<Routine>('routines').findOne({
      _id: result.insertedId
    })

    return NextResponse.json({ 
      routine: { ...newRoutine, id: newRoutine?._id.toString() }
    })

  } catch (error) {
    console.error('Error duplicating routine:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { TrainingSession, Exercise, toClientFormat } from '@/lib/mongosee'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const { id } = await params
    const body = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de sesión inválido' }, { status: 400 })
    }

    const { exerciseId } = body

    if (!exerciseId) {
      return NextResponse.json({ error: 'ID de ejercicio requerido' }, { status: 400 })
    }

    const session = await db.collection<TrainingSession>('training_sessions').findOne({
      _id: new ObjectId(id),
      userId,
      isActive: true
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada o no activa' }, { status: 404 })
    }

    const exercise = await db.collection<Exercise>('exercises').findOne({
      _id: new ObjectId(exerciseId),
      userId
    })

    if (!exercise) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }

    const newExercise = {
      exerciseId,
      exerciseName: exercise.title,
      targetSets: exercise.defaultSets || 3,
      targetReps: "8-12",
      targetWeight: 0,
      restTime: 90,
      notes: "",
      muscleGroups: exercise.muscleGroups || [],
      order: session.exercises.length + 1,
      sets: Array.from({ length: exercise.defaultSets || 3 }, (_, setIndex) => ({
        id: `set-${Date.now()}-${setIndex}`,
        setNumber: setIndex + 1,
        reps: undefined,
        weight: undefined,
        completed: false,
        notes: undefined,
        startTime: undefined,
        endTime: undefined
      }))
    }

    const result = await db.collection<TrainingSession>('training_sessions').updateOne(
      { _id: new ObjectId(id), userId },
      { 
        $push: { exercises: newExercise as any },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'No se pudo actualizar la sesión' }, { status: 500 })
    }

    const updatedSession = await db.collection<TrainingSession>('training_sessions').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!updatedSession) {
      return NextResponse.json({ error: 'Error al obtener sesión actualizada' }, { status: 500 })
    }

    return NextResponse.json({ 
      session: toClientFormat(updatedSession),
      message: 'Ejercicio agregado exitosamente'
    })
  } catch (error) {
    console.error('Error adding exercise to training session:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
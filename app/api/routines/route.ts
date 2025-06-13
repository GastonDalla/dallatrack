import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { Routine, toClientFormat } from '@/lib/mongosee'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const difficulty = url.searchParams.get('difficulty')
    const muscleGroup = url.searchParams.get('muscleGroup')

    const query: any = { userId }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty
    }

    if (muscleGroup && muscleGroup !== 'all') {
      query.targetMuscleGroups = { $in: [muscleGroup] }
    }

    const routines = await db.collection<Routine>('routines')
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray()

    const routinesWithId = await Promise.all(
      routines.map(async (routine) => {
        const routineWithId = toClientFormat(routine)
        
        const exerciseIds = routine.exercises.map(ex => new ObjectId(ex.exerciseId))
        const exercises = await db.collection('exercises')
          .find({ _id: { $in: exerciseIds } })
          .toArray()

        const exerciseMap = new Map(exercises.map(ex => [ex._id.toString(), ex]))
        
        routineWithId.exercises = routine.exercises.map(routineEx => ({
          ...routineEx,
          exercise: exerciseMap.get(routineEx.exerciseId) || null
        }))

        return routineWithId
      })
    )

    return NextResponse.json({ routines: routinesWithId })
  } catch (error) {
    console.error('Error fetching routines:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const body = await request.json()

    const {
      title,
      description,
      estimatedDuration,
      difficulty,
      exercises
    } = body

    if (!title || !difficulty || !exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ 
        error: 'Campos requeridos: title, difficulty, exercises (array)' 
      }, { status: 400 })
    }

    const exerciseIds = exercises.map((ex: any) => new ObjectId(ex.exerciseId))
    const existingExercises = await db.collection('exercises')
      .find({ 
        _id: { $in: exerciseIds },
        userId 
      })
      .toArray()

    if (existingExercises.length !== exerciseIds.length) {
      return NextResponse.json({ 
        error: 'Uno o más ejercicios no existen' 
      }, { status: 400 })
    }

    const targetMuscleGroups = Array.from(new Set(
      existingExercises.flatMap((ex: any) => ex.muscleGroups)
    ))

    const now = new Date()
    const routineData: Omit<Routine, '_id' | 'id'> = {
      userId,
      title,
      description: description || '',
      estimatedDuration: estimatedDuration || 60,
      difficulty,
      targetMuscleGroups,
      timesPerformed: 0,
      createdAt: now,
      updatedAt: now,
      exercises: exercises.map((ex: any, index: number) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets || 3,
        reps: ex.reps || '8-12',
        weight: ex.weight || undefined,
        restTime: ex.restTime || 90,
        notes: ex.notes || undefined,
        order: index + 1
      }))
    }

    const result = await db.collection<Routine>('routines').insertOne(routineData)
    
    const routine = {
      ...routineData,
      id: result.insertedId.toString()
    }

    return NextResponse.json({ routine }, { status: 201 })
  } catch (error) {
    console.error('Error creating routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
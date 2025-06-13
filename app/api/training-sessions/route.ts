import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { TrainingSession, Routine, toClientFormat } from '@/lib/mongosee'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    
    const url = new URL(request.url)
    const status = url.searchParams.get('status') 
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const query: any = { userId }

    if (status === 'active') {
      query.isActive = true
    } else if (status === 'completed') {
      query.isActive = false
    }

    const sessions = await db.collection<TrainingSession>('training_sessions')
      .find(query)
      .sort({ startTime: -1 })
      .limit(limit)
      .toArray()

    const sessionsWithId = await Promise.all(
      sessions.map(async (session) => {
        const sessionWithId = toClientFormat(session)
        
        if (session.routineId) {
          const routine = await db.collection<Routine>('routines').findOne({
            _id: new ObjectId(session.routineId),
            userId
          })
          if (routine) {
            sessionWithId.routine = toClientFormat(routine)
          }
        }

        return sessionWithId
      })
    )

    return NextResponse.json({ sessions: sessionsWithId })
  } catch (error) {
    console.error('Error fetching training sessions:', error)
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
      routineId,
      exercises
    } = body

    if (!exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ 
        error: 'Ejercicios requeridos (array)' 
      }, { status: 400 })
    }

    const now = new Date()
    let routineName = undefined

    if (routineId) {
      const routine = await db.collection<Routine>('routines').findOne({
        _id: new ObjectId(routineId),
        userId
      })
      if (routine) {
        routineName = routine.title
        await db.collection('routines').updateOne(
          { _id: new ObjectId(routineId) },
          { 
            $inc: { timesPerformed: 1 },
            $set: { lastPerformed: now }
          }
        )
      }
    }

    const sessionData: Omit<TrainingSession, '_id' | 'id'> = {
      userId,
      routineId: routineId || undefined,
      routineName,
      startTime: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      exercises: exercises.map((ex: any, index: number) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName || '',
        targetSets: ex.targetSets || 3,
        targetReps: ex.targetReps || '8-12',
        targetWeight: ex.targetWeight || undefined,
        restTime: ex.restTime || 90,
        notes: ex.notes || undefined,
        order: index + 1,
        muscleGroups: ex.muscleGroups || [],
        sets: Array.from({ length: ex.targetSets || 3 }, (_, setIndex) => ({
          id: `set-${Date.now()}-${index}-${setIndex}`,
          setNumber: setIndex + 1,
          reps: undefined,
          weight: undefined,
          completed: false,
          notes: undefined,
          startTime: undefined,
          endTime: undefined
        }))
      }))
    }

    const result = await db.collection<TrainingSession>('training_sessions').insertOne(sessionData)
    
    const session = {
      ...sessionData,
      id: result.insertedId.toString()
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating training session:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
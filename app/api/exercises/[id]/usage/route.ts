import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de ejercicio inválido' }, { status: 400 })
    }

    const exercise = await db.collection('exercises').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!exercise) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }

    const sessions = await db.collection('training_sessions').find({
      userId,
      'exercises.exerciseId': id,
      endTime: { $exists: true }
    }).toArray()

    let usageCount = 0
    let totalSets = 0
    let totalReps = 0
    let totalWeightSum = 0
    let totalWeightedSets = 0 
    let lastUsed: string | undefined = undefined
    let bestSet: { weight: number; reps: number; date: string } | undefined = undefined
    let maxScore = 0 

    for (const session of sessions) {
      let sessionHasExercise = false
      
      for (const sessionExercise of session.exercises) {
        if (sessionExercise.exerciseId === id) {
          sessionHasExercise = true
      
          const completedSets = sessionExercise.sets.filter((set: any) => set.completed)
          totalSets += completedSets.length
          
          for (const set of completedSets) {
            const setReps = set.reps || 0
            const setWeight = set.weight || 0
            
            totalReps += setReps
            
            if (setWeight > 0) {
              totalWeightSum += setWeight
              totalWeightedSets++
            }
            
            const setScore = setWeight * setReps
            if (setScore > maxScore && setWeight > 0 && setReps > 0) {
              maxScore = setScore
              bestSet = {
                weight: setWeight,
                reps: setReps,
                date: session.endTime
              }
            }
          }
        }
      }
      
      if (sessionHasExercise) {
        usageCount++
        
        if (!lastUsed || new Date(session.endTime) > new Date(lastUsed)) {
          lastUsed = session.endTime
        }
      }
    }

    const averageWeight = totalWeightedSets > 0 ? totalWeightSum / totalWeightedSets : 0

    await db.collection('exercises').updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { usageCount } }
    )

    return NextResponse.json({
      usageCount,
      lastUsed,
      totalSets,
      totalReps,
      averageWeight: Math.round(averageWeight * 100) / 100, 
      bestSet
    })

  } catch (error) {
    console.error('Error fetching exercise usage stats:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
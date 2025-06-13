import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { TrainingSession, toClientFormat } from '@/lib/mongosee'
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

    const { exerciseIndex, action } = body

    if (typeof exerciseIndex !== 'number' || !action) {
      return NextResponse.json({ 
        error: 'exerciseIndex (número) y action requeridos' 
      }, { status: 400 })
    }

    const session = await db.collection<TrainingSession>('training_sessions').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    if (!session.isActive) {
      return NextResponse.json({ 
        error: 'No se pueden modificar sets en una sesión inactiva' 
      }, { status: 400 })
    }

    const exercises = [...session.exercises]
    
    if (exerciseIndex < 0 || exerciseIndex >= exercises.length) {
      return NextResponse.json({ error: 'Índice de ejercicio inválido' }, { status: 400 })
    }

    const exercise = { ...exercises[exerciseIndex] }

    if (action === 'add') {
      const newSetNumber = exercise.sets.length + 1
      const newSet = {
        id: `set-${Date.now()}-${exerciseIndex}-${newSetNumber}`,
        setNumber: newSetNumber,
        reps: undefined,
        weight: undefined,
        completed: false,
        notes: undefined,
        startTime: undefined,
        endTime: undefined
      }
      
      exercise.sets = [...exercise.sets, newSet]
      exercises[exerciseIndex] = exercise

      await db.collection<TrainingSession>('training_sessions').updateOne(
        { _id: new ObjectId(id), userId },
        { 
          $set: { 
            exercises,
            updatedAt: new Date()
          }
        }
      )

      const updatedSession = await db.collection<TrainingSession>('training_sessions').findOne({
        _id: new ObjectId(id),
        userId
      })

      return NextResponse.json({ 
        session: toClientFormat(updatedSession!),
        message: 'Set añadido exitosamente'
      })

    } else if (action === 'delete') {
      const { setIndex } = body

      if (typeof setIndex !== 'number') {
        return NextResponse.json({ 
          error: 'setIndex requerido para eliminar' 
        }, { status: 400 })
      }

      if (setIndex < 0 || setIndex >= exercise.sets.length) {
        return NextResponse.json({ error: 'Índice de set inválido' }, { status: 400 })
      }

      if (exercise.sets.length <= 1) {
        return NextResponse.json({ 
          error: 'No se puede eliminar el último set del ejercicio' 
        }, { status: 400 })
      }

      if (exercise.sets[setIndex].completed) {
        return NextResponse.json({ 
          error: 'No se puede eliminar un set ya completado' 
        }, { status: 400 })
      }

      const currentExerciseIndex = (session as any).currentExerciseIndex || 0
      const currentSetIndex = (session as any).currentSetIndex || 0
      
      if (exerciseIndex === currentExerciseIndex && setIndex === currentSetIndex) {
        return NextResponse.json({ 
          error: 'No se puede eliminar el set actual. Solo puedes eliminar sets pendientes.' 
        }, { status: 400 })
      }

      exercise.sets.splice(setIndex, 1)

      exercise.sets = exercise.sets.map((set, index) => ({
        ...set,
        setNumber: index + 1
      }))

      exercises[exerciseIndex] = exercise

      let updateData: any = {
        exercises,
        updatedAt: new Date()
      }

      if (exerciseIndex === currentExerciseIndex && setIndex <= currentSetIndex) {
        updateData.currentSetIndex = Math.max(0, currentSetIndex - 1)
      }

      await db.collection<TrainingSession>('training_sessions').updateOne(
        { _id: new ObjectId(id), userId },
        { $set: updateData }
      )

      const updatedSession = await db.collection<TrainingSession>('training_sessions').findOne({
        _id: new ObjectId(id),
        userId
      })

      return NextResponse.json({ 
        session: toClientFormat(updatedSession!),
        message: 'Set eliminado exitosamente'
      })

    } else {
      return NextResponse.json({ 
        error: 'Acción no válida. Use "add" o "delete"' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing sets:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { Routine, toClientFormat } from '@/lib/mongosee'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

function getUserId(request: NextRequest): string {
  return "user-1" 
}

function calculateEstimatedDuration(exercises: any[]): number {
  if (!exercises || exercises.length === 0) return 60; 
  
  let totalMinutes = 0;
  
  exercises.forEach(exercise => {
    let setsCount = 0;
    if (Array.isArray(exercise.setsData)) {
      setsCount = exercise.setsData.length;
    } else if (typeof exercise.sets === 'number') {
      setsCount = exercise.sets;
    } else {
      setsCount = 3; 
    }
    
    const timePerSet = 1.5;
    const setsTime = setsCount * timePerSet;
    
    const restTime = (exercise.restTime || 90) / 60; 
    const totalRestTime = Math.max(0, setsCount - 1) * restTime; 
    
    const exerciseTime = setsTime + totalRestTime;
    totalMinutes += exerciseTime;
  });
  
  totalMinutes += 8;
  
  return Math.round(totalMinutes);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de rutina inválido' }, { status: 400 })
    }

    const routine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!routine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 })
    }

    const sessions = await db.collection('training_sessions').find({
      userId,
      routineId: id,
      endTime: { $exists: true }, 
      rating: { $exists: true, $ne: null } 
    }).toArray()

    let averageRating = 0
    let timesPerformed = 0
    let lastPerformed: Date | undefined = undefined
    let recentRatings: Array<{ rating: number; date: string; notes?: string }> = []

    if (sessions.length > 0) {
      const totalRating = sessions.reduce((sum, session) => sum + (session.rating || 0), 0)
      averageRating = Math.round((totalRating / sessions.length) * 10) / 10 

      recentRatings = sessions
        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
        .slice(0, 5)
        .map(session => ({
          rating: session.rating,
          date: session.endTime,
          notes: session.notes || undefined
        }))

      const allCompletedSessions = await db.collection('training_sessions').find({
        userId,
        routineId: id,
        endTime: { $exists: true }
      }).toArray()

      timesPerformed = allCompletedSessions.length

      if (allCompletedSessions.length > 0) {
        lastPerformed = allCompletedSessions
          .map(s => new Date(s.endTime))
          .sort((a, b) => b.getTime() - a.getTime())[0]
      }

      await db.collection('routines').updateOne(
        { _id: new ObjectId(id), userId },
        { 
          $set: { 
            averageRating,
            timesPerformed,
            lastPerformed,
            updatedAt: new Date()
          }
        }
      )
    }

    const exerciseIds = routine.exercises.map(ex => new ObjectId(ex.exerciseId))
    const exercises = await db.collection('exercises')
      .find({ _id: { $in: exerciseIds } })
      .toArray()

    const exerciseMap = new Map(exercises.map(ex => [ex._id.toString(), ex]))
    
    const routineWithId = toClientFormat(routine)
    routineWithId.exercises = routine.exercises.map(routineEx => ({
      ...routineEx,
      exercise: exerciseMap.get(routineEx.exerciseId) || null
    }))

    const routineWithStats = {
      ...routineWithId,
      averageRating: averageRating || 0,
      timesPerformed: timesPerformed || 0,
      lastPerformed: lastPerformed || null,
      recentRatings
    }

    return NextResponse.json({ routine: routineWithStats })
  } catch (error) {
    console.error('Error fetching routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const { id } = await params
    const body = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de rutina inválido' }, { status: 400 })
    }

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

    const updateData = {
      title,
      description: description || '',
      estimatedDuration: calculateEstimatedDuration(exercises.map((ex: any) => ({
        setsData: Array.isArray(ex.sets) ? ex.sets : [],
        sets: typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : 3),
        restTime: ex.restTime || 90
      }))),
      difficulty,
      targetMuscleGroups,
      updatedAt: new Date(),
      exercises: exercises.map((ex: any, index: number) => {

        let processedSets = []
        
        if (Array.isArray(ex.sets) && ex.sets.length > 0) {
          processedSets = ex.sets.map((set: any, setIndex: number) => ({
            id: set.id || `set-${ex.id}-${setIndex}`,
            routineExerciseId: ex.id,
            setNumber: set.setNumber || setIndex + 1,
            targetReps: set.targetReps || "10", 
            targetWeight: set.targetWeight || 0
          }))
        } else if (typeof ex.sets === 'number') {
          const setCount = ex.sets || 3
          const reps = ex.reps || "10" 
          const weight = parseFloat(ex.weight) || 0
          
          processedSets = Array.from({ length: setCount }, (_, setIndex) => ({
            id: `set-${ex.id}-${setIndex}`,
            routineExerciseId: ex.id,
            setNumber: setIndex + 1,
            targetReps: reps, 
            targetWeight: weight
          }))
        } else {
          processedSets = Array.from({ length: 3 }, (_, setIndex) => ({
            id: `set-${ex.id}-${setIndex}`,
            routineExerciseId: ex.id,
            setNumber: setIndex + 1,
            targetReps: "10",
            targetWeight: 0
          }))
        }

        const setCount = processedSets.length
        const firstReps = processedSets[0]?.targetReps || "10"
        const validWeights = processedSets.map((set: any) => set.targetWeight).filter((w: number) => !isNaN(w) && w > 0)
        const avgWeight = validWeights.length > 0 ? Math.round(validWeights.reduce((sum: number, w: number) => sum + w, 0) / validWeights.length * 100) / 100 : 0

        return {
          exerciseId: ex.exerciseId,
          sets: setCount,
          reps: firstReps, 
          weight: avgWeight > 0 ? avgWeight.toString() : undefined,
          restTime: ex.restTime || 90,
          notes: ex.notes || '',
          order: ex.order || index + 1,
          setsData: processedSets
        }
      })
    }

    const result = await db.collection<Routine>('routines').updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 })
    }

    const updatedRoutine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!updatedRoutine) {
      return NextResponse.json({ error: 'Error al obtener rutina actualizada' }, { status: 500 })
    }

    const updatedExerciseIds = updatedRoutine.exercises.map(ex => new ObjectId(ex.exerciseId))
    const updatedExercises = await db.collection('exercises')
      .find({ _id: { $in: updatedExerciseIds } })
      .toArray()

    const exerciseMap = new Map(updatedExercises.map(ex => [ex._id.toString(), ex]))
    
    const routineWithId = toClientFormat(updatedRoutine)
    routineWithId.exercises = updatedRoutine.exercises.map(routineEx => ({
      ...routineEx,
      exercise: exerciseMap.get(routineEx.exerciseId) || null
    }))

    return NextResponse.json({ routine: routineWithId })
  } catch (error) {
    console.error('Error updating routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de rutina inválido' }, { status: 400 })
    }

    const sessionCount = await db.collection('training_sessions').countDocuments({
      userId,
      routineId: id,
      isActive: true
    })

    if (sessionCount > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar. La rutina está siendo usada en ${sessionCount} sesión(es) activa(s).` 
      }, { status: 400 })
    }

    const result = await db.collection<Routine>('routines').deleteOne({
      _id: new ObjectId(id),
      userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Rutina eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
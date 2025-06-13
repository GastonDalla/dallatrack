import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { Exercise, toClientFormat } from '@/lib/mongosee'
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

    const exercise = await db.collection<Exercise>('exercises').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!exercise) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ exercise: toClientFormat(exercise) })
  } catch (error) {
    console.error('Error fetching exercise:', error)
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
      return NextResponse.json({ error: 'ID de ejercicio inválido' }, { status: 400 })
    }

    const {
      title,
      description,
      youtubeLink,
      defaultSets,
      muscleGroups,
      equipment,
      difficulty,
      instructions,
      tips
    } = body

    if (!title || !defaultSets || !difficulty) {
      return NextResponse.json({ 
        error: 'Campos requeridos: title, defaultSets, difficulty' 
      }, { status: 400 })
    }

    const updateData = {
      title,
      description: description || '',
      youtubeLink: youtubeLink || undefined,
      defaultSets: parseInt(defaultSets),
      muscleGroups: muscleGroups || [],
      equipment: equipment || [],
      difficulty,
      instructions: instructions || [],
      tips: tips || [],
      updatedAt: new Date()
    }

    const result = await db.collection<Exercise>('exercises').updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }

    const updatedExercise = await db.collection<Exercise>('exercises').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!updatedExercise) {
      return NextResponse.json({ error: 'Error al obtener ejercicio actualizado' }, { status: 500 })
    }

    return NextResponse.json({ exercise: toClientFormat(updatedExercise) })
  } catch (error) {
    console.error('Error updating exercise:', error)
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
      return NextResponse.json({ error: 'ID de ejercicio inválido' }, { status: 400 })
    }

    const routineCount = await db.collection('routines').countDocuments({
      userId,
      'exercises.exerciseId': id
    })

    if (routineCount > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar. El ejercicio está siendo usado en ${routineCount} rutina(s).` 
      }, { status: 400 })
    }

    const result = await db.collection<Exercise>('exercises').deleteOne({
      _id: new ObjectId(id),
      userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Ejercicio eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
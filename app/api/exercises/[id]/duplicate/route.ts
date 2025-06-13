import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { Exercise, toClientFormat } from '@/lib/mongosee'
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de ejercicio inválido' }, { status: 400 })
    }

    const originalExercise = await db.collection<Exercise>('exercises').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!originalExercise) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }

    const duplicatedExercise = {
      ...originalExercise,
      _id: new ObjectId(), 
      title: `${originalExercise.title} (Copia)`,
      usageCount: 0, 
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection<Exercise>('exercises').insertOne(duplicatedExercise)

    if (!result.insertedId) {
      return NextResponse.json({ error: 'Error al duplicar el ejercicio' }, { status: 500 })
    }

    const newExercise = await db.collection<Exercise>('exercises').findOne({
      _id: result.insertedId
    })

    if (!newExercise) {
      return NextResponse.json({ error: 'Error al obtener el ejercicio duplicado' }, { status: 500 })
    }

    return NextResponse.json({ exercise: toClientFormat(newExercise) }, { status: 201 })

  } catch (error) {
    console.error('Error duplicating exercise:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
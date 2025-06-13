import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { TrainingSession, Routine, toClientFormat } from '@/lib/mongosee'
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
      return NextResponse.json({ error: 'ID de sesión inválido' }, { status: 400 })
    }

    const session = await db.collection<TrainingSession>('training_sessions').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    let sessionWithId = toClientFormat(session)
    if (session.routineId) {
      const routine = await db.collection<Routine>('routines').findOne({
        _id: new ObjectId(session.routineId),
        userId
      })
      if (routine) {
        sessionWithId.routine = toClientFormat(routine)
      }
    }

    return NextResponse.json({ session: sessionWithId })
  } catch (error) {
    console.error('Error fetching training session:', error)
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
      return NextResponse.json({ error: 'ID de sesión inválido' }, { status: 400 })
    }

    const updateData = {
      ...body,
      updatedAt: new Date()
    }

    const result = await db.collection<TrainingSession>('training_sessions').updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    const updatedSession = await db.collection<TrainingSession>('training_sessions').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!updatedSession) {
      return NextResponse.json({ error: 'Error al obtener sesión actualizada' }, { status: 500 })
    }

    return NextResponse.json({ session: toClientFormat(updatedSession) })
  } catch (error) {
    console.error('Error updating training session:', error)
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
      return NextResponse.json({ error: 'ID de sesión inválido' }, { status: 400 })
    }

    const result = await db.collection<TrainingSession>('training_sessions').deleteOne({
      _id: new ObjectId(id),
      userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Sesión eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting training session:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
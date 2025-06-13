import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const db = await getDb()
    const body = await request.json()

    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        error: 'isActive debe ser un booleano' 
      }, { status: 400 })
    }

    const sharedRoutine = await db.collection('sharedRoutines')
      .findOne({ _id: new ObjectId(id), userId })

    if (!sharedRoutine) {
      return NextResponse.json({ 
        error: 'Rutina compartida no encontrada' 
      }, { status: 404 })
    }

    const result = await db.collection('sharedRoutines').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        error: 'No se pudo actualizar la rutina' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Rutina ${isActive ? 'activada' : 'desactivada'} exitosamente`
    })

  } catch (error) {
    console.error('Error updating shared routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    const userId = await requireAuth(request)
    const { id } = await params
    const db = await getDb()

    const sharedRoutine = await db.collection('sharedRoutines')
      .findOne({ _id: new ObjectId(id), userId })

    if (!sharedRoutine) {
      return NextResponse.json({ 
        error: 'Rutina compartida no encontrada' 
      }, { status: 404 })
    }

    await db.collection('sharedRoutines').deleteOne({ _id: new ObjectId(id) })

    await db.collection('routineUsages').deleteMany({ 
      sharedRoutineId: id 
    })

    return NextResponse.json({ 
      success: true,
      message: 'Rutina compartida eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error deleting shared routine:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
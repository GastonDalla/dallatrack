import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { Routine } from '@/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const body = await request.json()
    const { id, exerciseId } = await params

    const routine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!routine) {
      return NextResponse.json({ 
        error: 'Rutina no encontrada' 
      }, { status: 404 })
    }

    const result = await db.collection('routines').updateOne(
      { 
        _id: new ObjectId(id),
        'exercises.id': exerciseId
      },
      { 
        $set: { 
          'exercises.$': { ...body, id: exerciseId },
          updatedAt: new Date()
        } as any
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        error: 'No se pudo actualizar el ejercicio' 
      }, { status: 500 })
    }

    const updatedRoutine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id)
    })

    return NextResponse.json({ 
      routine: { ...updatedRoutine, id: updatedRoutine?._id.toString() }
    })

  } catch (error) {
    console.error('Error updating exercise in routine:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; exerciseId: string }> }
) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    const { id, exerciseId } = await params

    const routine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id),
      userId
    })

    if (!routine) {
      return NextResponse.json({ 
        error: 'Rutina no encontrada' 
      }, { status: 404 })
    }

    const result = await db.collection('routines').updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { exercises: { id: exerciseId } } as any,
        $set: { updatedAt: new Date() }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        error: 'No se pudo eliminar el ejercicio' 
      }, { status: 500 })
    }

    const updatedRoutine = await db.collection<Routine>('routines').findOne({
      _id: new ObjectId(id)
    })

    return NextResponse.json({ 
      routine: { ...updatedRoutine, id: updatedRoutine?._id.toString() }
    })

  } catch (error) {
    console.error('Error deleting exercise from routine:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { Exercise, toClientFormat } from '@/lib/mongosee'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    const db = await getDb()
    
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const muscleGroup = url.searchParams.get('muscleGroup')
    const difficulty = url.searchParams.get('difficulty')

    const query: any = { userId }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (muscleGroup && muscleGroup !== 'all') {
      query.muscleGroups = { $in: [muscleGroup] }
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty
    }

    const exercises = await db.collection<Exercise>('exercises')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    const exercisesWithId = exercises.map(toClientFormat)

    return NextResponse.json({ exercises: exercisesWithId })
  } catch (error) {
    console.error('Error fetching exercises:', error)
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

    const now = new Date()
    const exerciseData: Omit<Exercise, '_id' | 'id'> = {
      userId,
      title,
      description: description || '',
      youtubeLink: youtubeLink || undefined,
      defaultSets: parseInt(defaultSets),
      muscleGroups: muscleGroups || [],
      equipment: equipment || [],
      difficulty,
      instructions: instructions || [],
      tips: tips || [],
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.collection<Exercise>('exercises').insertOne(exerciseData)
    
    const exercise = {
      ...exerciseData,
      id: result.insertedId.toString()
    }

    return NextResponse.json({ exercise }, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    if (error instanceof Error && error.message === 'Usuario no autenticado') {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 
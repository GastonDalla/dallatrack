import { NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { requireAuth } from "@/lib/auth-helpers"

const client = new MongoClient(process.env.MONGODB_URI!)

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  muscleGroups: string[];
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
}

interface GeneratedRoutine {
  name: string;
  description: string;
  duration: string;
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  goals: string[];
  exercises: Exercise[];
  warmup: string[];
  cooldown: string[];
  tips: string[];
  frequency: string;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Iniciando guardado de rutina de IA...')
  
  try {
    console.log('🔐 Verificando autenticación...')
    const userId = await requireAuth(request)
    console.log('✅ Usuario autenticado, userId:', userId)

    const body = await request.json()
    console.log('📦 Datos recibidos:', JSON.stringify(body, null, 2))
    
    const { routine }: { routine: GeneratedRoutine } = body

    if (!routine) {
      console.log('❌ No se proporcionó rutina')
      return NextResponse.json(
        { error: "No se proporcionó rutina" },
        { status: 400 }
      )
    }

    if (!routine.name) {
      console.log('❌ Rutina sin nombre')
      return NextResponse.json(
        { error: "La rutina debe tener un nombre" },
        { status: 400 }
      )
    }

    if (!routine.exercises || routine.exercises.length === 0) {
      console.log('❌ Rutina sin ejercicios')
      return NextResponse.json(
        { error: "La rutina debe tener al menos un ejercicio" },
        { status: 400 }
      )
    }

    console.log(`✅ Validación exitosa - Rutina: "${routine.name}" con ${routine.exercises.length} ejercicios`)

    console.log('🔌 Conectando a MongoDB...')
    await client.connect()
    console.log('✅ Conectado a MongoDB')
    
    const db = client.db()
    const routinesCollection = db.collection("routines")
    const exercisesCollection = db.collection("exercises")

    const routineExercises = []
    console.log('🏋️ Procesando ejercicios...')
    
    const extractRestTime = (restString: string): number => {
      const match = restString.match(/\d+/)
      if (match) {
        const number = parseInt(match[0])
        if (number >= 30 && number <= 300) {
          return number
        }
      }
      
      const restLower = restString.toLowerCase()
      if (restLower.includes('corto') || restLower.includes('rápido')) {
        return 45
      } else if (restLower.includes('medio') || restLower.includes('moderado')) {
        return 90
      } else if (restLower.includes('largo') || restLower.includes('completo')) {
        return 120
      }
      
      return 90
    }
    
    for (let i = 0; i < routine.exercises.length; i++) {
      const exercise = routine.exercises[i]
      console.log(`📋 Procesando ejercicio ${i + 1}: ${exercise.name}`)
      console.log(`⏱️ Descanso original: "${exercise.rest}"`)
      
      const restTime = extractRestTime(exercise.rest)
      console.log(`⏱️ Descanso procesado: ${restTime} segundos`)
      
      let existingExercise = await exercisesCollection.findOne({
        title: exercise.name,
        userId: userId
      })

      if (!existingExercise) {
        console.log(`➕ Creando nuevo ejercicio: ${exercise.name}`)
        
        const newExercise = {
          userId: userId,
          title: exercise.name,
          description: exercise.notes || `Ejercicio generado por IA. Grupos musculares: ${exercise.muscleGroups.join(', ')}`,
          youtubeLink: null,
          defaultSets: exercise.sets,
          muscleGroups: exercise.muscleGroups,
          equipment: [], 
          difficulty: exercise.difficulty,
          instructions: exercise.notes ? [exercise.notes] : [],
          tips: [],
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const exerciseResult = await exercisesCollection.insertOne(newExercise)
        console.log(`✅ Ejercicio creado con ID: ${exerciseResult.insertedId}`)
        
        existingExercise = {
          _id: exerciseResult.insertedId,
          ...newExercise
        }
      } else {
        console.log(`♻️ Usando ejercicio existente: ${exercise.name} (ID: ${existingExercise._id})`)
        
        await exercisesCollection.updateOne(
          { _id: existingExercise._id },
          { 
            $inc: { usageCount: 1 },
            $set: { updatedAt: new Date() }
          }
        )
      }

      routineExercises.push({
        exerciseId: existingExercise._id.toString(),
        sets: exercise.sets,
        reps: exercise.reps,
        weight: null, 
        restTime: restTime,
        notes: exercise.notes || '',
        order: i + 1
      })
    }

    console.log(`✅ Ejercicios procesados: ${routineExercises.length} ejercicios agregados a la rutina`)

    console.log('📝 Creando rutina en la base de datos...')
    const newRoutine = {
      userId: userId,
      title: routine.name,
      description: routine.description,
      estimatedDuration: parseInt(routine.duration.replace(/\D/g, '')) || 60, 
      difficulty: routine.difficulty,
      targetMuscleGroups: routine.exercises.flatMap(ex => ex.muscleGroups),
      timesPerformed: 0,
      exercises: routineExercises,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      aiGenerated: true,
      aiMetadata: {
        goals: routine.goals,
        warmup: routine.warmup,
        cooldown: routine.cooldown,
        tips: routine.tips,
        frequency: routine.frequency
      }
    }

    console.log('💾 Insertando rutina en MongoDB...')
    const routineResult = await routinesCollection.insertOne(newRoutine)
    console.log(`🎉 Rutina guardada exitosamente con ID: ${routineResult.insertedId}`)

    return NextResponse.json({
      routineId: routineResult.insertedId.toString(),
      message: "Rutina guardada exitosamente"
    })

  } catch (error) {
    console.error("💥 Error saving AI routine:", error)
    
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      
      if (error.message === 'Usuario no autenticado') {
        return NextResponse.json(
          { error: 'Usuario no autenticado' },
          { status: 401 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  } finally {
    try {
      await client.close()
      console.log('🔌 Conexión a MongoDB cerrada')
    } catch (closeError) {
      console.error('Error cerrando conexión:', closeError)
    }
  }
} 
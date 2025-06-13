import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  id?: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Exercise {
  _id?: ObjectId
  id?: string
  userId: string
  title: string
  description?: string
  youtubeLink?: string
  defaultSets: number
  muscleGroups: string[]
  equipment: string[]
  difficulty: 'principiante' | 'intermedio' | 'avanzado'
  instructions: string[]
  tips: string[]
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Routine {
  _id?: ObjectId
  id?: string
  userId: string
  title: string
  description?: string
  estimatedDuration: number 
  difficulty: 'principiante' | 'intermedio' | 'avanzado'
  targetMuscleGroups: string[]
  timesPerformed: number
  lastPerformed?: Date
  averageRating?: number
  isSharedRoutine?: boolean 
  originalShareCode?: string 
  createdAt: Date
  updatedAt: Date
  exercises: RoutineExercise[]
}

export interface RoutineExercise {
  _id?: ObjectId
  exerciseId: string
  sets: number
  reps: string
  weight?: string
  restTime?: number 
  notes?: string
  order: number
}

export interface TrainingSession {
  _id?: ObjectId
  id?: string
  userId: string
  routineId?: string
  routineName?: string
  startTime: Date
  endTime?: Date
  duration?: number 
  isActive: boolean
  isPaused?: boolean
  pausedAt?: Date
  resumedAt?: Date
  notes?: string
  rating?: number 
  fatigue?: number 
  createdAt: Date
  updatedAt: Date
  exercises: SessionExercise[]
  routine?: Routine 
}

export interface SessionExercise {
  _id?: ObjectId
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: string
  targetWeight?: string
  restTime?: number 
  notes?: string
  order: number
  muscleGroups: string[]
  sets: SessionSet[]
}

export interface SessionSet {
  _id?: ObjectId
  setNumber: number
  reps?: number
  weight?: number
  restTime?: number 
  completed: boolean
  startTime?: Date
  endTime?: Date
  notes?: string
}

export function toClientFormat<T extends { _id?: ObjectId }>(doc: T): T & { id: string } {
  const { _id, ...rest } = doc
  return {
    ...rest,
    id: _id?.toString() || '',
  } as T & { id: string }
}

export interface SharedRoutine {
  _id?: ObjectId
  id?: string
  routineId: string
  userId: string 
  shareCode: string 
  title: string
  description?: string
  difficulty: 'principiante' | 'intermedio' | 'avanzado'
  estimatedDuration: number
  targetMuscleGroups: string[]
  exercises: SharedRoutineExercise[]
  isActive: boolean
  maxUses?: number
  currentUses: number
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SharedRoutineExercise {
  exerciseId: string
  exerciseName: string
  sets: number
  reps: string
  weight?: string
  restTime?: number
  notes?: string
  order: number
  muscleGroups: string[]
  equipment: string[]
  instructions?: string[]
}

export interface RoutineUsage {
  _id?: ObjectId
  id?: string
  sharedRoutineId: string
  shareCode: string
  usedById: string
  usedByName?: string
  usedByEmail?: string
  routineTitle: string
  usedAt: Date
  addedToRoutines: boolean
  createdAt: Date
} 
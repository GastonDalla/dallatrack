import { getDb } from '@/lib/mongodb'
import { formatStatNumber, formatTimeHours } from '@/lib/format-utils'

interface SessionExercise {
  sets?: Array<{ completed: boolean, weight?: number, reps?: number }>
}

interface TrainingSessionData {
  exercises?: SessionExercise[]
  startTime?: string
  endTime?: string
}

export interface MarketingStats {
  totalUsers: number
  totalWorkouts: number 
  totalExercisesLogged: number
  totalRoutines: number
  totalExercises: number
  totalTimeMinutes: number
}

export async function getMarketingStats(): Promise<MarketingStats> {
  try {
    const db = await getDb()
    

    const totalUsers = await db.collection('exercises').distinct('userId').then(userIds => userIds.length)
    
    const totalWorkouts = await db.collection('training_sessions').countDocuments({
      endTime: { $exists: true }
    })
    
    const totalRoutines = await db.collection('routines').countDocuments()
    
    const totalExercises = await db.collection('exercises').countDocuments()
    
    const sessions = await db.collection('training_sessions').find({
      endTime: { $exists: true }
    }).toArray() as TrainingSessionData[]
    
    let totalExercisesLogged = 0
    let totalTimeMinutes = 0
    
    sessions.forEach(session => {
      if (session.startTime && session.endTime) {
        const start = new Date(session.startTime).getTime()
        const end = new Date(session.endTime).getTime()
        const durationMinutes = Math.floor((end - start) / (1000 * 60))
        totalTimeMinutes += durationMinutes
      }
      
      session.exercises?.forEach((exercise: SessionExercise) => {
        if (exercise.sets) {
          totalExercisesLogged += exercise.sets.filter((set: { completed: boolean }) => set.completed).length
        }
      })
    })
    
    return {
      totalUsers: Math.max(totalUsers, 1),
      totalWorkouts: Math.max(totalWorkouts, 1),
      totalExercisesLogged: Math.max(totalExercisesLogged, 1),
      totalRoutines: Math.max(totalRoutines, 1),
      totalExercises: Math.max(totalExercises, 1),
      totalTimeMinutes: Math.max(totalTimeMinutes, 1)
    }
  } catch (error) {
    console.error('Error fetching marketing stats:', error)
    return {
      totalUsers: 1,
      totalWorkouts: 1,
      totalExercisesLogged: 1,
      totalRoutines: 1,
      totalExercises: 1,
      totalTimeMinutes: 60
    }
  }
}


export { formatStatNumber, formatTimeHours } 
export interface ExerciseSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  targetReps: number;
  targetWeight: number;
}

export interface Exercise {
  id: string;
  title: string;
  description?: string;
  youtubeLink?: string;
  defaultSets: number;
  sets?: ExerciseSet[];
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  instructions?: string[];
  tips?: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  routineId: string;
  order: number;
  sets: RoutineSet[];
  exercise?: Exercise;
}

export interface RoutineSet {
  id: string;
  routineExerciseId: string;
  setNumber: number;
  targetReps: string;
  targetWeight: number;
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  estimatedDuration?: number;
  targetMuscleGroups?: string[];
  timesPerformed?: number;
  lastPerformed?: string;
  rating?: number;
  isSharedRoutine?: boolean;
  originalShareCode?: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  routineId: string;
  routine?: Routine;
  startTime: string;
  endTime?: string;
  exercises: SessionExercise[];
  currentExerciseIndex?: number;
  currentSetIndex?: number;
  isPaused?: boolean;
  pausedAt?: string;
  resumedAt?: string;
  createdAt: string;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  exercise?: Exercise;
  sets: SessionSet[];
  order: number;
}

export interface SessionSet {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

export interface SharedRoutine {
  id: string;
  routineId: string;
  userId: string; 
  shareCode: string; 
  title: string;
  description?: string;
  difficulty: string;
  estimatedDuration: number;
  targetMuscleGroups: string[];
  exercises: SharedRoutineExercise[];
  isActive: boolean; 
  maxUses?: number; 
  currentUses: number; 
  expiresAt?: string; 
  createdAt: string;
  updatedAt: string;
}

export interface SharedRoutineExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  weight?: string;
  restTime?: number;
  notes?: string;
  order: number;
  muscleGroups: string[];
  equipment: string[];
  instructions?: string[];
}

export interface RoutineUsage {
  id: string;
  sharedRoutineId: string;
  shareCode: string;
  usedById: string; 
  usedByName?: string; 
  routineTitle: string;
  usedAt: string;
  addedToRoutines: boolean; 
}

export interface ShareStatistics {
  totalSharedRoutines: number;
  totalUses: number;
  mostUsedRoutine: {
    title: string;
    uses: number;
    shareCode: string;
  } | null;
  recentUses: RoutineUsage[];
  usageByDay: {
    date: string;
    uses: number;
  }[];
  sharedRoutines: {
    id: string;
    title: string;
    shareCode: string;
    currentUses: number;
    maxUses?: number;
    isActive: boolean;
    createdAt: string;
    expiresAt?: string;
  }[];
}
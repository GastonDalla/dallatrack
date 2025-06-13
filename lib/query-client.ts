import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

export const queryKeys = {
  auth: ['auth'] as const,
  
  user: ['user'] as const,
  userProfile: () => [...queryKeys.user, 'profile'] as const,
  
  routines: ['routines'] as const,
  routine: (id: string) => [...queryKeys.routines, id] as const,
  
  exercises: ['exercises'] as const,
  exercise: (id: string) => [...queryKeys.exercises, id] as const,
  
  trainingSessions: ['training-sessions'] as const,
  trainingSession: (id: string) => [...queryKeys.trainingSessions, id] as const,
  activeTrainingSessions: () => [...queryKeys.trainingSessions, 'active'] as const,
  
  ai: ['ai'] as const,
  aiRoutineGeneration: (formData: any) => [...queryKeys.ai, 'routine-generation', formData] as const,
  aiFormAnalysis: (data: any) => [...queryKeys.ai, 'form-analysis', data] as const,
} as const 
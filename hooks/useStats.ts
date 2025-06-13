import { useMutation, useQueryClient } from '@tanstack/react-query'
import { $fetch } from 'ofetch'
import { useToast } from '@/hooks/use-toast'

interface UpdateStatsRequest {
  sessionId: string
  duration: number
  totalWeight?: number
  setsCompleted: number
}

interface UpdateStatsResponse {
  stats: any
  newAchievements: string[]
  message: string
}

export function useStats() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const updateStatsMutation = useMutation({
    mutationFn: async (data: UpdateStatsRequest) => {
      const response = await $fetch<UpdateStatsResponse>('/api/user/stats', {
        method: 'POST',
        body: data
      })
      return response
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
      
      if (data.newAchievements.length > 0) {
        toast({
          title: "¡Nuevos logros desbloqueados!",
          description: `Has desbloqueado ${data.newAchievements.length} nuevo${data.newAchievements.length > 1 ? 's' : ''} logro${data.newAchievements.length > 1 ? 's' : ''}`
        })
      }
    },
    onError: (error: any) => {
      console.error('Error actualizando estadísticas:', error)
      toast({
        title: "Error",
        description: 'Error al actualizar estadísticas',
        variant: "destructive"
      })
    }
  })

  return {
    updateStats: updateStatsMutation.mutate,
    isUpdating: updateStatsMutation.isPending,
    error: updateStatsMutation.error
  }
} 
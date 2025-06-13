import { useMutation, useQueryClient } from '@tanstack/react-query'
import { $fetch } from 'ofetch'
import { useToast } from '@/hooks/use-toast'

interface AchievementResponse {
  newAchievements: string[]
  totalAchievements: number
  message: string
}

export function useAchievements() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const checkAchievementsMutation = useMutation({
    mutationFn: async () => {
      const response = await $fetch<AchievementResponse>('/api/user/achievements/check', {
        method: 'POST'
      })
      return response
    },
    onSuccess: (data) => { 
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      
      if (data.newAchievements.length > 0) {
        toast({
          title: "¡Nuevos logros desbloqueados!",
          description: `Has desbloqueado ${data.newAchievements.length} nuevo${data.newAchievements.length > 1 ? 's' : ''} logro${data.newAchievements.length > 1 ? 's' : ''}`
        })
      }
    },
    onError: (error: any) => {
      console.error('Error verificando logros:', error)
    }
  })

  const checkAchievements = async () => {
    try {
      await checkAchievementsMutation.mutateAsync()
    } catch (error) {
      console.error('Error en verificación de logros:', error)
    }
  }

  return {
    checkAchievements,
    isChecking: checkAchievementsMutation.isPending,
    lastCheck: checkAchievementsMutation.data
  }
} 
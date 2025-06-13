export interface Achievement {
  id: string
  category: 'workouts' | 'strength' | 'consistency' | 'milestones' | 'special' | 'weekly' | 'monthly'
  nameKey: string
  descriptionKey: string
  icon: string
  requirement: {
    type: 'workouts' | 'streak' | 'totalWeight' | 'totalTime' | 'setsCompleted' | 'workoutsInPeriod' | 'special'
    value: number
    period?: 'week' | 'month' | 'year'
  }
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
}

export const achievements: Achievement[] = [
  
  {
    id: 'firstWorkout',
    category: 'workouts',
    nameKey: 'firstWorkout',
    descriptionKey: 'firstWorkoutDesc',
    icon: '🎯',
    requirement: { type: 'workouts', value: 1 },
    rarity: 'Common'
  },
  {
    id: 'workouts5',
    category: 'workouts',
    nameKey: 'workouts5',
    descriptionKey: 'workouts5Desc',
    icon: '💪',
    requirement: { type: 'workouts', value: 5 },
    rarity: 'Common'
  },
  {
    id: 'workouts10',
    category: 'workouts',
    nameKey: 'workouts10',
    descriptionKey: 'workouts10Desc',
    icon: '🔥',
    requirement: { type: 'workouts', value: 10 },
    rarity: 'Common'
  },
  {
    id: 'workouts25',
    category: 'workouts',
    nameKey: 'workouts25',
    descriptionKey: 'workouts25Desc',
    icon: '⭐',
    requirement: { type: 'workouts', value: 25 },
    rarity: 'Rare'
  },
  {
    id: 'workouts50',
    category: 'workouts',
    nameKey: 'workouts50',
    descriptionKey: 'workouts50Desc',
    icon: '🏆',
    requirement: { type: 'workouts', value: 50 },
    rarity: 'Epic'
  },
  {
    id: 'workouts100',
    category: 'workouts',
    nameKey: 'workouts100',
    descriptionKey: 'workouts100Desc',
    icon: '👑',
    requirement: { type: 'workouts', value: 100 },
    rarity: 'Legendary'
  },
  {
    id: 'workouts200',
    category: 'workouts',
    nameKey: 'workouts200',
    descriptionKey: 'workouts200Desc',
    icon: '🚀',
    requirement: { type: 'workouts', value: 200 },
    rarity: 'Legendary'
  },
  {
    id: 'workouts365',
    category: 'workouts',
    nameKey: 'workouts365',
    descriptionKey: 'workouts365Desc',
    icon: '🌟',
    requirement: { type: 'workouts', value: 365 },
    rarity: 'Mythic'
  },
  {
    id: 'workouts500',
    category: 'workouts',
    nameKey: 'workouts500',
    descriptionKey: 'workouts500Desc',
    icon: '💎',
    requirement: { type: 'workouts', value: 500 },
    rarity: 'Mythic'
  },
  {
    id: 'workouts1000',
    category: 'workouts',
    nameKey: 'workouts1000',
    descriptionKey: 'workouts1000Desc',
    icon: '🔮',
    requirement: { type: 'workouts', value: 1000 },
    rarity: 'Mythic'
  },

  
  {
    id: 'streak3',
    category: 'consistency',
    nameKey: 'streak3',
    descriptionKey: 'streak3Desc',
    icon: '🔥',
    requirement: { type: 'streak', value: 3 },
    rarity: 'Common'
  },
  {
    id: 'streak7',
    category: 'consistency',
    nameKey: 'streak7',
    descriptionKey: 'streak7Desc',
    icon: '💥',
    requirement: { type: 'streak', value: 7 },
    rarity: 'Common'
  },
  {
    id: 'streak14',
    category: 'consistency',
    nameKey: 'streak14',
    descriptionKey: 'streak14Desc',
    icon: '💎',
    requirement: { type: 'streak', value: 14 },
    rarity: 'Rare'
  },
  {
    id: 'streak30',
    category: 'consistency',
    nameKey: 'streak30',
    descriptionKey: 'streak30Desc',
    icon: '🌟',
    requirement: { type: 'streak', value: 30 },
    rarity: 'Epic'
  },
  {
    id: 'streak60',
    category: 'consistency',
    nameKey: 'streak60',
    descriptionKey: 'streak60Desc',
    icon: '⚡',
    requirement: { type: 'streak', value: 60 },
    rarity: 'Epic'
  },
  {
    id: 'streak100',
    category: 'consistency',
    nameKey: 'streak100',
    descriptionKey: 'streak100Desc',
    icon: '🔥',
    requirement: { type: 'streak', value: 100 },
    rarity: 'Legendary'
  },
  {
    id: 'streak365',
    category: 'consistency',
    nameKey: 'streak365',
    descriptionKey: 'streak365Desc',
    icon: '🏅',
    requirement: { type: 'streak', value: 365 },
    rarity: 'Mythic'
  },

  
  {
    id: 'totalWeight500',
    category: 'strength',
    nameKey: 'totalWeight500',
    descriptionKey: 'totalWeight500Desc',
    icon: '💪',
    requirement: { type: 'totalWeight', value: 500 },
    rarity: 'Common'
  },
  {
    id: 'totalWeight1000',
    category: 'strength',
    nameKey: 'totalWeight1000',
    descriptionKey: 'totalWeight1000Desc',
    icon: '🏋️',
    requirement: { type: 'totalWeight', value: 1000 },
    rarity: 'Common'
  },
  {
    id: 'totalWeight5000',
    category: 'strength',
    nameKey: 'totalWeight5000',
    descriptionKey: 'totalWeight5000Desc',
    icon: '🦁',
    requirement: { type: 'totalWeight', value: 5000 },
    rarity: 'Rare'
  },
  {
    id: 'totalWeight10000',
    category: 'strength',
    nameKey: 'totalWeight10000',
    descriptionKey: 'totalWeight10000Desc',
    icon: '🦍',
    requirement: { type: 'totalWeight', value: 10000 },
    rarity: 'Epic'
  },
  {
    id: 'totalWeight25000',
    category: 'strength',
    nameKey: 'totalWeight25000',
    descriptionKey: 'totalWeight25000Desc',
    icon: '🐘',
    requirement: { type: 'totalWeight', value: 25000 },
    rarity: 'Legendary'
  },
  {
    id: 'totalWeight50000',
    category: 'strength',
    nameKey: 'totalWeight50000',
    descriptionKey: 'totalWeight50000Desc',
    icon: '🏔️',
    requirement: { type: 'totalWeight', value: 50000 },
    rarity: 'Legendary'
  },
  {
    id: 'totalWeight100000',
    category: 'strength',
    nameKey: 'totalWeight100000',
    descriptionKey: 'totalWeight100000Desc',
    icon: '🌍',
    requirement: { type: 'totalWeight', value: 100000 },
    rarity: 'Mythic'
  },

  
  {
    id: 'totalTime5',
    category: 'milestones',
    nameKey: 'totalTime5',
    descriptionKey: 'totalTime5Desc',
    icon: '⏰',
    requirement: { type: 'totalTime', value: 300 }, 
    rarity: 'Common'
  },
  {
    id: 'totalTime10',
    category: 'milestones',
    nameKey: 'totalTime10',
    descriptionKey: 'totalTime10Desc',
    icon: '⌚',
    requirement: { type: 'totalTime', value: 600 }, 
    rarity: 'Common'
  },
  {
    id: 'totalTime25',
    category: 'milestones',
    nameKey: 'totalTime25',
    descriptionKey: 'totalTime25Desc',
    icon: '🕐',
    requirement: { type: 'totalTime', value: 1500 }, 
    rarity: 'Rare'
  },
  {
    id: 'totalTime50',
    category: 'milestones',
    nameKey: 'totalTime50',
    descriptionKey: 'totalTime50Desc',
    icon: '⏳',
    requirement: { type: 'totalTime', value: 3000 }, 
    rarity: 'Epic'
  },
  {
    id: 'totalTime100',
    category: 'milestones',
    nameKey: 'totalTime100',
    descriptionKey: 'totalTime100Desc',
    icon: '🕰️',
    requirement: { type: 'totalTime', value: 6000 }, 
    rarity: 'Epic'
  },
  {
    id: 'totalTime200',
    category: 'milestones',
    nameKey: 'totalTime200',
    descriptionKey: 'totalTime200Desc',
    icon: '⏱️',
    requirement: { type: 'totalTime', value: 12000 }, 
    rarity: 'Legendary'
  },
  {
    id: 'totalTime500',
    category: 'milestones',
    nameKey: 'totalTime500',
    descriptionKey: 'totalTime500Desc',
    icon: '🎯',
    requirement: { type: 'totalTime', value: 30000 }, 
    rarity: 'Mythic'
  },

  
  {
    id: 'sets100',
    category: 'milestones',
    nameKey: 'sets100',
    descriptionKey: 'sets100Desc',
    icon: '📈',
    requirement: { type: 'setsCompleted', value: 100 },
    rarity: 'Common'
  },
  {
    id: 'sets500',
    category: 'milestones',
    nameKey: 'sets500',
    descriptionKey: 'sets500Desc',
    icon: '📊',
    requirement: { type: 'setsCompleted', value: 500 },
    rarity: 'Rare'
  },
  {
    id: 'sets1000',
    category: 'milestones',
    nameKey: 'sets1000',
    descriptionKey: 'sets1000Desc',
    icon: '🎪',
    requirement: { type: 'setsCompleted', value: 1000 },
    rarity: 'Epic'
  },
  {
    id: 'sets2500',
    category: 'milestones',
    nameKey: 'sets2500',
    descriptionKey: 'sets2500Desc',
    icon: '🎭',
    requirement: { type: 'setsCompleted', value: 2500 },
    rarity: 'Legendary'
  },
  {
    id: 'sets5000',
    category: 'milestones',
    nameKey: 'sets5000',
    descriptionKey: 'sets5000Desc',
    icon: '🎨',
    requirement: { type: 'setsCompleted', value: 5000 },
    rarity: 'Mythic'
  },

  
  {
    id: 'weeklyWarrior',
    category: 'weekly',
    nameKey: 'weeklyWarrior',
    descriptionKey: 'weeklyWarriorDesc',
    icon: '📅',
    requirement: { type: 'workoutsInPeriod', value: 7, period: 'week' },
    rarity: 'Rare'
  },
  {
    id: 'weeklyConsistent',
    category: 'weekly',
    nameKey: 'weeklyConsistent',
    descriptionKey: 'weeklyConsistentDesc',
    icon: '🔄',
    requirement: { type: 'workoutsInPeriod', value: 5, period: 'week' },
    rarity: 'Common'
  },
  {
    id: 'weeklyDedicated',
    category: 'weekly',
    nameKey: 'weeklyDedicated',
    descriptionKey: 'weeklyDedicatedDesc',
    icon: '🎯',
    requirement: { type: 'workoutsInPeriod', value: 10, period: 'week' },
    rarity: 'Epic'
  },

  
  {
    id: 'monthlyChampion',
    category: 'monthly',
    nameKey: 'monthlyChampion',
    descriptionKey: 'monthlyChampionDesc',
    icon: '🏆',
    requirement: { type: 'workoutsInPeriod', value: 20, period: 'month' },
    rarity: 'Epic'
  },
  {
    id: 'monthlyLegend',
    category: 'monthly',
    nameKey: 'monthlyLegend',
    descriptionKey: 'monthlyLegendDesc',
    icon: '👑',
    requirement: { type: 'workoutsInPeriod', value: 30, period: 'month' },
    rarity: 'Legendary'
  },
  {
    id: 'monthlyMythic',
    category: 'monthly',
    nameKey: 'monthlyMythic',
    descriptionKey: 'monthlyMythicDesc',
    icon: '🔮',
    requirement: { type: 'workoutsInPeriod', value: 40, period: 'month' },
    rarity: 'Mythic'
  }
]

export interface UserStats {
  totalWorkouts: number
  currentStreak: number
  longestStreak: number
  totalTime: number 
  totalWeight?: number 
  setsCompleted?: number 
  workoutsThisWeek?: number 
  workoutsThisMonth?: number 
}

export function checkAchievements(userStats: UserStats, currentAchievements: string[]): string[] {
  const newAchievements: string[] = []

  achievements.forEach(achievement => {
    if (currentAchievements.includes(achievement.id)) {
      return
    }

    let isUnlocked = false

    switch (achievement.requirement.type) {
      case 'workouts':
        isUnlocked = userStats.totalWorkouts >= achievement.requirement.value
        break
      case 'streak':
        isUnlocked = userStats.longestStreak >= achievement.requirement.value
        break
      case 'totalTime':
        isUnlocked = userStats.totalTime >= achievement.requirement.value
        break
      case 'totalWeight':
        isUnlocked = (userStats.totalWeight || 0) >= achievement.requirement.value
        break
      case 'setsCompleted':
        isUnlocked = (userStats.setsCompleted || 0) >= achievement.requirement.value
        break
      case 'workoutsInPeriod':
        if (achievement.requirement.period === 'week') {
          isUnlocked = (userStats.workoutsThisWeek || 0) >= achievement.requirement.value
        } else if (achievement.requirement.period === 'month') {
          isUnlocked = (userStats.workoutsThisMonth || 0) >= achievement.requirement.value
        }
        break
      case 'special':
        isUnlocked = false
        break
    }

    if (isUnlocked) {
      newAchievements.push(achievement.id)
    }
  })

  return newAchievements
}

export function getAchievementProgress(userStats: UserStats, achievementId: string): number {
  const achievement = achievements.find(a => a.id === achievementId)
  if (!achievement) return 0

  let current = 0
  let target = achievement.requirement.value

  switch (achievement.requirement.type) {
    case 'workouts':
      current = userStats.totalWorkouts
      break
    case 'streak':
      current = userStats.longestStreak
      break
    case 'totalTime':
      current = userStats.totalTime
      break
    case 'totalWeight':
      current = userStats.totalWeight || 0
      break
    case 'setsCompleted':
      current = userStats.setsCompleted || 0
      break
    case 'workoutsInPeriod':
      if (achievement.requirement.period === 'week') {
        current = userStats.workoutsThisWeek || 0
      } else if (achievement.requirement.period === 'month') {
        current = userStats.workoutsThisMonth || 0
      }
      break
    case 'special':
      return 0
  }

  return Math.min(current / target, 1) * 100
}

export function getNextAchievements(userStats: UserStats, currentAchievements: string[]): Achievement[] {
  const availableAchievements = achievements
    .filter(achievement => !currentAchievements.includes(achievement.id))
  
  const achievementsWithProgress = availableAchievements
    .map(achievement => ({
      achievement,
      progress: getAchievementProgress(userStats, achievement.id)
    }))
    .filter(item => item.progress > 0) 
    .sort((a, b) => b.progress - a.progress) 

  return achievementsWithProgress
    .slice(0, 5)
    .map(item => item.achievement)
}

export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'Common':
      return 'text-gray-600 bg-gray-100'
    case 'Rare':
      return 'text-blue-600 bg-blue-100'
    case 'Epic':
      return 'text-purple-600 bg-purple-100'
    case 'Legendary':
      return 'text-yellow-600 bg-yellow-100'
    case 'Mythic':
      return 'text-green-600 bg-green-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
} 
export function formatStatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M+`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K+`
  } else {
    return `${value}+`
  }
}

export function formatTimeHours(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    if (hours >= 1000) {
      return `${(hours / 1000).toFixed(1)}K+h`
    }
    return `${hours}+h`
  }
  return `${minutes}+min`
} 
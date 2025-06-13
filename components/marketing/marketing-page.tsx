import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dumbbell, 
  Sparkles, 
  BarChart3, 
  Target,
  Users,
  TrendingUp,
  Play,
  ArrowRight,
  CheckCircle,
  Activity,
  Timer,
  Trophy,
  Smartphone,
  Clock,
  BookOpen
} from 'lucide-react'
import { MarketingStats } from '@/lib/stats'
import { formatStatNumber, formatTimeHours } from '@/lib/format-utils'
import { Translations } from '@/lib/i18n'

interface MarketingPageProps {
  translations: Translations
  stats: MarketingStats
}

export function MarketingPage({ translations: t, stats }: MarketingPageProps) {
  const features = [
    {
      icon: Dumbbell,
      title: t.marketing.features.customRoutines,
      description: t.marketing.features.customRoutinesDesc
    },
    {
      icon: BarChart3,
      title: t.marketing.features.progressTracking,
      description: t.marketing.features.progressTrackingDesc
    },
    {
      icon: Target,
      title: t.marketing.features.smartGoals,
      description: t.marketing.features.smartGoalsDesc
    },
    {
      icon: Timer,
      title: t.marketing.features.timer,
      description: t.marketing.features.timerDesc
    },
    {
      icon: Activity,
      title: t.marketing.features.analytics,
      description: t.marketing.features.analyticsDesc
    },
    {
      icon: Smartphone,
      title: t.marketing.features.mobile,
      description: t.marketing.features.mobileDesc
    }
  ]

  const statsData = [
    {
      icon: Users,
      value: formatStatNumber(stats.totalUsers),
      label: t.marketing.stats.activeUsers,
      color: "text-blue-600"
    },
    {
      icon: Activity,
      value: formatStatNumber(stats.totalWorkouts),
      label: t.marketing.stats.completedWorkouts,
      color: "text-green-600"
    },
    {
      icon: Target,
      value: formatStatNumber(stats.totalExercisesLogged),
      label: t.marketing.stats.exercisesLogged,
      color: "text-purple-600"
    },
    {
      icon: BookOpen,
      value: formatStatNumber(stats.totalRoutines),
      label: t.marketing.stats.routinesCreated,
      color: "text-orange-600"
    },
    {
      icon: Dumbbell,
      value: formatStatNumber(stats.totalExercises),
      label: t.marketing.stats.exercisesAvailable,
      color: "text-red-600"
    },
    {
      icon: Clock,
      value: formatTimeHours(stats.totalTimeMinutes),
      label: t.marketing.stats.totalTrainingTime,
      color: "text-teal-600"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              {t.marketing.hero.badge}
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              {t.marketing.hero.title}
              <span className="text-primary block">{t.marketing.hero.titleHighlight}</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.marketing.hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-lg px-8 py-4">
                  <Play className="h-5 w-5" />
                  {t.marketing.hero.startFree}
                </Button>
              </Link>
              <Link href="/signin">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-4">
                  {t.marketing.hero.signIn}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t.marketing.hero.freeForever}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t.marketing.hero.easyToUse}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t.marketing.hero.secureData}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t.marketing.features.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.marketing.features.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t.marketing.stats.title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t.marketing.stats.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {statsData.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t.marketing.cta.title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t.marketing.cta.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-lg px-8 py-4">
                  <Trophy className="h-5 w-5" />
                  {t.marketing.cta.startToday}
                </Button>
              </Link>
              <Link href="/signin">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-4">
                  {t.marketing.cta.learnMore}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
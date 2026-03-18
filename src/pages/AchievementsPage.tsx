import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSubjects } from '@/hooks/useSubjects'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import { ACHIEVEMENTS, getUnlockedAchievements, type AchievementData } from '@/lib/achievements'
import { getIcon } from '@/lib/icons'
import { useTranslation } from '@/hooks/useTranslation'

export function AchievementsPage() {
  const { subjects, stats, sessions } = useSubjects()
  const { state } = useSubjectsContext()
  const { t } = useTranslation()

  const achievementData: AchievementData = useMemo(() => ({
    totalSessions: stats.totalSessions,
    totalStudyTime: stats.totalStudyTime,
    streak: stats.streak,
    masteredCards: stats.masteredCards,
    totalFlashcards: stats.totalFlashcards,
    totalSubjects: subjects.length,
    sessions,
    allCards: state.studySets.flatMap(s => s.flashcards),
  }), [stats, subjects, sessions, state.studySets])

  const unlocked = useMemo(() => getUnlockedAchievements(achievementData), [achievementData])
  const unlockedIds = new Set(unlocked.map(a => a.id))
  const progress = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in duration-500">
        <h1 className="text-2xl font-bold">{t.achievements.title}</h1>
        <span className="text-sm text-muted-foreground">{unlocked.length} / {ACHIEVEMENTS.length} {t.achievements.unlocked}</span>
      </div>

      <div className="animate-progress">
        <Progress value={progress} className="h-3" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
        {ACHIEVEMENTS.map(achievement => {
          const isUnlocked = unlockedIds.has(achievement.id)
          const Icon = getIcon(achievement.icon)
          return (
            <Card
              key={achievement.id}
              className={`transition-all card-hover-lift ${
                isUnlocked ? 'achievement-unlocked achievement-shimmer' : 'opacity-40 grayscale'
              }`}
            >
              <CardContent className="pt-4 flex items-start gap-3">
                <div className={`rounded-lg p-2 shrink-0 ${
                  isUnlocked
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className={`h-5 w-5 ${isUnlocked ? 'animate-float' : ''}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{(t.achievementNames as Record<string, string>)[achievement.id] || achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{(t.achievementDescs as Record<string, string>)[achievement.id] || achievement.description}</p>
                  {isUnlocked && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">{t.common.unlocked}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

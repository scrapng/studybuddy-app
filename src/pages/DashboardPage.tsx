import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Flame, Brain, Plus, Play, AlertCircle, Trophy, Sparkles, Camera, Wand2, ArrowRight, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useSubjects } from '@/hooks/useSubjects'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDuration, getGreeting, getRelativeTime, daysUntil } from '@/lib/utils'
import { getStudyRecommendation } from '@/lib/spaced-repetition'
import { getUnlockedAchievements, ACHIEVEMENTS, type AchievementData } from '@/lib/achievements'
import { TutorialDialog } from '@/components/shared/TutorialDialog'

export function DashboardPage() {
  const { subjects, stats, sessions } = useSubjects()
  const { state } = useSubjectsContext()
  const { t } = useTranslation()
  const recentSessions = [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5)

  const [tutorialOpen, setTutorialOpen] = useState(false)

  // Show tutorial on first visit
  useEffect(() => {
    const seen = localStorage.getItem('studybuddy-tutorial-seen')
    if (!seen) {
      setTutorialOpen(true)
      localStorage.setItem('studybuddy-tutorial-seen', '1')
    }
  }, [])

  const dueReview = useMemo(() => {
    return state.studySets
      .map(set => {
        const rec = getStudyRecommendation(set.flashcards)
        return { setId: set.id, setName: set.name, ...rec }
      })
      .filter(s => s.dueCount > 0)
      .sort((a, b) => b.urgentCount - a.urgentCount)
      .slice(0, 4)
  }, [state.studySets])

  const deadlines = useMemo(() => {
    return state.studySets
      .filter(s => s.targetDate && daysUntil(s.targetDate) >= 0 && daysUntil(s.targetDate) <= 7)
      .map(s => ({ id: s.id, name: s.name, daysLeft: daysUntil(s.targetDate!) }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3)
  }, [state.studySets])

  const achievementProgress = useMemo(() => {
    const data: AchievementData = {
      totalSessions: stats.totalSessions,
      totalStudyTime: stats.totalStudyTime,
      streak: stats.streak,
      masteredCards: stats.masteredCards,
      totalFlashcards: stats.totalFlashcards,
      totalSubjects: subjects.length,
      sessions,
      allCards: state.studySets.flatMap(s => s.flashcards),
    }
    const unlocked = getUnlockedAchievements(data)
    return { unlocked: unlocked.length, total: ACHIEVEMENTS.length }
  }, [stats, subjects, sessions, state.studySets])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}!</h1>
          <p className="text-muted-foreground">{t.dashboard.greeting}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setTutorialOpen(true)} className="gap-1.5 text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{t.dashboard.showTutorial}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-grid">
        <Card className="card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.studyTime}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{formatDuration(stats.totalStudyTime)}</div>
            <p className="text-xs text-muted-foreground">{stats.totalSessions} {t.common.sessions}</p>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.streak}</CardTitle>
            <Flame className="h-4 w-4 text-orange-500 pulse-ring" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{stats.streak} {t.common.days}</div>
            <p className="text-xs text-muted-foreground">{t.dashboard.keepItUp}</p>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.subjects}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">{t.dashboard.activeSubjects}</p>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.mastered}</CardTitle>
            <Brain className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-count-up">{stats.masteredCards}</div>
            <p className="text-xs text-muted-foreground">{t.common.of} {stats.totalFlashcards} {t.common.cards}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Tools */}
      <Card className="relative overflow-hidden border-purple-200 dark:border-purple-800/50 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-fuchsia-500/5" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              {t.dashboard.aiPoweredTools}
            </CardTitle>
            <Link to="/ai-tools" className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
              {t.common.viewAll} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-3 gap-3">
            <Link to="/ai-tools" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-purple-500/10 transition-all hover:scale-105 active:scale-95">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-center">{t.dashboard.scanNotes}</span>
            </Link>
            <Link to="/ai-tools" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-purple-500/10 transition-all hover:scale-105 active:scale-95">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-center">{t.dashboard.enhance}</span>
            </Link>
            <Link to="/ai-tools" className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-purple-500/10 transition-all hover:scale-105 active:scale-95">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Brain className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-center">{t.dashboard.generateQuiz}</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Due for Review */}
      {dueReview.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900/50 animate-in fade-in slide-in-from-top-2 duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 pulse-ring" />
              {t.dashboard.cardsDueForReview}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              {dueReview.map(s => (
                <Link key={s.setId} to={`/study/${s.setId}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                  <span className="text-sm font-medium truncate">{s.setName}</span>
                  <Badge variant={s.urgentCount > 0 ? 'destructive' : 'secondary'} className="text-xs shrink-0 ml-2">
                    {s.dueCount} {t.common.due}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
            <CardHeader>
              <CardTitle>{t.dashboard.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to="/subjects" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-auto py-4 flex-col gap-2 text-sm font-medium transition-all hover:scale-105 active:scale-95">
                <Plus className="h-5 w-5" />
                <span className="text-xs">{t.common.newSubject}</span>
              </Link>
              <Link to="/subjects" className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted h-auto py-4 flex-col gap-2 text-sm font-medium transition-all hover:scale-105 active:scale-95">
                <Play className="h-5 w-5" />
                <span className="text-xs">{t.common.startStudying}</span>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-hover-lift">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500 animate-float" />
                  {t.dashboard.achievements}
                </CardTitle>
                <Link to="/achievements" className="text-xs text-primary hover:underline">{t.common.viewAll}</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 animate-progress">
                <Progress value={(achievementProgress.unlocked / achievementProgress.total) * 100} className="flex-1 h-2" />
                <span className="text-sm font-medium">{achievementProgress.unlocked}/{achievementProgress.total}</span>
              </div>
            </CardContent>
          </Card>

          {deadlines.length > 0 && (
            <Card className="card-hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.dashboard.upcomingDeadlines}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deadlines.map(d => (
                    <Link key={d.id} to={`/study-sets/${d.id}`} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-accent transition-colors">
                      <span className="font-medium truncate">{d.name}</span>
                      <Badge variant={d.daysLeft <= 2 ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                        {d.daysLeft === 0 ? t.common.today : `${d.daysLeft} ${t.common.daysLeft}`}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">{t.dashboard.noSessions}</p>
                <Link to="/subjects">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    {t.dashboard.noSessionsCta}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between text-sm animate-in fade-in duration-300">
                    <div>
                      <p className="font-medium">{session.setName}</p>
                      <p className="text-muted-foreground text-xs">{session.subjectName} &middot; {session.cardsReviewed} {t.common.cards}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{session.score}%</p>
                      <p className="text-muted-foreground text-xs">{getRelativeTime(session.startTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </div>
  )
}

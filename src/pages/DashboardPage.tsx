import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Flame, Brain, Plus, Play, AlertCircle, Trophy, Sparkles, Camera, Wand2, ArrowRight, HelpCircle, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useSubjects } from '@/hooks/useSubjects'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDuration, getRelativeTime, daysUntil } from '@/lib/utils'
import { getStudyRecommendation } from '@/lib/spaced-repetition'
import { getUnlockedAchievements, ACHIEVEMENTS, type AchievementData } from '@/lib/achievements'
import { TutorialDialog } from '@/components/shared/TutorialDialog'
import { useSocialContext } from '@/contexts/SocialContext'

export function DashboardPage() {
  const { subjects, stats, sessions } = useSubjects()
  const { state } = useSubjectsContext()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { profile } = useSocialContext()
  const recentSessions = [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5)

  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [aiHeroHidden, setAiHeroHidden] = useState(false)

  // Show tutorial only once per user (first time a new user opens the app)
  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    const key = `notebuddy-tutorial-seen-${userId}`
    const seen = localStorage.getItem(key)
    if (!seen) {
      setTutorialOpen(true)
      localStorage.setItem(key, '1')
    }
  }, [userId])

  // Load AI hero hidden preference
  useEffect(() => {
    if (!userId) return
    const hidden = localStorage.getItem(`notebuddy-ai-hero-hidden-${userId}`)
    setAiHeroHidden(hidden === '1')
  }, [userId])

  function hideAiHero() {
    setAiHeroHidden(true)
    if (userId) localStorage.setItem(`notebuddy-ai-hero-hidden-${userId}`, '1')
  }

  function showAiHero() {
    setAiHeroHidden(false)
    if (userId) localStorage.removeItem(`notebuddy-ai-hero-hidden-${userId}`)
  }

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
          <h1 className="text-2xl font-bold">{(() => {
            const hour = new Date().getHours()
            const greeting = hour < 12 ? t.dashboard.goodMorning : hour < 18 ? t.dashboard.goodAfternoon : t.dashboard.goodEvening
            const name = profile?.display_name
            return name ? `${greeting}, ${name}!` : `${greeting}!`
          })()}</h1>
          <p className="text-muted-foreground">{t.dashboard.greeting}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setTutorialOpen(true)} className="gap-1.5 text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{t.dashboard.showTutorial}</span>
        </Button>
      </div>

      {/* AI Hero Section */}
      {aiHeroHidden ? (
        <button
          onClick={showAiHero}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/12 to-fuchsia-500/12 dark:from-indigo-600/20 dark:to-fuchsia-600/20 border border-indigo-300/40 dark:border-indigo-500/30 hover:from-indigo-500/20 hover:to-fuchsia-500/20 dark:hover:from-indigo-600/30 dark:hover:to-fuchsia-600/30 backdrop-blur-sm transition-all text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 animate-in fade-in duration-300"
        >
          <Sparkles className="h-4 w-4" />
          {t.dashboard.aiPoweredTools}
        </button>
      ) : (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/22 via-purple-500/18 to-fuchsia-500/22 dark:from-indigo-600 dark:via-purple-600 dark:to-fuchsia-600 p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-500 shadow-md border border-indigo-300/30 dark:border-transparent backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-purple-300/15 dark:from-white/5 dark:via-transparent dark:to-black/10" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-400/10 dark:bg-white/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-fuchsia-400/10 dark:bg-fuchsia-400/10 blur-3xl" />
        <button
          onClick={hideAiHero}
          className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-indigo-400 dark:text-white/60 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-200/40 dark:hover:bg-white/10 transition-colors"
          title="Hide"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-indigo-500/15 dark:bg-white/20 p-2 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-indigo-700 dark:text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-indigo-900 dark:text-white">{t.dashboard.aiPoweredTools}</h2>
          </div>
          <p className="text-indigo-800/60 dark:text-white/80 text-sm mb-6 max-w-lg">{t.dashboard.aiHeroDesc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/ai-tools" className="group flex items-center gap-4 rounded-xl bg-white/35 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 backdrop-blur-sm border border-indigo-200/40 dark:border-white/20 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <div className="rounded-lg bg-blue-500/12 dark:bg-blue-400/30 p-3 shrink-0 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/40 transition-colors">
                <Camera className="h-6 w-6 text-blue-700 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-indigo-900 dark:text-white font-semibold text-sm">{t.dashboard.scanNotes}</p>
                <p className="text-indigo-600/70 dark:text-white/70 text-xs mt-0.5">{t.dashboard.scanNotesDesc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-indigo-400 dark:text-white/60 group-hover:text-indigo-700 dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
            <Link to="/ai-tools" className="group flex items-center gap-4 rounded-xl bg-white/35 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 backdrop-blur-sm border border-indigo-200/40 dark:border-white/20 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <div className="rounded-lg bg-purple-500/12 dark:bg-purple-400/30 p-3 shrink-0 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-400/40 transition-colors">
                <Wand2 className="h-6 w-6 text-purple-700 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-indigo-900 dark:text-white font-semibold text-sm">{t.dashboard.enhance}</p>
                <p className="text-indigo-600/70 dark:text-white/70 text-xs mt-0.5">{t.dashboard.enhanceDesc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-indigo-400 dark:text-white/60 group-hover:text-indigo-700 dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
            <Link to="/ai-tools" className="group flex items-center gap-4 rounded-xl bg-white/35 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 backdrop-blur-sm border border-indigo-200/40 dark:border-white/20 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <div className="rounded-lg bg-green-500/12 dark:bg-green-400/30 p-3 shrink-0 group-hover:bg-green-500/20 dark:group-hover:bg-green-400/40 transition-colors">
                <Brain className="h-6 w-6 text-green-700 dark:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-indigo-900 dark:text-white font-semibold text-sm">{t.dashboard.generateQuiz}</p>
                <p className="text-indigo-600/70 dark:text-white/70 text-xs mt-0.5">{t.dashboard.generateQuizDesc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-indigo-400 dark:text-white/60 group-hover:text-indigo-700 dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          </div>
        </div>
      </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-grid">
        <Link to="/analytics">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.studyTime}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-count-up">{formatDuration(stats.totalStudyTime)}</div>
              <p className="text-xs text-muted-foreground">{stats.totalSessions} {t.common.sessions}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.streak}</CardTitle>
              <Flame className="h-4 w-4 text-orange-500 pulse-ring" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-count-up">{stats.streak} {t.common.days}</div>
              <p className="text-xs text-muted-foreground">{t.dashboard.keepItUp}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/subjects">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.subjects}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-count-up">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">{t.dashboard.activeSubjects}</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t.dashboard.mastered}</CardTitle>
              <Brain className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-count-up">{stats.masteredCards}</div>
              <p className="text-xs text-muted-foreground">{t.common.of} {stats.totalFlashcards} {t.common.cards}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

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

          <Link to="/achievements">
            <Card className="card-hover-lift cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500 animate-float" />
                    {t.dashboard.achievements}
                  </CardTitle>
                  <span className="text-xs text-primary">{t.common.viewAll}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 animate-progress">
                  <Progress value={(achievementProgress.unlocked / achievementProgress.total) * 100} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{achievementProgress.unlocked}/{achievementProgress.total}</span>
                </div>
              </CardContent>
            </Card>
          </Link>

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
            <div className="flex items-center justify-between">
              <CardTitle>{t.dashboard.recentActivity}</CardTitle>
              <Link to="/schedule" className="text-xs text-primary hover:underline">{t.common.viewAll}</Link>
            </div>
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

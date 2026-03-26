import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSubjects } from '@/hooks/useSubjects'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import { formatDuration } from '@/lib/utils'
import { format, subDays, startOfDay } from 'date-fns'
import { useTranslation } from '@/hooks/useTranslation'
import type { MasteryLevel } from '@/types'

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  new: '#6b7280',
  learning: '#ef4444',
  reviewing: '#f59e0b',
  mastered: '#22c55e',
}

export function AnalyticsPage() {
  const { subjects, stats, sessions } = useSubjects()
  const { state } = useSubjectsContext()
  const { t } = useTranslation()

  const allFlashcards = useMemo(() => {
    return state.studySets.flatMap(s => s.flashcards)
  }, [state.studySets])

  // Study time by day (last 7 days)
  const studyTimeByDay = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i))
      return { date, label: format(date, 'EEE'), minutes: 0 }
    })

    sessions.forEach(s => {
      const sessionDate = startOfDay(new Date(s.startTime))
      const dayEntry = days.find(d => d.date.getTime() === sessionDate.getTime())
      if (dayEntry) {
        dayEntry.minutes += Math.round(s.duration / 60)
      }
    })

    return days
  }, [sessions])

  // Mastery distribution
  const masteryDistribution = useMemo(() => {
    const counts: Record<MasteryLevel, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 }
    allFlashcards.forEach(c => { counts[c.mastery]++ })
    return [
      { name: t.analytics.new, value: counts.new, color: MASTERY_COLORS.new },
      { name: t.analytics.learning, value: counts.learning, color: MASTERY_COLORS.learning },
      { name: t.analytics.reviewing, value: counts.reviewing, color: MASTERY_COLORS.reviewing },
      { name: t.analytics.mastered, value: counts.mastered, color: MASTERY_COLORS.mastered },
    ].filter(d => d.value > 0)
  }, [allFlashcards, t])

  // Score trend over sessions
  const scoreTrend = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map((s, i) => ({
        session: i + 1,
        score: s.score ?? 0,
        label: format(new Date(s.startTime), 'MMM d'),
      }))
  }, [sessions])

  // Subject breakdown
  const subjectBreakdown = useMemo(() => {
    return subjects.map(sub => {
      const subSessions = sessions.filter(s => s.subjectId === sub.id)
      const totalTime = subSessions.reduce((t, s) => t + s.duration, 0)
      return {
        name: sub.name,
        color: sub.color,
        sessions: subSessions.length,
        minutes: Math.round(totalTime / 60),
      }
    }).filter(s => s.sessions > 0)
  }, [subjects, sessions])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold animate-in fade-in duration-500">{t.analytics.title}</h1>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-grid">
        <Link to="/schedule">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{t.analytics.totalStudyTime}</p>
              <p className="text-2xl font-bold animate-count-up">{formatDuration(stats.totalStudyTime)}</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/schedule">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{t.analytics.totalSessions}</p>
              <p className="text-2xl font-bold animate-count-up">{stats.totalSessions}</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/subjects">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{t.analytics.cardsMastered}</p>
              <p className="text-2xl font-bold animate-count-up">{stats.masteredCards} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalFlashcards}</span></p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/schedule">
          <Card className="card-hover-lift cursor-pointer h-full">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{t.analytics.avgScore}</p>
              <p className="text-2xl font-bold animate-count-up">
                {sessions.length > 0
                  ? Math.round(sessions.reduce((t, s) => t + (s.score ?? 0), 0) / sessions.length)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 stagger-grid">
        {/* Study time bar chart */}
        <Card className="card-hover-lift">
          <CardHeader>
            <CardTitle>{t.analytics.studyTime7Days}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={studyTimeByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                  formatter={(value) => [`${value} ${t.common.min}`, t.analytics.studyTimeLabel]}
                />
                <Bar dataKey="minutes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mastery pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t.analytics.masteryDist}</CardTitle>
          </CardHeader>
          <CardContent>
            {allFlashcards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">{t.analytics.noFlashcards}</p>
                <Link to="/subjects">
                  <Button size="sm" variant="outline">{t.analytics.noFlashcardsCta}</Button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={masteryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {masteryDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Score trend line chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t.analytics.scoreTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            {scoreTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">{t.analytics.completeSessions}</p>
                <Link to="/subjects">
                  <Button size="sm" variant="outline">{t.analytics.completeSessionsCta}</Button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                    formatter={(value) => [`${value}%`, t.analytics.scoreLabel]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name={t.analytics.scoreLabel} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Subject breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t.analytics.timeBySubject}</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">{t.analytics.noStudySessions}</p>
                <Link to="/subjects">
                  <Button size="sm" variant="outline">{t.analytics.noStudySessionsCta}</Button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: 12 }}
                    formatter={(value) => [`${value} ${t.common.min}`, t.analytics.studyTimeLabel]}
                  />
                  <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                    {subjectBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

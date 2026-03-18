import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
  AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSubjects } from '@/hooks/useSubjects'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import { getStudyRecommendation } from '@/lib/spaced-repetition'
import { formatDate, daysUntil } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths,
} from 'date-fns'

export function SchedulePage() {
  const { sessions } = useSubjects()
  const { state } = useSubjectsContext()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { t } = useTranslation()

  // Build calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const start = startOfWeek(monthStart)
    const end = endOfWeek(monthEnd)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Map sessions by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    sessions.forEach(s => {
      const key = format(new Date(s.startTime), 'yyyy-MM-dd')
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [sessions])

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    return state.studySets
      .filter(s => s.targetDate)
      .map(s => ({
        id: s.id,
        name: s.name,
        targetDate: s.targetDate!,
        daysLeft: daysUntil(s.targetDate!),
        cardCount: s.flashcards.length,
        subjectId: s.subjectId,
      }))
      .filter(d => d.daysLeft >= -1)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [state.studySets])

  // Due cards summary
  const dueCardsSummary = useMemo(() => {
    return state.studySets.map(set => {
      const rec = getStudyRecommendation(set.flashcards)
      return { setId: set.id, setName: set.name, ...rec }
    }).filter(s => s.dueCount > 0)
  }, [state.studySets])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.schedule.title}</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
                {t.common.today}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {[t.calendarDays.sun, t.calendarDays.mon, t.calendarDays.tue, t.calendarDays.wed, t.calendarDays.thu, t.calendarDays.fri, t.calendarDays.sat].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {calendarDays.map(day => {
                const key = format(day, 'yyyy-MM-dd')
                const count = sessionsByDate[key] || 0
                const hasDeadline = upcomingDeadlines.some(d => isSameDay(new Date(d.targetDate), day))
                return (
                  <div
                    key={key}
                    className={`relative flex flex-col items-center justify-center h-12 text-sm rounded-lg transition-colors ${
                      !isSameMonth(day, currentMonth) ? 'text-muted-foreground/40' :
                      isToday(day) ? 'bg-primary text-primary-foreground font-bold' :
                      count > 0 ? 'bg-green-500/15 text-foreground' :
                      'text-foreground hover:bg-accent'
                    }`}
                  >
                    {format(day, 'd')}
                    {count > 0 && !isToday(day) && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-green-500" />
                        ))}
                      </div>
                    )}
                    {hasDeadline && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" /> {t.schedule.studySession}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" /> {t.schedule.deadline}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: Due cards + Deadlines */}
        <div className="space-y-6">
          {/* Due for Review */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t.schedule.dueForReview}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dueCardsSummary.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.schedule.allCaughtUp}
                </div>
              ) : (
                <div className="space-y-2">
                  {dueCardsSummary.map(s => (
                    <Link key={s.setId} to={`/study/${s.setId}`} className="block">
                      <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-accent transition-colors">
                        <span className="font-medium truncate">{s.setName}</span>
                        <Badge variant={s.urgentCount > 0 ? 'destructive' : 'secondary'} className="text-xs">
                          {s.dueCount} {t.common.due}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t.schedule.upcomingDeadlines}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.schedule.noDeadlines}</p>
              ) : (
                <div className="space-y-2">
                  {upcomingDeadlines.map(d => (
                    <Link key={d.id} to={`/study-sets/${d.id}`} className="block">
                      <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-accent transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(d.targetDate)}</p>
                        </div>
                        <Badge variant={d.daysLeft <= 2 ? 'destructive' : d.daysLeft <= 5 ? 'secondary' : 'outline'} className="text-xs shrink-0">
                          {d.daysLeft <= 0 ? t.schedule.dueExcl : `${d.daysLeft}${t.common.daysLeft}`}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

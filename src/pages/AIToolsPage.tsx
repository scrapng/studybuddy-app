import { Link } from 'react-router-dom'
import { Sparkles, Camera, Wand2, Brain, BookOpen, ArrowRight, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import { useSubjects } from '@/hooks/useSubjects'
import { useTranslation } from '@/hooks/useTranslation'

export function AIToolsPage() {
  const { state } = useSubjectsContext()
  const { subjects } = useSubjects()
  const { t } = useTranslation()

  const studySetsWithNotes = state.studySets.filter(s => s.notes.length > 0)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-fuchsia-500/10 border border-purple-200 dark:border-purple-800/50 p-6 md:p-8 animate-in fade-in duration-500">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold">{t.ai.title}</h1>
          </div>
          <p className="text-muted-foreground max-w-lg">{t.ai.heroDesc}</p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-grid">
        <Card className="card-hover-lift group border-blue-200/50 dark:border-blue-800/30">
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-blue-500/10 p-3.5 group-hover:bg-blue-500/20 transition-colors shrink-0">
                <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{t.ai.scanPhotoNotes}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t.ai.scanPhotoSubtitle}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-sm text-muted-foreground mb-4">{t.ai.scanPhotoDesc}</p>
            <p className="text-xs text-muted-foreground mb-3">{t.ai.chooseSet}</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {state.studySets.length === 0 ? (
                <div className="flex flex-col items-center py-3 text-center">
                  <p className="text-xs text-muted-foreground italic mb-3">{t.ai.noSetsYet}</p>
                  <Link to="/subjects">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                      <Plus className="h-3 w-3" />
                      {t.ai.noSetsCta}
                    </Button>
                  </Link>
                </div>
              ) : (
                state.studySets.slice(0, 5).map(set => {
                  const sub = subjects.find(s => s.id === set.subjectId)
                  return (
                    <Link key={set.id} to={`/study-sets/${set.id}?tab=notes&action=scan`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-sm group/item">
                      <span className="truncate">{set.name}</span>
                      <div className="flex items-center gap-1.5">
                        {sub && <Badge variant="secondary" className="text-[10px] h-4" style={{ color: sub.color }}>{sub.name}</Badge>}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )
                })
              )}
              {state.studySets.length > 5 && (
                <Link to="/subjects" className="text-xs text-primary hover:underline block text-center pt-1">{t.ai.viewAllSets}</Link>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift group border-purple-200/50 dark:border-purple-800/30">
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-purple-500/10 p-3.5 group-hover:bg-purple-500/20 transition-colors shrink-0">
                <Wand2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{t.ai.enhanceNotes}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t.ai.enhanceSubtitle}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-sm text-muted-foreground mb-4">{t.ai.enhanceDesc}</p>
            <p className="text-xs text-muted-foreground mb-3">{t.ai.setsWithNotes}</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {studySetsWithNotes.length === 0 ? (
                <div className="flex flex-col items-center py-3 text-center">
                  <p className="text-xs text-muted-foreground italic mb-3">{t.ai.noNotesEnhance}</p>
                  <Link to="/subjects">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                      {t.ai.noNotesCta}
                    </Button>
                  </Link>
                </div>
              ) : (
                studySetsWithNotes.slice(0, 5).map(set => {
                  const sub = subjects.find(s => s.id === set.subjectId)
                  return (
                    <Link key={set.id} to={`/study-sets/${set.id}?tab=notes`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-sm group/item">
                      <span className="truncate">{set.name}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] h-4">{set.notes.length} {t.common.notes}</Badge>
                        {sub && <Badge variant="secondary" className="text-[10px] h-4" style={{ color: sub.color }}>{sub.name}</Badge>}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift group border-green-200/50 dark:border-green-800/30">
          <CardHeader className="pb-3 pt-6 px-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-green-500/10 p-3.5 group-hover:bg-green-500/20 transition-colors shrink-0">
                <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{t.ai.generateQuizFlashcards}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t.ai.generateSubtitle}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <p className="text-sm text-muted-foreground mb-4">{t.ai.generateDesc}</p>
            <p className="text-xs text-muted-foreground mb-3">{t.ai.setsWithNotes}</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {studySetsWithNotes.length === 0 ? (
                <div className="flex flex-col items-center py-3 text-center">
                  <p className="text-xs text-muted-foreground italic mb-3">{t.ai.noNotesGenerate}</p>
                  <Link to="/subjects">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                      {t.ai.noNotesCta}
                    </Button>
                  </Link>
                </div>
              ) : (
                studySetsWithNotes.slice(0, 5).map(set => {
                  const sub = subjects.find(s => s.id === set.subjectId)
                  return (
                    <Link key={set.id} to={`/study-sets/${set.id}?tab=notes`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-sm group/item">
                      <span className="truncate">{set.name}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] h-4">{set.notes.length} {t.common.notes}</Badge>
                        {sub && <Badge variant="secondary" className="text-[10px] h-4" style={{ color: sub.color }}>{sub.name}</Badge>}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start */}
      {state.studySets.length > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t.ai.quickStart}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{t.ai.quickStartDesc}</p>
            <div className="flex flex-wrap gap-2">
              {state.studySets.slice(0, 8).map(set => (
                <Link key={set.id} to={`/study-sets/${set.id}?tab=notes`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent transition-colors py-1 px-2.5">
                    {set.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

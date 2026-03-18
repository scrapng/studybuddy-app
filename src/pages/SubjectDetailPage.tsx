import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, MoreVertical, Pencil, Trash2, Play, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DifficultyBadge } from '@/components/shared/DifficultyBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StudySetForm } from '@/components/study-sets/StudySetForm'
import { useSubjects } from '@/hooks/useSubjects'
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { getIcon } from '@/lib/icons'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { StudySet } from '@/types'

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { getSubjectById } = useSubjects()
  const { getStudySetsBySubject, deleteStudySet } = useStudySets()
  const { t } = useTranslation()

  const subject = getSubjectById(subjectId!)
  const sets = getStudySetsBySubject(subjectId!)

  const [formOpen, setFormOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<StudySet | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (!subject) {
    return (
      <div className="space-y-4">
        <Link to="/subjects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{t.subjectDetail.backToSubjects}
        </Link>
        <p className="text-muted-foreground">{t.subjectDetail.subjectNotFound}</p>
      </div>
    )
  }

  const Icon = getIcon(subject.icon)

  return (
    <div className="space-y-6">
      <Link to="/subjects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />{t.subjectDetail.backToSubjects}
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: subject.color + '20', color: subject.color }}
          >
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            {subject.description && (
              <p className="text-muted-foreground">{subject.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => { setEditingSet(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          {t.subjectDetail.newStudySet}
        </Button>
      </div>

      {sets.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t.subjectDetail.noStudySets}
          description={t.subjectDetail.noStudySetsDesc}
          actionLabel={t.subjectDetail.createStudySet}
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map(set => {
            const total = set.flashcards.length
            const mastered = set.flashcards.filter(f => f.mastery === 'mastered').length
            const progress = total > 0 ? Math.round((mastered / total) * 100) : 0

            return (
              <Card key={set.id} className="group">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <Link to={`/study-sets/${set.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{set.name}</h3>
                    {set.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{set.description}</p>
                    )}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}>
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {total > 0 && (
                        <DropdownMenuItem onClick={() => navigate(`/study/${set.id}`)}>
                          <Play className="mr-2 h-4 w-4" />
                          {t.subjectDetail.studyNow}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => { setEditingSet(set); setFormOpen(true) }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(set.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <Link to={`/study-sets/${set.id}`} className="block space-y-3">
                    <div className="flex items-center gap-2">
                      <DifficultyBadge difficulty={set.difficulty} />
                      {set.targetDate && (
                        <span className="text-xs text-muted-foreground">{t.common.due} {formatDate(set.targetDate)}</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{total} {t.common.cards}</span>
                      <span>{set.notes.length} {t.common.notes}</span>
                      <span>{set.questions.length} {t.questionList.nQuestions}</span>
                    </div>
                    {total > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t.common.progress}</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <StudySetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        subjectId={subjectId!}
        studySet={editingSet}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t.subjectDetail.deleteStudySetTitle}
        description={t.subjectDetail.deleteStudySetDesc}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          if (deleteId) {
            deleteStudySet(deleteId)
            toast.success(t.subjectDetail.studySetDeleted)
          }
        }}
      />
    </div>
  )
}

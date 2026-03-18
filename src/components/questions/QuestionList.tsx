import { useState } from 'react'
import { Plus, Trash2, Pencil, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DifficultyBadge } from '@/components/shared/DifficultyBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { QuestionEditor } from './QuestionEditor'
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import type { Question } from '@/types'

interface QuestionListProps {
  setId: string
  questions: Question[]
}

export function QuestionList({ setId, questions }: QuestionListProps) {
  const { deleteQuestion } = useStudySets()
  const { t } = useTranslation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const TYPE_LABELS: Record<string, string> = {
    'multiple-choice': t.questionEditor.multipleChoice,
    'true-false': t.questionEditor.trueFalse,
    'short-answer': t.questionEditor.shortAnswer,
    'fill-blank': t.questionEditor.fillBlank,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{questions.length} {t.questionList.nQuestions}</p>
        <Button size="sm" onClick={() => { setEditingQ(null); setEditorOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          {t.questionList.addQuestion}
        </Button>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title={t.questionList.noQuestions}
          description={t.questionList.noQuestionsDesc}
          actionLabel={t.questionList.addQuestion}
          onAction={() => setEditorOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={q.id} className="group">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground font-medium">Q{i + 1}</span>
                      <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[q.type]}</Badge>
                      <DifficultyBadge difficulty={q.difficulty} />
                    </div>
                    <p className="text-sm font-medium mb-1">{q.questionText}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.questionList.answerLabel}: <span className="text-foreground font-medium">{q.correctAnswer}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingQ(q); setEditorOpen(true) }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteId(q.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuestionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        setId={setId}
        question={editingQ}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t.questionList.deleteTitle}
        description={t.questionList.deleteDesc}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          if (deleteId) {
            deleteQuestion(setId, deleteId)
            toast.success(t.questionList.questionDeleted)
          }
        }}
      />
    </div>
  )
}

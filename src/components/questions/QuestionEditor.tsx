import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import type { Question, QuestionType, Difficulty } from '@/types'

interface QuestionEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setId: string
  question?: Question | null
}

export function QuestionEditor({ open, onOpenChange, setId, question }: QuestionEditorProps) {
  const { addQuestion, updateQuestion } = useStudySets()
  const { t } = useTranslation()
  const [type, setType] = useState<QuestionType>('multiple-choice')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  useEffect(() => {
    if (question) {
      setType(question.type)
      setQuestionText(question.questionText)
      setOptions(question.options.length > 0 ? question.options : ['', ''])
      setCorrectAnswer(question.correctAnswer)
      setExplanation(question.explanation)
      setDifficulty(question.difficulty)
    } else {
      setType('multiple-choice')
      setQuestionText('')
      setOptions(['', ''])
      setCorrectAnswer('')
      setExplanation('')
      setDifficulty('medium')
    }
  }, [question, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim() || !correctAnswer.trim()) return

    const data = {
      type,
      questionText: questionText.trim(),
      options: type === 'multiple-choice' ? options.filter(o => o.trim()) : type === 'true-false' ? [t.questionEditor.trueValue, t.questionEditor.falseValue] : [],
      correctAnswer: correctAnswer.trim(),
      explanation: explanation.trim(),
      difficulty,
    }

    if (question) {
      updateQuestion(setId, { ...question, ...data })
      toast.success(t.questionEditor.questionUpdated)
    } else {
      addQuestion(setId, data)
      toast.success(t.questionEditor.questionCreated)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{question ? t.questionEditor.editQuestion : t.questionEditor.newQuestion}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.common.type}</Label>
                <Select value={type} onValueChange={v => {
                  setType(v as QuestionType)
                  if (v === 'true-false') setCorrectAnswer(t.questionEditor.trueValue)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">{t.questionEditor.multipleChoice}</SelectItem>
                    <SelectItem value="true-false">{t.questionEditor.trueFalse}</SelectItem>
                    <SelectItem value="short-answer">{t.questionEditor.shortAnswer}</SelectItem>
                    <SelectItem value="fill-blank">{t.questionEditor.fillBlank}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.common.difficulty}</Label>
                <Select value={difficulty} onValueChange={v => setDifficulty(v as Difficulty)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t.difficulty.easy}</SelectItem>
                    <SelectItem value="medium">{t.difficulty.medium}</SelectItem>
                    <SelectItem value="hard">{t.difficulty.hard}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.common.question}</Label>
              <Textarea
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                placeholder={type === 'fill-blank' ? t.questionEditor.fillBlankPlaceholder : t.questionEditor.questionPlaceholder}
                rows={3}
                autoFocus
              />
            </div>

            {type === 'multiple-choice' && (
              <div className="space-y-2">
                <Label>{t.common.options}</Label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={e => {
                        const newOpts = [...options]
                        newOpts[i] = e.target.value
                        setOptions(newOpts)
                      }}
                      placeholder={`${t.questionEditor.optionN} ${i + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => setOptions(options.filter((_, j) => j !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 5 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, ''])}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t.common.addOption}
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t.questionEditor.correctAnswer}</Label>
              {type === 'true-false' ? (
                <Select value={correctAnswer} onValueChange={v => v && setCorrectAnswer(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={t.questionEditor.trueValue}>{t.questionEditor.trueValue}</SelectItem>
                    <SelectItem value={t.questionEditor.falseValue}>{t.questionEditor.falseValue}</SelectItem>
                  </SelectContent>
                </Select>
              ) : type === 'multiple-choice' ? (
                <Select value={correctAnswer} onValueChange={v => v && setCorrectAnswer(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.questionEditor.selectCorrectOption} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.filter(o => o.trim()).map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={correctAnswer}
                  onChange={e => setCorrectAnswer(e.target.value)}
                  placeholder={t.questionEditor.enterCorrectAnswer}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{t.questionEditor.explanation}</Label>
              <Textarea
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder={t.questionEditor.explanationPlaceholder}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!questionText.trim() || !correctAnswer.trim()}>
              {question ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

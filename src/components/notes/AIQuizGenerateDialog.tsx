import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Loader2, FileQuestion, Layers } from 'lucide-react'
import { useStudySets } from '@/hooks/useStudySets'
import { useSubjects } from '@/hooks/useSubjects'
import { generateQuizFromNotes, generateFlashcardsFromNotes } from '@/lib/ai-service'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import type { Note } from '@/types'
import { cn } from '@/lib/utils'

interface AIQuizGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setId: string
  notes: Note[]
}

type GenerateMode = 'quiz' | 'flashcards'

export function AIQuizGenerateDialog({ open, onOpenChange, setId, notes }: AIQuizGenerateDialogProps) {
  const { addQuestion, addFlashcard, getStudySetById } = useStudySets()
  const { getSubjectById } = useSubjects()
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [count, setCount] = useState(5)
  const [mode, setMode] = useState<GenerateMode>('quiz')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const { t, lang } = useTranslation()
  const studySet = getStudySetById(setId)
  const subject = studySet ? getSubjectById(studySet.subjectId) : undefined
  const subjectName = subject?.name

  const toggleNote = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]
    )
  }

  const handleGenerate = async () => {
    if (selectedNotes.length === 0) {
      toast.error(t.aiQuiz.selectAtLeastOne)
      return
    }

    const selectedContent = notes
      .filter(n => selectedNotes.includes(n.id))
      .map(n => `## ${n.title}\n${n.body}`)
      .join('\n\n')

    setIsLoading(true)
    setGeneratedCount(0)

    try {
      if (mode === 'quiz') {
        const questions = await generateQuizFromNotes(selectedContent, count, lang, subjectName)
        questions.forEach(q => {
          addQuestion(setId, q)
        })
        setGeneratedCount(questions.length)
        toast.success(`${t.aiQuiz.successGenerated} ${questions.length} ${t.aiQuiz.questions}!`)
      } else {
        const flashcards = await generateFlashcardsFromNotes(selectedContent, count, lang, subjectName)
        flashcards.forEach(fc => {
          addFlashcard(setId, fc)
        })
        setGeneratedCount(flashcards.length)
        toast.success(`${t.aiQuiz.successGenerated} ${flashcards.length} ${t.aiQuiz.flashcards}!`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            {t.aiQuiz.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode selection */}
          <div>
            <Label className="mb-2 block">{t.aiQuiz.generate}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('quiz')}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-3 transition-all',
                  mode === 'quiz'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-border hover:border-purple-300'
                )}
              >
                <FileQuestion className="h-5 w-5 text-purple-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">{t.aiQuiz.quizQuestions}</p>
                  <p className="text-xs text-muted-foreground">{t.aiQuiz.mcTFShort}</p>
                </div>
              </button>
              <button
                onClick={() => setMode('flashcards')}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-3 transition-all',
                  mode === 'flashcards'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-border hover:border-purple-300'
                )}
              >
                <Layers className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">{t.aiQuiz.flashcardsLabel}</p>
                  <p className="text-xs text-muted-foreground">{t.aiQuiz.qaCards}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Note selection */}
          <div>
            <Label className="mb-2 block">{t.aiQuiz.selectNotes} ({selectedNotes.length} {t.aiQuiz.selected})</Label>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t.aiQuiz.noNotes}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => toggleNote(note.id)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3 transition-all',
                      selectedNotes.includes(note.id)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <p className="text-sm font-medium truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{note.body}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Count */}
          <div>
            <Label className="mb-2 block">
              {t.aiQuiz.numberOf} {mode === 'quiz' ? t.aiQuiz.questions : t.aiQuiz.flashcards}
            </Label>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map(n => (
                <Button
                  key={n}
                  variant={count === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCount(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>


          {generatedCount > 0 && !isLoading && (
            <Card className="border-green-200 dark:border-green-900/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardContent className="pt-4 text-center">
                <p className="text-green-600 dark:text-green-400 font-medium">
                  {t.aiQuiz.successGenerated} {generatedCount} {mode === 'quiz' ? t.aiQuiz.questions : t.aiQuiz.flashcards}!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.aiQuiz.checkTab}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {generatedCount > 0 ? t.common.done : t.common.cancel}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || selectedNotes.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.common.generating}
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                {mode === 'quiz' ? t.aiQuiz.generateQuiz : t.aiQuiz.generateFlashcards}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

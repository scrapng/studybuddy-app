import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import type { Flashcard, Difficulty } from '@/types'

interface FlashcardEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setId: string
  flashcard?: Flashcard | null
}

export function FlashcardEditor({ open, onOpenChange, setId, flashcard }: FlashcardEditorProps) {
  const { addFlashcard, updateFlashcard } = useStudySets()
  const { t } = useTranslation()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front)
      setBack(flashcard.back)
      setDifficulty(flashcard.difficulty)
    } else {
      setFront('')
      setBack('')
      setDifficulty('medium')
    }
  }, [flashcard, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return

    if (flashcard) {
      updateFlashcard(setId, { ...flashcard, front: front.trim(), back: back.trim(), difficulty })
      toast.success(t.flashcardEditor.flashcardUpdated)
    } else {
      addFlashcard(setId, { front: front.trim(), back: back.trim(), difficulty })
      toast.success(t.flashcardEditor.flashcardCreated)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{flashcard ? t.flashcardEditor.editFlashcard : t.flashcardEditor.newFlashcard}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fc-front">{t.flashcardEditor.frontQuestion}</Label>
              <Textarea
                id="fc-front"
                value={front}
                onChange={e => setFront(e.target.value)}
                placeholder={t.flashcardEditor.frontPlaceholder}
                rows={3}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fc-back">{t.flashcardEditor.backAnswer}</Label>
              <Textarea
                id="fc-back"
                value={back}
                onChange={e => setBack(e.target.value)}
                placeholder={t.flashcardEditor.backPlaceholder}
                rows={3}
              />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!front.trim() || !back.trim()}>
              {flashcard ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import type { StudySet, Difficulty } from '@/types'

interface StudySetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectId: string
  studySet?: StudySet | null
}

export function StudySetForm({ open, onOpenChange, subjectId, studySet }: StudySetFormProps) {
  const { addStudySet, updateStudySet } = useStudySets()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [targetDate, setTargetDate] = useState('')

  useEffect(() => {
    if (studySet) {
      setName(studySet.name)
      setDescription(studySet.description)
      setDifficulty(studySet.difficulty)
      setTargetDate(studySet.targetDate ? studySet.targetDate.split('T')[0] : '')
    } else {
      setName('')
      setDescription('')
      setDifficulty('medium')
      setTargetDate('')
    }
  }, [studySet, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (studySet) {
      updateStudySet({
        ...studySet,
        name: name.trim(),
        description: description.trim(),
        difficulty,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      })
      toast.success(t.studySetForm.studySetUpdated)
    } else {
      addStudySet({
        subjectId,
        name: name.trim(),
        description: description.trim(),
        difficulty,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      })
      toast.success(t.studySetForm.studySetCreated)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{studySet ? t.studySetForm.editStudySet : t.studySetForm.newStudySet}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="set-name">{t.common.name}</Label>
              <Input
                id="set-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.studySetForm.namePlaceholder}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="set-desc">{t.common.description}</Label>
              <Textarea
                id="set-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.studySetForm.descPlaceholder}
                rows={2}
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

            <div className="space-y-2">
              <Label htmlFor="target-date">{t.studySetForm.targetDateOptional}</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {studySet ? t.common.saveChanges : t.studySetForm.newStudySet}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

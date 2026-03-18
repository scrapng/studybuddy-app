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
import type { Goal, GoalStatus } from '@/types'

interface GoalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setId: string
  goal?: Goal | null
}

export function GoalForm({ open, onOpenChange, setId, goal }: GoalFormProps) {
  const { addGoal, updateGoal } = useStudySets()
  const { t } = useTranslation()
  const [description, setDescription] = useState('')
  const [targetProficiency, setTargetProficiency] = useState('80')
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState<GoalStatus>('not-started')

  useEffect(() => {
    if (goal) {
      setDescription(goal.description)
      setTargetProficiency(String(goal.targetProficiency))
      setDeadline(goal.deadline ? goal.deadline.split('T')[0] : '')
      setStatus(goal.status)
    } else {
      setDescription('')
      setTargetProficiency('80')
      setDeadline('')
      setStatus('not-started')
    }
  }, [goal, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    const data = {
      description: description.trim(),
      targetProficiency: Number(targetProficiency) || 80,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
    }

    if (goal) {
      updateGoal(setId, { ...goal, ...data })
      toast.success(t.goalForm.goalUpdated)
    } else {
      addGoal(setId, data)
      toast.success(t.goalForm.goalCreated)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{goal ? t.goalForm.editGoal : t.goalForm.newGoal}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.common.description}</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.goalForm.descPlaceholder}
                rows={2}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.goalForm.targetPercent}</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={targetProficiency}
                  onChange={e => setTargetProficiency(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.common.status}</Label>
                <Select value={status} onValueChange={v => setStatus(v as GoalStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">{t.goalForm.notStarted}</SelectItem>
                    <SelectItem value="in-progress">{t.goalForm.inProgress}</SelectItem>
                    <SelectItem value="completed">{t.goalForm.completed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.goalForm.deadlineOptional}</Label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!description.trim()}>
              {goal ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

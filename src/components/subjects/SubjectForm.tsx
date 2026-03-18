import { useState, useEffect } from 'react'
import { getIcon } from '@/lib/icons'
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
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useSubjects } from '@/hooks/useSubjects'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import type { Subject } from '@/types'
import { Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SubjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject?: Subject | null
}

export function SubjectForm({ open, onOpenChange, subject }: SubjectFormProps) {
  const { addSubject, updateSubject } = useSubjects()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])

  useEffect(() => {
    if (subject) {
      setName(subject.name)
      setDescription(subject.description)
      setColor(subject.color)
      setIcon(subject.icon)
    } else {
      setName('')
      setDescription('')
      setColor(SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)])
      setIcon(SUBJECT_ICONS[0])
    }
  }, [subject, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (subject) {
      updateSubject({ ...subject, name: name.trim(), description: description.trim(), color, icon })
      toast.success(t.subjectForm.subjectUpdated)
    } else {
      addSubject({ name: name.trim(), description: description.trim(), color, icon })
      toast.success(t.subjectForm.subjectCreated)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{subject ? t.subjectForm.editSubject : t.subjectForm.newSubject}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.common.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.subjectForm.namePlaceholder}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.common.description}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.subjectForm.descPlaceholder}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.common.color}</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-transform',
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.common.icon}</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_ICONS.map(iconName => {
                  const IconComp = getIcon(iconName)
                  return (
                    <Tooltip key={iconName}>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => setIcon(iconName)}
                            className={cn(
                              'h-9 w-9 rounded-lg flex items-center justify-center border transition-colors',
                              icon === iconName
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-transparent hover:bg-accent text-muted-foreground'
                            )}
                          />
                        }
                      >
                        <IconComp className="h-5 w-5" />
                      </TooltipTrigger>
                      <TooltipContent>{iconName}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {subject ? t.common.saveChanges : t.subjectForm.newSubject}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

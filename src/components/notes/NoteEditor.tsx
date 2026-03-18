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
import { NOTE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useStudySets } from '@/hooks/useStudySets'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import type { Note } from '@/types'
import { Check, X } from 'lucide-react'

interface NoteEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setId: string
  note?: Note | null
}

export function NoteEditor({ open, onOpenChange, setId, note }: NoteEditorProps) {
  const { addNote, updateNote } = useStudySets()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setBody(note.body)
      setTags(note.tags)
      setColor(note.color)
    } else {
      setTitle('')
      setBody('')
      setTags([])
      setTagInput('')
      setColor(null)
    }
  }, [note, open])

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (note) {
      updateNote(setId, { ...note, title: title.trim(), body: body.trim(), tags, color })
      toast.success(t.notes.noteUpdated)
    } else {
      addNote(setId, { title: title.trim(), body: body.trim(), tags, color, imageUrl: null, sourceType: 'manual' })
      toast.success(t.notes.noteCreated)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{note ? t.notes.editNote : t.notes.newNote}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">{t.notes.title}</Label>
              <Input
                id="note-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t.notes.titlePlaceholder}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-body">{t.notes.content}</Label>
              <Textarea
                id="note-body"
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={t.notes.contentPlaceholder}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.notes.tags}</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={t.notes.addTagsPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.notes.color}</Label>
              <div className="flex gap-2">
                {NOTE_COLORS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-transform',
                      color === c ? 'border-foreground scale-110' : 'border-border',
                      !c && 'bg-background'
                    )}
                    style={c ? { backgroundColor: c } : undefined}
                  >
                    {color === c && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {note ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

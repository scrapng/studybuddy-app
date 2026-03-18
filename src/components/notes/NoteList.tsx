import { useState } from 'react'
import { Plus, Pin, PinOff, Trash2, Pencil, StickyNote, Camera, Wand2, Brain, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { NoteEditor } from './NoteEditor'
import { PhotoNoteUpload } from './PhotoNoteUpload'
import { AIEnhanceDialog } from './AIEnhanceDialog'
import { AIQuizGenerateDialog } from './AIQuizGenerateDialog'
import { useStudySets } from '@/hooks/useStudySets'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import type { Note } from '@/types'

interface NoteListProps {
  setId: string
  notes: Note[]
}

export function NoteList({ setId, notes }: NoteListProps) {
  const { updateNote, deleteNote } = useStudySets()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [enhanceNote, setEnhanceNote] = useState<Note | null>(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const { t } = useTranslation()

  const sorted = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const sourceIcon = (note: Note) => {
    if (note.sourceType === 'ocr') return <ImageIcon className="h-3 w-3 text-blue-500 shrink-0" />
    if (note.sourceType === 'ai-enhanced') return <Wand2 className="h-3 w-3 text-purple-500 shrink-0" />
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{notes.length} {t.notes.notesCount}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setPhotoOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Camera className="h-4 w-4 mr-2" />
            {t.notes.scanPhoto}
          </Button>
          {notes.length > 0 && (
            <Button size="sm" onClick={() => setQuizOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Brain className="h-4 w-4 mr-2" />
              {t.notes.aiGenerate}
            </Button>
          )}
          <Button size="sm" onClick={() => { setEditingNote(null); setEditorOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            {t.notes.addNote}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={t.notes.noNotes}
          description={t.notes.noNotesDesc}
          actionLabel={t.notes.addNote}
          onAction={() => setEditorOpen(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(note => (
            <Card
              key={note.id}
              className={`group animate-in fade-in duration-300 ${note.sourceType === 'ai-enhanced' ? 'ring-1 ring-purple-200 dark:ring-purple-800/50' : ''}`}
              style={note.color ? { borderLeftWidth: 4, borderLeftColor: note.color } : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold line-clamp-1 flex-1 flex items-center gap-1.5">
                    {note.isPinned && <Pin className="h-3.5 w-3.5 inline text-muted-foreground shrink-0" />}
                    {sourceIcon(note)}
                    {note.title}
                  </CardTitle>
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-purple-500 hover:bg-purple-500/10"
                      onClick={() => setEnhanceNote(note)}
                      title={t.notes.enhanceAI}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateNote(setId, { ...note, isPinned: !note.isPinned })}
                      >
                        {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setEditingNote(note); setEditorOpen(true) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteId(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {note.imageUrl && (
                  <div className="mb-2 rounded overflow-hidden max-h-20">
                    <img src={note.imageUrl} alt="Note source" className="w-full object-cover" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line mb-3">{note.body}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                      <span key={tag} className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{getRelativeTime(note.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        setId={setId}
        note={editingNote}
      />

      <PhotoNoteUpload
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        setId={setId}
      />

      {enhanceNote && (
        <AIEnhanceDialog
          open={!!enhanceNote}
          onOpenChange={(open) => { if (!open) setEnhanceNote(null) }}
          setId={setId}
          note={enhanceNote}
        />
      )}

      <AIQuizGenerateDialog
        open={quizOpen}
        onOpenChange={setQuizOpen}
        setId={setId}
        notes={notes}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t.notes.deleteNoteTitle}
        description={t.notes.deleteNoteDesc}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          if (deleteId) {
            deleteNote(setId, deleteId)
            toast.success(t.notes.noteDeleted)
          }
        }}
      />
    </div>
  )
}

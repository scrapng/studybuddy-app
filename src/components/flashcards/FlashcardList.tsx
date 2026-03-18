import { useState } from 'react'
import { Plus, Trash2, Pencil, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DifficultyBadge } from '@/components/shared/DifficultyBadge'
import { MasteryIndicator } from '@/components/shared/MasteryIndicator'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FlashcardEditor } from './FlashcardEditor'
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'
import type { Flashcard } from '@/types'

interface FlashcardListProps {
  setId: string
  flashcards: Flashcard[]
}

export function FlashcardList({ setId, flashcards }: FlashcardListProps) {
  const { deleteFlashcard } = useStudySets()
  const { t } = useTranslation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{flashcards.length} {t.flashcardList.nFlashcards}</p>
        <Button size="sm" onClick={() => { setEditingCard(null); setEditorOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          {t.flashcardList.addFlashcard}
        </Button>
      </div>

      {flashcards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t.flashcardList.noFlashcards}
          description={t.flashcardList.noFlashcardsDesc}
          actionLabel={t.flashcardList.addFlashcard}
          onAction={() => setEditorOpen(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {flashcards.map(card => (
            <Card key={card.id} className="group">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium line-clamp-2 flex-1">{card.front}</p>
                  <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingCard(card); setEditorOpen(true) }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteId(card.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{card.back}</p>
                <div className="flex items-center justify-between">
                  <DifficultyBadge difficulty={card.difficulty} />
                  <MasteryIndicator mastery={card.mastery} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FlashcardEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        setId={setId}
        flashcard={editingCard}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t.flashcardList.deleteTitle}
        description={t.flashcardList.deleteDesc}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          if (deleteId) {
            deleteFlashcard(setId, deleteId)
            toast.success(t.flashcardList.flashcardDeleted)
          }
        }}
      />
    </div>
  )
}

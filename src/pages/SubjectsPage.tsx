import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, MoreVertical, Pencil, Trash2, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { SubjectForm } from '@/components/subjects/SubjectForm'
import { useSubjects } from '@/hooks/useSubjects'
import { getIcon } from '@/lib/icons'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import type { Subject } from '@/types'

export function SubjectsPage() {
  const { subjects, deleteSubject, getStudySetCountForSubject, getFlashcardCountForSubject } = useSubjects()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { t } = useTranslation()

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.subjects.title}</h1>
        <Button onClick={() => { setEditingSubject(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          {t.common.newSubject}
        </Button>
      </div>

      {subjects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.subjects.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 && subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t.subjects.noSubjects}
          description={t.subjects.noSubjectsDesc}
          actionLabel={t.subjects.createSubject}
          onAction={() => setFormOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">{t.subjects.noMatch}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(subject => {
            const Icon = getIcon(subject.icon)
            const setCount = getStudySetCountForSubject(subject.id)
            const cardCount = getFlashcardCountForSubject(subject.id)
            return (
              <Card key={subject.id} className="group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: subject.color }} />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <Link to={`/subjects/${subject.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="rounded-lg p-2 shrink-0"
                      style={{ backgroundColor: subject.color + '20', color: subject.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{subject.name}</h3>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground truncate">{subject.description}</p>
                      )}
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}>
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingSubject(subject); setFormOpen(true) }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(subject.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <Link to={`/subjects/${subject.id}`} className="block">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{setCount} {setCount === 1 ? t.common.set : t.common.sets}</span>
                      <span>{cardCount} {cardCount === 1 ? t.common.card : t.common.cards}</span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <SubjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        subject={editingSubject}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t.subjects.deleteTitle}
        description={t.subjects.deleteDesc}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          if (deleteId) {
            deleteSubject(deleteId)
            toast.success(t.subjects.deleteTitle)
          }
        }}
      />
    </div>
  )
}

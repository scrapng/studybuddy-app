import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Pencil, Trash2, FileQuestion, Download, Upload, Zap, Sparkles, Camera, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DifficultyBadge } from '@/components/shared/DifficultyBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StudySetForm } from '@/components/study-sets/StudySetForm'
import { FlashcardList } from '@/components/flashcards/FlashcardList'
import { NoteList } from '@/components/notes/NoteList'
import { QuestionList } from '@/components/questions/QuestionList'
import { GoalList } from '@/components/goals/GoalList'
import { ImportDialog } from '@/components/shared/ImportDialog'
import { PhotoNoteUpload } from '@/components/notes/PhotoNoteUpload'
import { AIQuizGenerateDialog } from '@/components/notes/AIQuizGenerateDialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useSubjects } from '@/hooks/useSubjects'
import { useStudySets } from '@/hooks/useStudySets'
import { formatDate } from '@/lib/utils'
import { exportStudySetAsJSON, downloadJSON } from '@/lib/import-export'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

export function StudySetPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { getSubjectById } = useSubjects()
  const { getStudySetById, deleteStudySet } = useStudySets()
  const { t } = useTranslation()

  const studySet = getStudySetById(setId!)
  const subject = studySet ? getSubjectById(studySet.subjectId) : undefined

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [aiQuizOpen, setAiQuizOpen] = useState(false)

  if (!studySet || !subject) {
    return (
      <div className="space-y-4">
        <Link to="/subjects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{t.studySet.back}
        </Link>
        <p className="text-muted-foreground">{t.studySet.notFound}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to={`/subjects/${subject.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {subject.name}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{studySet.name}</h1>
          {studySet.description && (
            <p className="text-muted-foreground mt-1">{studySet.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <DifficultyBadge difficulty={studySet.difficulty} />
            {studySet.targetDate && (
              <span className="text-sm text-muted-foreground">{t.common.due} {formatDate(studySet.targetDate)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" className="bg-purple-500/10 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20">
                <Sparkles className="mr-2 h-4 w-4" />
                {t.studySet.aiDropdown}
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPhotoOpen(true)}>
                <Camera className="mr-2 h-4 w-4 text-blue-500" />
                {t.studySet.scanPhoto}
              </DropdownMenuItem>
              {studySet.notes.length > 0 && (
                <DropdownMenuItem onClick={() => setAiQuizOpen(true)}>
                  <Brain className="mr-2 h-4 w-4 text-green-500" />
                  {t.studySet.generateQuiz}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {studySet.flashcards.length > 0 && (
            <Button onClick={() => navigate(`/study/${studySet.id}`)}>
              <Play className="mr-2 h-4 w-4" />
              {t.studySet.study}
            </Button>
          )}
          {studySet.questions.length > 0 && (
            <Button variant="outline" onClick={() => navigate(`/quiz/${studySet.id}`)}>
              <FileQuestion className="mr-2 h-4 w-4" />
              {t.studySet.quiz}
            </Button>
          )}
          {studySet.flashcards.length > 0 && (
            <Button variant="outline" onClick={() => navigate(`/challenge/${studySet.id}`)}>
              <Zap className="mr-2 h-4 w-4" />
              {t.studySet.challenge}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => {
            const json = exportStudySetAsJSON(studySet)
            downloadJSON(json, `${studySet.name.toLowerCase().replace(/\s+/g, '-')}.json`)
            toast.success(t.studySet.setExported)
          }}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setFormOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="flashcards">
        <TabsList>
          <TabsTrigger value="flashcards" className="gap-2">
            {t.studySet.flashcardsTab}
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{studySet.flashcards.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            {t.studySet.notesTab}
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{studySet.notes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            {t.studySet.questionsTab}
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{studySet.questions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            {t.studySet.goalsTab}
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">{studySet.goals.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards" className="mt-6">
          <FlashcardList setId={studySet.id} flashcards={studySet.flashcards} />
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
          <NoteList setId={studySet.id} notes={studySet.notes} />
        </TabsContent>
        <TabsContent value="questions" className="mt-6">
          <QuestionList setId={studySet.id} questions={studySet.questions} />
        </TabsContent>
        <TabsContent value="goals" className="mt-6">
          <GoalList setId={studySet.id} goals={studySet.goals} />
        </TabsContent>
      </Tabs>

      <StudySetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        subjectId={subject.id}
        studySet={studySet}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        subjectId={subject.id}
        setId={studySet.id}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t.studySet.deleteTitle}
        description={t.studySet.deleteDesc}
        confirmLabel={t.common.delete}
        onConfirm={() => {
          deleteStudySet(studySet.id)
          toast.success(t.studySet.setDeleted)
          navigate(`/subjects/${subject.id}`)
        }}
      />

      <PhotoNoteUpload
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        setId={studySet.id}
      />

      <AIQuizGenerateDialog
        open={aiQuizOpen}
        onOpenChange={setAiQuizOpen}
        setId={studySet.id}
        notes={studySet.notes}
      />
    </div>
  )
}

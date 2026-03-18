import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Wand2, Loader2, Copy, Check, ArrowRight } from 'lucide-react'
import { useStudySets } from '@/hooks/useStudySets'
import { useSubjects } from '@/hooks/useSubjects'
import { enhanceNotes, type EnhancementMode } from '@/lib/ai-service'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import type { Note } from '@/types'
import { cn } from '@/lib/utils'

interface AIEnhanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setId: string
  note: Note
}

export function AIEnhanceDialog({ open, onOpenChange, setId, note }: AIEnhanceDialogProps) {
  const { addNote, getStudySetById } = useStudySets()
  const { getSubjectById } = useSubjects()
  const [selectedMode, setSelectedMode] = useState<EnhancementMode>('simplify')
  const [enhancedText, setEnhancedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { t, lang } = useTranslation()
  const studySet = getStudySetById(setId)
  const subject = studySet ? getSubjectById(studySet.subjectId) : undefined
  const subjectName = subject?.name

  const handleEnhance = async () => {
    setIsLoading(true)
    setEnhancedText('')
    try {
      const result = await enhanceNotes(note.body, selectedMode, lang, subjectName)
      setEnhancedText(result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enhancement failed')
    } finally {
      setIsLoading(false)
    }
  }

  const ENHANCEMENT_MODES: Record<EnhancementMode, { label: string; description: string }> = {
    simplify: { label: t.aiEnhance.simplify, description: t.aiEnhance.simplifyDesc },
    detailed: { label: t.aiEnhance.detailed, description: t.aiEnhance.detailedDesc },
    'bullet-points': { label: t.aiEnhance.bulletPoints, description: t.aiEnhance.bulletPointsDesc },
    eli5: { label: t.aiEnhance.eli5, description: t.aiEnhance.eli5Desc },
    'exam-prep': { label: t.aiEnhance.examPrep, description: t.aiEnhance.examPrepDesc },
  }

  const handleSaveAsNew = () => {
    if (!enhancedText.trim()) return
    const modeLabel = ENHANCEMENT_MODES[selectedMode].label
    addNote(setId, {
      title: `${note.title} (${modeLabel})`,
      body: enhancedText.trim(),
      tags: [...note.tags, 'ai-enhanced', selectedMode],
      color: '#f3e8ff',
      imageUrl: null,
      sourceType: 'ai-enhanced',
    })
    toast.success(t.notes.noteCreated)
    onOpenChange(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(enhancedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            {t.aiEnhance.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-2">{t.aiEnhance.originalNote}: <span className="text-muted-foreground font-normal">{note.title}</span></p>
            <div className="bg-muted/50 rounded-lg p-3 text-sm max-h-32 overflow-y-auto whitespace-pre-line">
              {note.body}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{t.aiEnhance.enhancementMode}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.entries(ENHANCEMENT_MODES) as [EnhancementMode, { label: string; description: string }][]).map(
                ([mode, { label, description }]) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={cn(
                      'text-left rounded-lg border p-3 transition-all hover:border-purple-300 dark:hover:border-purple-700',
                      selectedMode === mode
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-border'
                    )}
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </button>
                ),
              )}
            </div>
          </div>

          <Button
            onClick={handleEnhance}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.common.enhancing}
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                {t.aiEnhance.enhanceNotes}
              </>
            )}
          </Button>

          {enhancedText && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  <ArrowRight className="h-3.5 w-3.5" />
                  {t.aiEnhance.enhancedVersion}
                </p>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? t.common.copied : t.common.copy}
                </Button>
              </div>
              <Textarea
                value={enhancedText}
                onChange={(e) => setEnhancedText(e.target.value)}
                rows={10}
                className="text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.close}
          </Button>
          {enhancedText && (
            <Button onClick={handleSaveAsNew}>
              {t.aiEnhance.saveAsNew}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

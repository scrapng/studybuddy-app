import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText } from 'lucide-react'
import { parseImportJSON, parseCSVFlashcards } from '@/lib/import-export'
import { useStudySets } from '@/hooks/useStudySets'
import { toast } from 'sonner'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectId: string
  setId?: string
}

export function ImportDialog({ open, onOpenChange, subjectId, setId }: ImportDialogProps) {
  const { importStudySet, addFlashcard } = useStudySets()
  const [jsonText, setJsonText] = useState('')
  const [csvText, setCsvText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleJSONImport = () => {
    const studySet = parseImportJSON(jsonText)
    if (!studySet) {
      toast.error('Invalid JSON format')
      return
    }
    importStudySet(subjectId, studySet)
    toast.success(`Imported "${studySet.name}" with ${studySet.flashcards.length} flashcards`)
    setJsonText('')
    onOpenChange(false)
  }

  const handleCSVImport = () => {
    if (!setId) {
      toast.error('Select a study set first')
      return
    }
    const cards = parseCSVFlashcards(csvText)
    if (cards.length === 0) {
      toast.error('No valid flashcards found in CSV')
      return
    }
    cards.forEach(c => addFlashcard(setId, c))
    toast.success(`Imported ${cards.length} flashcards`)
    setCsvText('')
    onOpenChange(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (file.name.endsWith('.json')) {
        setJsonText(text)
      } else {
        setCsvText(text)
      }
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="csv">
          <TabsList className="w-full">
            <TabsTrigger value="csv" className="flex-1">CSV Flashcards</TabsTrigger>
            <TabsTrigger value="json" className="flex-1">JSON Study Set</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Paste CSV/TSV data (front, back, difficulty)</Label>
              <Textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={"What is a variable?\tA symbol representing an unknown value\teasy\nWhat is the slope?\ty = mx + b, m is the slope\tmedium"}
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Supports tab, comma, or semicolon separators. Difficulty column is optional.
              </p>
            </div>
            <DialogFooter>
              <label>
                <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileUpload} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </label>
              <Button onClick={handleCSVImport} disabled={!csvText.trim() || !setId}>
                <FileText className="h-4 w-4 mr-2" />
                Import Cards
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="json" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Paste exported JSON</Label>
              <Textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='{"version": 1, "studySet": {"name": "...", ...}}'
                rows={6}
                className="font-mono text-xs"
              />
            </div>
            <DialogFooter>
              <label>
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </label>
              <Button onClick={handleJSONImport} disabled={!jsonText.trim()}>
                <FileText className="h-4 w-4 mr-2" />
                Import Study Set
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

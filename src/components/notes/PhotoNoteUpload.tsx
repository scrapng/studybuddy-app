import { useState, useRef, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Camera, Upload, Sparkles, Loader2, ImageIcon, Wand2 } from 'lucide-react'
import { useStudySets } from '@/hooks/useStudySets'
import { useSubjects } from '@/hooks/useSubjects'
import { enhanceOCRText, readImageWithAI } from '@/lib/ai-service'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import Tesseract from 'tesseract.js'

interface PhotoNoteUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  setId: string
}

type Step = 'upload' | 'processing' | 'review'

export function PhotoNoteUpload({ open, onOpenChange, setId }: PhotoNoteUploadProps) {
  const { addNote, getStudySetById } = useStudySets()
  const { getSubjectById } = useSubjects()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t, lang } = useTranslation()
  const studySet = getStudySetById(setId)
  const subject = studySet ? getSubjectById(studySet.subjectId) : undefined
  const subjectName = subject?.name

  const [step, setStep] = useState<Step>('upload')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [title, setTitle] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)

  const reset = useCallback(() => {
    setStep('upload')
    setImagePreview(null)
    setOcrProgress(0)
    setOcrStatus('')
    setExtractedText('')
    setTitle('')
    setIsEnhancing(false)
  }, [])

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
      setStep('processing')
      setTitle(file.name.replace(/\.[^.]+$/, ''))

      // Try AI vision first via backend
      try {
        setOcrStatus(t.photoUpload.readingImage)
        setOcrProgress(30)
        const text = await readImageWithAI(base64, lang, subjectName)
        if (text && text.trim().length > 0) {
          setExtractedText(text)
          setOcrProgress(100)
          setOcrStatus(t.photoUpload.done)
          setStep('review')
          return
        }
        // Empty response — fall through to Tesseract
        console.warn('AI OCR returned empty text, falling back to local OCR')
      } catch (error) {
        // Fall back to Tesseract
        console.warn('AI OCR failed, falling back to local OCR:', error)
      }

      setOcrStatus(t.photoUpload.fallingBack)
      setOcrProgress(10)

      // Local Tesseract OCR — use correct language
      const tesseractLang = lang === 'pl' ? 'pol+eng' : 'eng'
      try {
        setOcrStatus(t.photoUpload.initOCR)
        setOcrProgress(15)

        const result = await Tesseract.recognize(base64, tesseractLang, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(15 + Math.round((m.progress || 0) * 70))
              setOcrStatus(t.photoUpload.recognizing)
            } else if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
              setOcrStatus(t.photoUpload.initOCR)
            }
          },
        })

        let text = result.data.text.trim()
        setOcrProgress(88)

        if (text.length === 0) {
          toast.error(t.photoUpload.noTextFound)
          setStep('upload')
          return
        }

        // Enhance with AI via backend if text was extracted
        setOcrStatus(t.photoUpload.enhancingAI)
        try {
          const enhanced = await enhanceOCRText(text, lang, subjectName)
          if (enhanced && enhanced.trim().length > 0) {
            text = enhanced
          }
        } catch (error) {
          // Use raw text if AI fails
          console.warn('AI enhancement failed, using raw OCR text:', error)
        }

        setExtractedText(text)
        setOcrProgress(100)
        setOcrStatus(t.photoUpload.done)
        setStep('review')
      } catch (error) {
        console.error('Tesseract OCR failed:', error)
        toast.error(t.photoUpload.ocrFailed)
        setStep('upload')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleAIEnhance = async () => {
    setIsEnhancing(true)
    try {
      const enhanced = await enhanceOCRText(extractedText, lang, subjectName)
      setExtractedText(enhanced)
      toast.success('Text enhanced with AI')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enhancement failed')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleSave = () => {
    if (!title.trim() || !extractedText.trim()) return
    addNote(setId, {
      title: title.trim(),
      body: extractedText.trim(),
      tags: ['ocr', 'photo-notes'],
      color: '#e0e7ff',
      imageUrl: imagePreview,
      sourceType: 'ocr',
    })
    toast.success(t.notes.noteCreated)
    reset()
    onOpenChange(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-500" />
            {t.photoUpload.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-4 px-4">
          {step === 'upload' && (
            <div className="space-y-4 py-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-all animate-in fade-in duration-300"
              >
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 inline-block mb-4">
                  <ImageIcon className="h-10 w-10 text-blue-500" />
                </div>
                <p className="font-medium mb-1">{t.photoUpload.dropHere}</p>
                <p className="text-sm text-muted-foreground">
                  {t.photoUpload.supportedFormats}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-4 py-8 animate-in fade-in duration-300">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-primary mx-auto mb-4 animate-spin" />
                <p className="font-medium mb-2">{ocrStatus}</p>
                <Progress value={ocrProgress} className="h-2 max-w-xs mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">{ocrProgress}%</p>
              </div>
              {imagePreview && (
                <div className="max-h-32 overflow-hidden rounded-lg border mx-auto max-w-[200px]">
                  <img src={imagePreview} alt="Uploaded" className="w-full object-cover" />
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {imagePreview && (
                <div className="max-h-24 overflow-hidden rounded-lg border">
                  <img src={imagePreview} alt="Uploaded" className="w-full object-cover" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="note-title">{t.photoUpload.noteTitle}</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.notes.titlePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="extracted-text">{t.photoUpload.extractedText}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAIEnhance}
                    disabled={isEnhancing}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700"
                  >
                    {isEnhancing ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {t.photoUpload.enhanceWithAI}
                  </Button>
                </div>
                <Textarea
                  id="extracted-text"
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={6}
                  className="min-h-[120px] max-h-[30vh]"
                  placeholder="Extracted text will appear here..."
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => { reset(); }}>
                <Upload className="h-4 w-4 mr-2" />
                {t.common.newPhoto}
              </Button>
              <Button onClick={handleSave} disabled={!title.trim() || !extractedText.trim()}>
                <Sparkles className="h-4 w-4 mr-2" />
                {t.photoUpload.saveNote}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

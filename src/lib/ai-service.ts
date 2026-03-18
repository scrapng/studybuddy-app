import type { QuestionType } from '@/types'
import { supabase } from './supabase'

// Backend API base URL (configurable for deployment)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const API_BASE = `${API_BASE_URL}/api/ai`

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  } catch {
    // no auth available
  }
  return headers
}

// Health check to ensure backend is running
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

// OCR: Extract text from image
export async function readImageWithAI(imageBase64: string, language?: string, subjectName?: string): Promise<string> {
  const response = await fetch(`${API_BASE}/ocr`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      imageData: imageBase64,
      language,
      subjectName,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to process image')
  }

  const data = await response.json()
  return data.text || ''
}

// Enhance OCR text: Clean up raw OCR output
export async function enhanceOCRText(rawText: string, language?: string, subjectName?: string): Promise<string> {
  const response = await fetch(`${API_BASE}/enhance-ocr-text`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      text: rawText,
      language,
      subjectName,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to enhance text')
  }

  const data = await response.json()
  return data.text || ''
}

export type EnhancementMode = 'simplify' | 'detailed' | 'bullet-points' | 'eli5' | 'exam-prep'

// Keep ENHANCEMENT_LABELS for backward compatibility (used as fallback keys)
export const ENHANCEMENT_LABELS: Record<EnhancementMode, { label: string; description: string }> = {
  simplify: { label: 'Simplify', description: 'Make easier to understand' },
  detailed: { label: 'More Detail', description: 'Add explanations & examples' },
  'bullet-points': { label: 'Bullet Points', description: 'Reorganize as structured lists' },
  eli5: { label: 'ELI5', description: 'Explain like I\'m a beginner' },
  'exam-prep': { label: 'Exam Prep', description: 'Format for exam studying' },
}

// Enhance notes: Apply various enhancement modes
export async function enhanceNotes(
  noteContent: string,
  mode: EnhancementMode,
  language?: string,
  subjectName?: string,
): Promise<string> {
  const response = await fetch(`${API_BASE}/enhance-notes`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      content: noteContent,
      mode,
      language,
      subjectName,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to enhance notes')
  }

  const data = await response.json()
  return data.enhanced || ''
}

interface GeneratedQuestion {
  type: QuestionType
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

// Generate quiz questions from notes
export async function generateQuizFromNotes(
  noteContent: string,
  questionCount: number = 5,
  language?: string,
  subjectName?: string,
): Promise<GeneratedQuestion[]> {
  const response = await fetch(`${API_BASE}/generate-quiz`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      notes: [noteContent],
      count: questionCount,
      language,
      subjectName,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to generate quiz')
  }

  const data = await response.json()

  // Transform backend response to frontend format
  const questions = (data.questions || []).map((q: any) => ({
    type: (q.type === 'multiple-choice' ? 'multiple-choice' : 'true-false') as QuestionType,
    questionText: q.question || '',
    options: q.options || [],
    correctAnswer: q.answer || '',
    explanation: q.explanation || '',
    difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
  }))

  return questions
}

// Generate flashcards from notes
export async function generateFlashcardsFromNotes(
  noteContent: string,
  cardCount: number = 5,
  language?: string,
  subjectName?: string,
): Promise<Array<{ front: string; back: string; difficulty: 'easy' | 'medium' | 'hard' }>> {
  const response = await fetch(`${API_BASE}/generate-flashcards`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      notes: [noteContent],
      count: cardCount,
      language,
      subjectName,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to generate flashcards')
  }

  const data = await response.json()

  return (data.flashcards || []).map((card: any) => ({
    front: card.front || '',
    back: card.back || '',
    difficulty: (card.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
  }))
}

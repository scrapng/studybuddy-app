import type { StudySet, Flashcard } from '@/types'
import { generateId } from './utils'

export function exportStudySetAsJSON(studySet: StudySet): string {
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    studySet: {
      name: studySet.name,
      description: studySet.description,
      difficulty: studySet.difficulty,
      flashcards: studySet.flashcards.map(f => ({
        front: f.front,
        back: f.back,
        difficulty: f.difficulty,
      })),
      notes: studySet.notes.map(n => ({
        title: n.title,
        body: n.body,
        tags: n.tags,
        color: n.color,
      })),
      questions: studySet.questions.map(q => ({
        type: q.type,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })),
    },
  }
  return JSON.stringify(exportData, null, 2)
}

export function downloadJSON(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseImportJSON(jsonStr: string): StudySet | null {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.studySet || !data.studySet.name) return null

    const now = new Date().toISOString()
    const studySet: StudySet = {
      id: generateId(),
      subjectId: '',
      name: data.studySet.name,
      description: data.studySet.description || '',
      difficulty: data.studySet.difficulty || 'medium',
      targetDate: null,
      createdAt: now,
      lastStudied: null,
      flashcards: (data.studySet.flashcards || []).map((f: { front: string; back: string; difficulty?: string }) => ({
        id: generateId(),
        front: f.front,
        back: f.back,
        difficulty: f.difficulty || 'medium',
        mastery: 'new' as const,
        correctCount: 0,
        reviewCount: 0,
        lastReviewed: null,
        nextReviewDate: null,
        createdAt: now,
      })),
      notes: (data.studySet.notes || []).map((n: { title: string; body: string; tags?: string[]; color?: string | null }) => ({
        id: generateId(),
        title: n.title,
        body: n.body,
        tags: n.tags || [],
        color: n.color || null,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      })),
      questions: (data.studySet.questions || []).map((q: { type: string; questionText: string; options?: string[]; correctAnswer: string; explanation?: string; difficulty?: string }) => ({
        id: generateId(),
        type: q.type || 'short-answer',
        questionText: q.questionText,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        createdAt: now,
      })),
      goals: [],
    }
    return studySet
  } catch {
    return null
  }
}

export function parseCSVFlashcards(csv: string): Pick<Flashcard, 'front' | 'back' | 'difficulty'>[] {
  const lines = csv.trim().split('\n')
  const cards: Pick<Flashcard, 'front' | 'back' | 'difficulty'>[] = []

  for (const line of lines) {
    // Support tab, comma, or semicolon as separator
    let parts: string[]
    if (line.includes('\t')) {
      parts = line.split('\t')
    } else if (line.includes(';')) {
      parts = line.split(';')
    } else {
      parts = line.split(',')
    }

    if (parts.length >= 2) {
      const front = parts[0].trim().replace(/^["']|["']$/g, '')
      const back = parts[1].trim().replace(/^["']|["']$/g, '')
      const difficulty = (parts[2]?.trim().toLowerCase() || 'medium') as Flashcard['difficulty']
      if (front && back) {
        cards.push({ front, back, difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium' })
      }
    }
  }

  return cards
}

export type Difficulty = 'easy' | 'medium' | 'hard'
export type MasteryLevel = 'new' | 'learning' | 'reviewing' | 'mastered'
export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-blank'
export type GoalStatus = 'not-started' | 'in-progress' | 'completed'
export type SessionType = 'flashcards' | 'quiz' | 'timed-challenge'

export interface Subject {
  id: string
  name: string
  color: string
  icon: string
  description: string
  createdAt: string
}

export interface StudySet {
  id: string
  subjectId: string
  name: string
  description: string
  difficulty: Difficulty
  targetDate: string | null
  createdAt: string
  lastStudied: string | null
  flashcards: Flashcard[]
  notes: Note[]
  questions: Question[]
  goals: Goal[]
}

export interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: Difficulty
  mastery: MasteryLevel
  correctCount: number
  reviewCount: number
  lastReviewed: string | null
  nextReviewDate: string | null
  createdAt: string
}

export interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  color: string | null
  isPinned: boolean
  imageUrl: string | null
  sourceType: 'manual' | 'ocr' | 'ai-enhanced'
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  type: QuestionType
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: Difficulty
  createdAt: string
}

export interface StudySession {
  id: string
  setId: string
  subjectId: string
  setName: string
  subjectName: string
  type: SessionType
  startTime: string
  endTime: string | null
  cardsReviewed: number
  correctAnswers: number
  score: number | null
  duration: number
}

export interface Goal {
  id: string
  description: string
  targetProficiency: number
  deadline: string | null
  status: GoalStatus
  createdAt: string
}

export interface CardResult {
  cardId: string
  result: 'correct' | 'incorrect' | 'skipped'
}

export interface ActiveStudySession {
  setId: string
  cards: Flashcard[]
  currentIndex: number
  isFlipped: boolean
  results: CardResult[]
  startTime: string
  isComplete: boolean
}

export interface ActiveQuizSession {
  setId: string
  questions: Question[]
  currentIndex: number
  answers: Record<string, string>
  startTime: string
  isComplete: boolean
  showFeedback: boolean
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'pl'
  sidebarCollapsed: boolean
}

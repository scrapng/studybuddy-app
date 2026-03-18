import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Flashcard, CardResult, ActiveStudySession, ActiveQuizSession, Question } from '@/types'

interface State {
  studySession: ActiveStudySession | null
  quizSession: ActiveQuizSession | null
}

type Action =
  | { type: 'START_STUDY'; payload: { setId: string; cards: Flashcard[] } }
  | { type: 'FLIP_CARD' }
  | { type: 'NEXT_CARD' }
  | { type: 'PREV_CARD' }
  | { type: 'MARK_CARD'; payload: CardResult }
  | { type: 'END_STUDY' }
  | { type: 'SHUFFLE_CARDS' }
  | { type: 'START_QUIZ'; payload: { setId: string; questions: Question[] } }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'SUBMIT_QUIZ' }
  | { type: 'END_QUIZ' }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_STUDY':
      return {
        ...state,
        studySession: {
          setId: action.payload.setId,
          cards: action.payload.cards,
          currentIndex: 0,
          isFlipped: false,
          results: [],
          startTime: new Date().toISOString(),
          isComplete: false,
        },
      }
    case 'FLIP_CARD':
      if (!state.studySession) return state
      return {
        ...state,
        studySession: { ...state.studySession, isFlipped: !state.studySession.isFlipped },
      }
    case 'NEXT_CARD': {
      if (!state.studySession) return state
      const nextIdx = state.studySession.currentIndex + 1
      if (nextIdx >= state.studySession.cards.length) {
        return {
          ...state,
          studySession: { ...state.studySession, isComplete: true },
        }
      }
      return {
        ...state,
        studySession: { ...state.studySession, currentIndex: nextIdx, isFlipped: false },
      }
    }
    case 'PREV_CARD': {
      if (!state.studySession) return state
      const prevIdx = Math.max(0, state.studySession.currentIndex - 1)
      return {
        ...state,
        studySession: { ...state.studySession, currentIndex: prevIdx, isFlipped: false },
      }
    }
    case 'MARK_CARD': {
      if (!state.studySession) return state
      const existingIdx = state.studySession.results.findIndex(r => r.cardId === action.payload.cardId)
      const results = existingIdx >= 0
        ? state.studySession.results.map((r, i) => i === existingIdx ? action.payload : r)
        : [...state.studySession.results, action.payload]
      return {
        ...state,
        studySession: { ...state.studySession, results },
      }
    }
    case 'SHUFFLE_CARDS':
      if (!state.studySession) return state
      return {
        ...state,
        studySession: {
          ...state.studySession,
          cards: shuffle(state.studySession.cards),
          currentIndex: 0,
          isFlipped: false,
        },
      }
    case 'END_STUDY':
      return { ...state, studySession: null }
    case 'START_QUIZ':
      return {
        ...state,
        quizSession: {
          setId: action.payload.setId,
          questions: action.payload.questions,
          currentIndex: 0,
          answers: {},
          startTime: new Date().toISOString(),
          isComplete: false,
          showFeedback: false,
        },
      }
    case 'ANSWER_QUESTION':
      if (!state.quizSession) return state
      return {
        ...state,
        quizSession: {
          ...state.quizSession,
          answers: { ...state.quizSession.answers, [action.payload.questionId]: action.payload.answer },
        },
      }
    case 'NEXT_QUESTION': {
      if (!state.quizSession) return state
      const next = state.quizSession.currentIndex + 1
      if (next >= state.quizSession.questions.length) return state
      return {
        ...state,
        quizSession: { ...state.quizSession, currentIndex: next },
      }
    }
    case 'PREV_QUESTION': {
      if (!state.quizSession) return state
      return {
        ...state,
        quizSession: { ...state.quizSession, currentIndex: Math.max(0, state.quizSession.currentIndex - 1) },
      }
    }
    case 'SUBMIT_QUIZ':
      if (!state.quizSession) return state
      return {
        ...state,
        quizSession: { ...state.quizSession, isComplete: true, showFeedback: true },
      }
    case 'END_QUIZ':
      return { ...state, quizSession: null }
    default:
      return state
  }
}

const initialState: State = { studySession: null, quizSession: null }

interface SessionContextType {
  state: State
  dispatch: React.Dispatch<Action>
}

const SessionContext = createContext<SessionContextType | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider')
  return ctx
}

import { createContext, useContext, useReducer, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Subject, StudySet, StudySession, Flashcard, Note, Question, Goal } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { loadUserData, saveUserData } from '@/lib/data-service'

interface State {
  subjects: Subject[]
  studySets: StudySet[]
  sessions: StudySession[]
}

type Action =
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'UPDATE_SUBJECT'; payload: Subject }
  | { type: 'DELETE_SUBJECT'; payload: string }
  | { type: 'ADD_STUDY_SET'; payload: StudySet }
  | { type: 'UPDATE_STUDY_SET'; payload: StudySet }
  | { type: 'DELETE_STUDY_SET'; payload: string }
  | { type: 'ADD_FLASHCARD'; payload: { setId: string; flashcard: Flashcard } }
  | { type: 'UPDATE_FLASHCARD'; payload: { setId: string; flashcard: Flashcard } }
  | { type: 'DELETE_FLASHCARD'; payload: { setId: string; flashcardId: string } }
  | { type: 'ADD_NOTE'; payload: { setId: string; note: Note } }
  | { type: 'UPDATE_NOTE'; payload: { setId: string; note: Note } }
  | { type: 'DELETE_NOTE'; payload: { setId: string; noteId: string } }
  | { type: 'ADD_QUESTION'; payload: { setId: string; question: Question } }
  | { type: 'UPDATE_QUESTION'; payload: { setId: string; question: Question } }
  | { type: 'DELETE_QUESTION'; payload: { setId: string; questionId: string } }
  | { type: 'ADD_GOAL'; payload: { setId: string; goal: Goal } }
  | { type: 'UPDATE_GOAL'; payload: { setId: string; goal: Goal } }
  | { type: 'DELETE_GOAL'; payload: { setId: string; goalId: string } }
  | { type: 'ADD_SESSION'; payload: StudySession }
  | { type: 'UPDATE_STUDY_SET_LAST_STUDIED'; payload: { setId: string; date: string } }
  | { type: 'BULK_UPDATE_FLASHCARDS'; payload: { setId: string; flashcards: Flashcard[] } }
  | { type: 'IMPORT_STUDY_SET'; payload: { subjectId: string; studySet: StudySet } }
  | { type: 'HYDRATE'; payload: State }

function updateStudySet(state: State, setId: string, updater: (set: StudySet) => StudySet): State {
  return {
    ...state,
    studySets: state.studySets.map(s => s.id === setId ? updater(s) : s),
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload
    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.payload] }
    case 'UPDATE_SUBJECT':
      return { ...state, subjects: state.subjects.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter(s => s.id !== action.payload),
        studySets: state.studySets.filter(s => s.subjectId !== action.payload),
      }
    case 'ADD_STUDY_SET':
      return { ...state, studySets: [...state.studySets, action.payload] }
    case 'UPDATE_STUDY_SET':
      return { ...state, studySets: state.studySets.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_STUDY_SET':
      return { ...state, studySets: state.studySets.filter(s => s.id !== action.payload) }
    case 'ADD_FLASHCARD':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        flashcards: [...set.flashcards, action.payload.flashcard],
      }))
    case 'UPDATE_FLASHCARD':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        flashcards: set.flashcards.map(f => f.id === action.payload.flashcard.id ? action.payload.flashcard : f),
      }))
    case 'DELETE_FLASHCARD':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        flashcards: set.flashcards.filter(f => f.id !== action.payload.flashcardId),
      }))
    case 'ADD_NOTE':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        notes: [...set.notes, action.payload.note],
      }))
    case 'UPDATE_NOTE':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        notes: set.notes.map(n => n.id === action.payload.note.id ? action.payload.note : n),
      }))
    case 'DELETE_NOTE':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        notes: set.notes.filter(n => n.id !== action.payload.noteId),
      }))
    case 'ADD_QUESTION':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        questions: [...set.questions, action.payload.question],
      }))
    case 'UPDATE_QUESTION':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        questions: set.questions.map(q => q.id === action.payload.question.id ? action.payload.question : q),
      }))
    case 'DELETE_QUESTION':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        questions: set.questions.filter(q => q.id !== action.payload.questionId),
      }))
    case 'ADD_GOAL':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        goals: [...set.goals, action.payload.goal],
      }))
    case 'UPDATE_GOAL':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        goals: set.goals.map(g => g.id === action.payload.goal.id ? action.payload.goal : g),
      }))
    case 'DELETE_GOAL':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        goals: set.goals.filter(g => g.id !== action.payload.goalId),
      }))
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] }
    case 'UPDATE_STUDY_SET_LAST_STUDIED':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        lastStudied: action.payload.date,
      }))
    case 'BULK_UPDATE_FLASHCARDS':
      return updateStudySet(state, action.payload.setId, set => ({
        ...set,
        flashcards: action.payload.flashcards,
      }))
    case 'IMPORT_STUDY_SET':
      return {
        ...state,
        studySets: [...state.studySets, { ...action.payload.studySet, subjectId: action.payload.subjectId }],
      }
    default:
      return state
  }
}

const EMPTY_STATE: State = {
  subjects: [],
  studySets: [],
  sessions: [],
}

interface SubjectsContextType {
  state: State
  dispatch: React.Dispatch<Action>
  isLoading: boolean
}

const SubjectsContext = createContext<SubjectsContextType | null>(null)

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const isHydrated = useRef(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load data from Supabase (with localStorage fallback) on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    isHydrated.current = false
    setIsLoading(true)

    loadUserData(userId).then((data) => {
      dispatch({ type: 'HYDRATE', payload: data })
      isHydrated.current = true
      setIsLoading(false)
    })
  }, [userId])

  // Auto-save to Supabase + localStorage on every state change (debounced 1s)
  useEffect(() => {
    // Don't save until initial data is loaded
    if (!isHydrated.current || !userId) return

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
    }

    saveTimeout.current = setTimeout(() => {
      saveUserData(userId, {
        subjects: state.subjects,
        studySets: state.studySets,
        sessions: state.sessions,
      })
    }, 1000)

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
      }
    }
  }, [state, userId])

  return (
    <SubjectsContext.Provider value={{ state, dispatch, isLoading }}>
      {children}
    </SubjectsContext.Provider>
  )
}

export function useSubjectsContext() {
  const ctx = useContext(SubjectsContext)
  if (!ctx) throw new Error('useSubjectsContext must be used within SubjectsProvider')
  return ctx
}

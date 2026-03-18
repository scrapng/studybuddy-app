import { useCallback } from 'react'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import type { StudySet, StudySession, Flashcard, Note, Question, Goal } from '@/types'
import { generateId } from '@/lib/utils'

export function useStudySets() {
  const { state, dispatch } = useSubjectsContext()

  const studySets = state.studySets

  const getStudySetsBySubject = useCallback((subjectId: string) => {
    return state.studySets.filter(s => s.subjectId === subjectId)
  }, [state.studySets])

  const getStudySetById = useCallback((id: string) => {
    return state.studySets.find(s => s.id === id)
  }, [state.studySets])

  const addStudySet = useCallback((data: Omit<StudySet, 'id' | 'createdAt' | 'lastStudied' | 'flashcards' | 'notes' | 'questions' | 'goals'>) => {
    const studySet: StudySet = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      lastStudied: null,
      flashcards: [],
      notes: [],
      questions: [],
      goals: [],
    }
    dispatch({ type: 'ADD_STUDY_SET', payload: studySet })
    return studySet
  }, [dispatch])

  const updateStudySet = useCallback((studySet: StudySet) => {
    dispatch({ type: 'UPDATE_STUDY_SET', payload: studySet })
  }, [dispatch])

  const deleteStudySet = useCallback((id: string) => {
    dispatch({ type: 'DELETE_STUDY_SET', payload: id })
  }, [dispatch])

  // Flashcard operations
  const addFlashcard = useCallback((setId: string, data: Omit<Flashcard, 'id' | 'mastery' | 'correctCount' | 'reviewCount' | 'lastReviewed' | 'nextReviewDate' | 'createdAt'>) => {
    const flashcard: Flashcard = {
      ...data,
      id: generateId(),
      mastery: 'new',
      correctCount: 0,
      reviewCount: 0,
      lastReviewed: null,
      nextReviewDate: null,
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_FLASHCARD', payload: { setId, flashcard } })
    return flashcard
  }, [dispatch])

  const updateFlashcard = useCallback((setId: string, flashcard: Flashcard) => {
    dispatch({ type: 'UPDATE_FLASHCARD', payload: { setId, flashcard } })
  }, [dispatch])

  const deleteFlashcard = useCallback((setId: string, flashcardId: string) => {
    dispatch({ type: 'DELETE_FLASHCARD', payload: { setId, flashcardId } })
  }, [dispatch])

  const bulkUpdateFlashcards = useCallback((setId: string, flashcards: Flashcard[]) => {
    dispatch({ type: 'BULK_UPDATE_FLASHCARDS', payload: { setId, flashcards } })
  }, [dispatch])

  // Note operations
  const addNote = useCallback((setId: string, data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isPinned'> & Partial<Pick<Note, 'imageUrl' | 'sourceType'>>) => {
    const note: Note = {
      ...data,
      id: generateId(),
      isPinned: false,
      imageUrl: data.imageUrl ?? null,
      sourceType: data.sourceType ?? 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_NOTE', payload: { setId, note } })
    return note
  }, [dispatch])

  const updateNote = useCallback((setId: string, note: Note) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { setId, note: { ...note, updatedAt: new Date().toISOString() } } })
  }, [dispatch])

  const deleteNote = useCallback((setId: string, noteId: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: { setId, noteId } })
  }, [dispatch])

  // Question operations
  const addQuestion = useCallback((setId: string, data: Omit<Question, 'id' | 'createdAt'>) => {
    const question: Question = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_QUESTION', payload: { setId, question } })
    return question
  }, [dispatch])

  const updateQuestion = useCallback((setId: string, question: Question) => {
    dispatch({ type: 'UPDATE_QUESTION', payload: { setId, question } })
  }, [dispatch])

  const deleteQuestion = useCallback((setId: string, questionId: string) => {
    dispatch({ type: 'DELETE_QUESTION', payload: { setId, questionId } })
  }, [dispatch])

  // Goal operations
  const addGoal = useCallback((setId: string, data: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal: Goal = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_GOAL', payload: { setId, goal } })
    return goal
  }, [dispatch])

  const updateGoal = useCallback((setId: string, goal: Goal) => {
    dispatch({ type: 'UPDATE_GOAL', payload: { setId, goal } })
  }, [dispatch])

  const deleteGoal = useCallback((setId: string, goalId: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: { setId, goalId } })
  }, [dispatch])

  // Session
  const addSession = useCallback((session: Omit<StudySession, 'id'>) => {
    const newSession = { ...session, id: generateId() }
    dispatch({ type: 'ADD_SESSION', payload: newSession })
    dispatch({ type: 'UPDATE_STUDY_SET_LAST_STUDIED', payload: { setId: session.setId, date: new Date().toISOString() } })
    return newSession
  }, [dispatch])

  const importStudySet = useCallback((subjectId: string, studySet: StudySet) => {
    dispatch({ type: 'IMPORT_STUDY_SET', payload: { subjectId, studySet } })
  }, [dispatch])

  return {
    studySets,
    getStudySetsBySubject,
    getStudySetById,
    addStudySet,
    updateStudySet,
    deleteStudySet,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    bulkUpdateFlashcards,
    addNote,
    updateNote,
    deleteNote,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addGoal,
    updateGoal,
    deleteGoal,
    addSession,
    importStudySet,
  }
}

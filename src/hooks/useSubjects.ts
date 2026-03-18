import { useMemo, useCallback } from 'react'
import { useSubjectsContext } from '@/contexts/SubjectsContext'
import type { Subject } from '@/types'
import { generateId } from '@/lib/utils'

export function useSubjects() {
  const { state, dispatch } = useSubjectsContext()

  const subjects = state.subjects

  const addSubject = useCallback((data: Omit<Subject, 'id' | 'createdAt'>) => {
    const subject: Subject = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_SUBJECT', payload: subject })
    return subject
  }, [dispatch])

  const updateSubject = useCallback((subject: Subject) => {
    dispatch({ type: 'UPDATE_SUBJECT', payload: subject })
  }, [dispatch])

  const deleteSubject = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SUBJECT', payload: id })
  }, [dispatch])

  const getSubjectById = useCallback((id: string) => {
    return state.subjects.find(s => s.id === id)
  }, [state.subjects])

  const getStudySetCountForSubject = useCallback((subjectId: string) => {
    return state.studySets.filter(s => s.subjectId === subjectId).length
  }, [state.studySets])

  const getFlashcardCountForSubject = useCallback((subjectId: string) => {
    return state.studySets
      .filter(s => s.subjectId === subjectId)
      .reduce((count, set) => count + set.flashcards.length, 0)
  }, [state.studySets])

  const stats = useMemo(() => {
    const totalFlashcards = state.studySets.reduce((c, s) => c + s.flashcards.length, 0)
    const masteredCards = state.studySets.reduce(
      (c, s) => c + s.flashcards.filter(f => f.mastery === 'mastered').length, 0
    )
    const totalStudyTime = state.sessions.reduce((c, s) => c + s.duration, 0)

    const sessionDates = state.sessions.map(s => new Date(s.startTime).toDateString())
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    let streak = 0
    const today = new Date()
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      if (uniqueDates[i] === expected.toDateString()) {
        streak++
      } else {
        break
      }
    }

    return { totalFlashcards, masteredCards, totalStudyTime, streak, totalSessions: state.sessions.length }
  }, [state.studySets, state.sessions])

  return {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getSubjectById,
    getStudySetCountForSubject,
    getFlashcardCountForSubject,
    stats,
    sessions: state.sessions,
  }
}

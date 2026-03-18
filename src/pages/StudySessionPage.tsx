import { useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  X,
  Shuffle,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useSubjects } from '@/hooks/useSubjects'
import { useStudySets } from '@/hooks/useStudySets'
import { useSessionContext } from '@/contexts/SessionContext'
import { useTimer } from '@/hooks/useTimer'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDuration } from '@/lib/utils'
import type { MasteryLevel } from '@/types'
import { calculateNextReview } from '@/lib/spaced-repetition'

export function StudySessionPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { getSubjectById } = useSubjects()
  const { getStudySetById, updateFlashcard, addSession } = useStudySets()
  const { state: sessionState, dispatch: sessionDispatch } = useSessionContext()
  const timer = useTimer()
  const { t } = useTranslation()

  const studySet = getStudySetById(setId!)
  const subject = studySet ? getSubjectById(studySet.subjectId) : undefined
  const session = sessionState.studySession

  useEffect(() => {
    if (studySet && studySet.flashcards.length > 0 && !session) {
      sessionDispatch({ type: 'START_STUDY', payload: { setId: studySet.id, cards: [...studySet.flashcards] } })
      timer.start()
    }
  }, [studySet?.id])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!session || session.isComplete) return
    switch (e.key) {
      case ' ':
        e.preventDefault()
        sessionDispatch({ type: 'FLIP_CARD' })
        break
      case 'ArrowRight':
        sessionDispatch({ type: 'NEXT_CARD' })
        break
      case 'ArrowLeft':
        sessionDispatch({ type: 'PREV_CARD' })
        break
      case '1':
        markCard('learning')
        break
      case '2':
        markCard('reviewing')
        break
      case '3':
        markCard('mastered')
        break
    }
  }, [session])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const markCard = (mastery: MasteryLevel) => {
    if (!session || !studySet) return
    const card = session.cards[session.currentIndex]
    const isCorrect = mastery === 'mastered' || mastery === 'reviewing'
    sessionDispatch({
      type: 'MARK_CARD',
      payload: { cardId: card.id, result: isCorrect ? 'correct' : 'incorrect' },
    })
    const sr = calculateNextReview(card, mastery)
    updateFlashcard(studySet.id, {
      ...card,
      mastery,
      reviewCount: card.reviewCount + 1,
      correctCount: isCorrect ? card.correctCount + 1 : card.correctCount,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: sr.nextReviewDate,
    })
    sessionDispatch({ type: 'NEXT_CARD' })
  }

  const endSession = () => {
    if (!session || !studySet || !subject) return
    timer.pause()
    const correct = session.results.filter(r => r.result === 'correct').length
    addSession({
      setId: studySet.id,
      subjectId: subject.id,
      setName: studySet.name,
      subjectName: subject.name,
      type: 'flashcards',
      startTime: session.startTime,
      endTime: new Date().toISOString(),
      cardsReviewed: session.results.length,
      correctAnswers: correct,
      score: session.results.length > 0 ? Math.round((correct / session.results.length) * 100) : 0,
      duration: timer.elapsed,
    })
    sessionDispatch({ type: 'END_STUDY' })
    navigate(`/study-sets/${studySet.id}`)
  }

  const restartSession = () => {
    if (!studySet) return
    sessionDispatch({ type: 'END_STUDY' })
    timer.reset()
    sessionDispatch({ type: 'START_STUDY', payload: { setId: studySet.id, cards: [...studySet.flashcards] } })
    timer.start()
  }

  if (!studySet || !subject) {
    return (
      <div className="space-y-4">
        <Link to="/subjects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{t.common.back}
        </Link>
        <p className="text-muted-foreground">{t.study.setNotFound}</p>
      </div>
    )
  }

  if (!session) return null

  const currentCard = session.cards[session.currentIndex]
  const progress = ((session.currentIndex + (session.isComplete ? 1 : 0)) / session.cards.length) * 100
  const correct = session.results.filter(r => r.result === 'correct').length
  const incorrect = session.results.filter(r => r.result === 'incorrect').length

  if (session.isComplete) {
    const score = session.results.length > 0 ? Math.round((correct / session.results.length) * 100) : 0
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 inline-block mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t.study.sessionComplete}</h1>
          <p className="text-muted-foreground">{studySet.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{score}%</p>
              <p className="text-sm text-muted-foreground">{t.study.accuracy}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{formatDuration(timer.elapsed)}</p>
              <p className="text-sm text-muted-foreground">{t.study.timeSpent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-500">{correct}</p>
              <p className="text-sm text-muted-foreground">{t.study.correct}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-red-500">{incorrect}</p>
              <p className="text-sm text-muted-foreground">{t.study.needReview}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1" onClick={restartSession}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.study.studyAgain}
          </Button>
          <Button variant="outline" className="flex-1" onClick={endSession}>
            {t.common.done}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{subject.name}</p>
          <h1 className="text-lg font-bold">{studySet.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(timer.elapsed)}
          </span>
          <Button variant="ghost" size="icon" onClick={() => sessionDispatch({ type: 'SHUFFLE_CARDS' })}>
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={endSession}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{t.common.card} {session.currentIndex + 1} {t.common.of} {session.cards.length}</span>
          <span className="text-muted-foreground">
            <span className="text-green-500">{correct}</span> / <span className="text-red-500">{incorrect}</span>
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div
        className="perspective-1000 cursor-pointer"
        onClick={() => sessionDispatch({ type: 'FLIP_CARD' })}
      >
        <div
          className={`relative w-full min-h-[300px] transition-transform duration-500 transform-style-3d ${
            session.isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          <Card className={`absolute inset-0 backface-hidden ${session.isFlipped ? 'invisible' : ''}`}>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{t.study.question}</p>
              <p className="text-lg font-medium">{currentCard.front}</p>
              <p className="text-xs text-muted-foreground mt-6">{t.study.clickToReveal}</p>
            </CardContent>
          </Card>

          <Card className={`absolute inset-0 backface-hidden rotate-y-180 ${!session.isFlipped ? 'invisible' : ''}`}>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{t.study.answer}</p>
              <p className="text-lg font-medium">{currentCard.back}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        {session.isFlipped && (
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => markCard('learning')}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t.study.stillLearning}
              <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">1</kbd>
            </Button>
            <Button
              variant="outline"
              className="border-yellow-200 dark:border-yellow-900 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              onClick={() => markCard('reviewing')}
            >
              <MinusCircle className="mr-2 h-4 w-4" />
              {t.study.needReview}
              <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">2</kbd>
            </Button>
            <Button
              variant="outline"
              className="border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={() => markCard('mastered')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t.study.gotIt}
              <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">3</kbd>
            </Button>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="ghost"
            disabled={session.currentIndex === 0}
            onClick={() => sessionDispatch({ type: 'PREV_CARD' })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.common.previous}
          </Button>
          <Button
            variant="ghost"
            onClick={() => sessionDispatch({ type: 'NEXT_CARD' })}
          >
            {t.study.skip}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

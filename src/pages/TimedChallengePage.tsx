import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Timer, Zap, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useSubjects } from '@/hooks/useSubjects'
import { useStudySets } from '@/hooks/useStudySets'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDuration } from '@/lib/utils'
import type { Flashcard } from '@/types'

type ChallengeState = 'config' | 'playing' | 'complete'

interface ChallengeResult {
  card: Flashcard
  correct: boolean
  timeSpent: number
}

export function TimedChallengePage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { getSubjectById } = useSubjects()
  const { getStudySetById, addSession } = useStudySets()
  const { t } = useTranslation()

  const studySet = getStudySetById(setId!)
  const subject = studySet ? getSubjectById(studySet.subjectId) : undefined

  const [challengeState, setChallengeState] = useState<ChallengeState>('config')
  const [timeLimit, setTimeLimit] = useState(60)
  const [timeLeft, setTimeLeft] = useState(60)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<ChallengeResult[]>([])
  const [cardStartTime, setCardStartTime] = useState(0)

  useEffect(() => {
    if (challengeState !== 'playing' || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setChallengeState('complete')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [challengeState, timeLeft])

  const startChallenge = () => {
    if (!studySet) return
    const shuffled = [...studySet.flashcards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setResults([])
    setTimeLeft(timeLimit)
    setCardStartTime(Date.now())
    setChallengeState('playing')
  }

  const handleAnswer = useCallback((correct: boolean) => {
    if (currentIndex >= cards.length) {
      setChallengeState('complete')
      return
    }

    const timeSpent = (Date.now() - cardStartTime) / 1000
    setResults(prev => [...prev, { card: cards[currentIndex], correct, timeSpent }])

    if (currentIndex + 1 >= cards.length) {
      setChallengeState('complete')
    } else {
      setCurrentIndex(i => i + 1)
      setIsFlipped(false)
      setCardStartTime(Date.now())
    }
  }, [currentIndex, cards, cardStartTime])

  useEffect(() => {
    if (challengeState !== 'playing') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        if (!isFlipped) setIsFlipped(true)
      } else if (e.key === '1' && isFlipped) {
        handleAnswer(false)
      } else if (e.key === '2' && isFlipped) {
        handleAnswer(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [challengeState, isFlipped, handleAnswer])

  const finishChallenge = () => {
    if (!studySet || !subject) return
    const correct = results.filter(r => r.correct).length
    addSession({
      setId: studySet.id,
      subjectId: subject.id,
      setName: studySet.name,
      subjectName: subject.name,
      type: 'timed-challenge',
      startTime: new Date(Date.now() - (timeLimit * 1000)).toISOString(),
      endTime: new Date().toISOString(),
      cardsReviewed: results.length,
      correctAnswers: correct,
      score: results.length > 0 ? Math.round((correct / results.length) * 100) : 0,
      duration: timeLimit - timeLeft,
    })
    navigate(`/study-sets/${studySet.id}`)
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

  if (challengeState === 'config') {
    return (
      <div className="max-w-md mx-auto space-y-6 py-12">
        <div className="text-center">
          <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-4 inline-block mb-4">
            <Zap className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t.challenge.timedChallenge}</h1>
          <p className="text-muted-foreground">{studySet.name} &middot; {studySet.flashcards.length} {t.common.cards}</p>
        </div>

        <Card>
          <CardContent className="pt-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">{t.challenge.timeLimit}</p>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 120].map(tl => (
                  <Button
                    key={tl}
                    variant={timeLimit === tl ? 'default' : 'outline'}
                    onClick={() => setTimeLimit(tl)}
                  >
                    {formatDuration(tl)}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.challenge.instructions}
            </p>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={startChallenge}>
          <Timer className="mr-2 h-5 w-5" />
          {t.challenge.startChallenge}
        </Button>
      </div>
    )
  }

  if (challengeState === 'complete') {
    const correct = results.filter(r => r.correct).length
    const score = results.length > 0 ? Math.round((correct / results.length) * 100) : 0
    const avgTime = results.length > 0 ? results.reduce((total, r) => total + r.timeSpent, 0) / results.length : 0

    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-4 inline-block mb-4">
            <Zap className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t.challenge.challengeComplete}</h1>
          <p className="text-muted-foreground">{studySet.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{results.length}</p>
              <p className="text-sm text-muted-foreground">{t.challenge.cardsAnswered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{score}%</p>
              <p className="text-sm text-muted-foreground">{t.challenge.accuracy}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-500">{correct}</p>
              <p className="text-sm text-muted-foreground">{t.challenge.correct}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{avgTime.toFixed(1)}s</p>
              <p className="text-sm text-muted-foreground">{t.challenge.avgTime}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1" onClick={startChallenge}>
            <Timer className="mr-2 h-4 w-4" />
            {t.challenge.tryAgain}
          </Button>
          <Button variant="outline" className="flex-1" onClick={finishChallenge}>
            {t.common.done}
          </Button>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const timeProgress = (timeLeft / timeLimit) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{subject.name}</p>
          <h1 className="text-lg font-bold">{studySet.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>
            {formatDuration(timeLeft)}
          </span>
        </div>
      </div>

      <Progress value={timeProgress} className={`h-2 ${timeLeft <= 10 ? '[&>div]:bg-red-500' : ''}`} />

      <div className="flex justify-between text-sm">
        <span>{t.challenge.cardN} {currentIndex + 1}</span>
        <span>
          <span className="text-green-500">{results.filter(r => r.correct).length}</span>
          {' / '}
          <span className="text-red-500">{results.filter(r => !r.correct).length}</span>
        </span>
      </div>

      <div
        className="perspective-1000 cursor-pointer"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`relative w-full min-h-[280px] transition-transform duration-300 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          <Card className={`absolute inset-0 backface-hidden ${isFlipped ? 'invisible' : ''}`}>
            <CardContent className="flex flex-col items-center justify-center min-h-[280px] p-8 text-center">
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{t.challenge.question}</p>
              <p className="text-lg font-medium">{currentCard.front}</p>
              <p className="text-xs text-muted-foreground mt-6">{t.challenge.clickOrSpace}</p>
            </CardContent>
          </Card>
          <Card className={`absolute inset-0 backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}>
            <CardContent className="flex flex-col items-center justify-center min-h-[280px] p-8 text-center">
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{t.challenge.answer}</p>
              <p className="text-lg font-medium">{currentCard.back}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {isFlipped && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => handleAnswer(false)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {t.challenge.wrong}
            <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">1</kbd>
          </Button>
          <Button
            variant="outline"
            className="border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
            onClick={() => handleAnswer(true)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {t.challenge.correct}
            <kbd className="ml-2 text-[10px] bg-muted px-1 rounded">2</kbd>
          </Button>
        </div>
      )}
    </div>
  )
}

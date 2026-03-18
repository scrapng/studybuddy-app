import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useSubjects } from '@/hooks/useSubjects'
import { useStudySets } from '@/hooks/useStudySets'
import { useSessionContext } from '@/contexts/SessionContext'
import { useTimer } from '@/hooks/useTimer'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDuration, cn } from '@/lib/utils'

export function QuizPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const { getSubjectById } = useSubjects()
  const { getStudySetById, addSession } = useStudySets()
  const { state: sessionState, dispatch: sessionDispatch } = useSessionContext()
  const timer = useTimer()
  const [shortAnswer, setShortAnswer] = useState('')
  const { t } = useTranslation()

  const studySet = getStudySetById(setId!)
  const subject = studySet ? getSubjectById(studySet.subjectId) : undefined
  const quiz = sessionState.quizSession

  useEffect(() => {
    if (studySet && studySet.questions.length > 0 && !quiz) {
      const shuffled = [...studySet.questions].sort(() => Math.random() - 0.5)
      sessionDispatch({ type: 'START_QUIZ', payload: { setId: studySet.id, questions: shuffled } })
      timer.start()
    }
  }, [studySet?.id])

  const handleAnswer = (answer: string) => {
    if (!quiz) return
    const q = quiz.questions[quiz.currentIndex]
    sessionDispatch({ type: 'ANSWER_QUESTION', payload: { questionId: q.id, answer } })
  }

  const submitQuiz = () => {
    if (!quiz || !studySet || !subject) return
    timer.pause()
    sessionDispatch({ type: 'SUBMIT_QUIZ' })
    const correct = quiz.questions.filter(q => quiz.answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()).length
    addSession({
      setId: studySet.id,
      subjectId: subject.id,
      setName: studySet.name,
      subjectName: subject.name,
      type: 'quiz',
      startTime: quiz.startTime,
      endTime: new Date().toISOString(),
      cardsReviewed: quiz.questions.length,
      correctAnswers: correct,
      score: Math.round((correct / quiz.questions.length) * 100),
      duration: timer.elapsed,
    })
  }

  const finishQuiz = () => {
    sessionDispatch({ type: 'END_QUIZ' })
    navigate(`/study-sets/${setId}`)
  }

  if (!studySet || !subject) {
    return (
      <div className="space-y-4">
        <Link to="/subjects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />{t.common.back}
        </Link>
        <p className="text-muted-foreground">{t.quiz.setNotFound}</p>
      </div>
    )
  }

  if (!quiz) return null

  const TYPE_LABELS: Record<string, string> = {
    'multiple-choice': t.quiz.multipleChoice,
    'true-false': t.quiz.trueFalse,
    'short-answer': t.quiz.shortAnswer,
    'fill-blank': t.quiz.fillBlank,
  }

  // Results
  if (quiz.isComplete && quiz.showFeedback) {
    const results = quiz.questions.map(q => ({
      question: q,
      userAnswer: quiz.answers[q.id] || '',
      isCorrect: (quiz.answers[q.id] || '').toLowerCase().trim() === q.correctAnswer.toLowerCase().trim(),
    }))
    const correct = results.filter(r => r.isCorrect).length
    const score = Math.round((correct / quiz.questions.length) * 100)

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className={cn(
            'rounded-full p-4 inline-block mb-4',
            score >= 80 ? 'bg-green-100 dark:bg-green-900/30' : score >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-red-100 dark:bg-red-900/30'
          )}>
            <Trophy className={cn(
              'h-12 w-12',
              score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'
            )} />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t.quiz.quizComplete}</h1>
          <p className="text-muted-foreground">{studySet.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{score}%</p>
              <p className="text-sm text-muted-foreground">{t.quiz.score}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{correct}/{quiz.questions.length}</p>
              <p className="text-sm text-muted-foreground">{t.quiz.correct}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{formatDuration(timer.elapsed)}</p>
              <p className="text-sm text-muted-foreground">{t.quiz.time}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">{t.quiz.reviewAnswers}</h2>
          {results.map((r, i) => (
            <Card key={r.question.id} className={cn(
              'border-l-4',
              r.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
            )}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  {r.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Q{i + 1}: {r.question.questionText}</p>
                    {!r.isCorrect && r.userAnswer && (
                      <p className="text-sm text-red-500 mt-1">{t.quiz.yourAnswer}: {r.userAnswer}</p>
                    )}
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">{t.quiz.correctLabel}: {r.question.correctAnswer}</p>
                    {r.question.explanation && (
                      <p className="text-xs text-muted-foreground mt-1">{r.question.explanation}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" onClick={finishQuiz}>
          {t.quiz.backToStudySet}
        </Button>
      </div>
    )
  }

  // Quiz in progress
  const currentQ = quiz.questions[quiz.currentIndex]
  const currentAnswer = quiz.answers[currentQ.id] || ''
  const progress = ((quiz.currentIndex + 1) / quiz.questions.length) * 100
  const allAnswered = quiz.questions.every(q => quiz.answers[q.id])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{subject.name}</p>
          <h1 className="text-lg font-bold">{studySet.name} — {t.studySet.quiz}</h1>
        </div>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {formatDuration(timer.elapsed)}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{t.common.question} {quiz.currentIndex + 1} {t.common.of} {quiz.questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <Badge variant="outline" className="mb-3">
              {TYPE_LABELS[currentQ.type] || currentQ.type}
            </Badge>
            <p className="text-lg font-medium">{currentQ.questionText}</p>
          </div>

          {(currentQ.type === 'multiple-choice' || currentQ.type === 'true-false') && (
            <div className="space-y-2">
              {(currentQ.type === 'true-false' ? ['True', 'False'] : currentQ.options).map(option => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                    currentAnswer === option
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {(currentQ.type === 'short-answer' || currentQ.type === 'fill-blank') && (
            <Input
              value={currentAnswer || shortAnswer}
              onChange={e => {
                setShortAnswer(e.target.value)
                handleAnswer(e.target.value)
              }}
              placeholder={currentQ.type === 'fill-blank' ? t.quiz.fillBlankPlaceholder : t.quiz.typeAnswerPlaceholder}
              className="text-lg"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          disabled={quiz.currentIndex === 0}
          onClick={() => {
            sessionDispatch({ type: 'PREV_QUESTION' })
            setShortAnswer('')
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.common.previous}
        </Button>

        {quiz.currentIndex < quiz.questions.length - 1 ? (
          <Button
            onClick={() => {
              sessionDispatch({ type: 'NEXT_QUESTION' })
              setShortAnswer('')
            }}
          >
            {t.common.next}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submitQuiz} disabled={!allAnswered}>
            {t.quiz.submitQuiz}
          </Button>
        )}
      </div>
    </div>
  )
}

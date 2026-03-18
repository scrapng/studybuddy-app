import type { Flashcard, MasteryLevel } from '@/types'
import { addDays } from 'date-fns'

/**
 * Simplified SM-2 spaced repetition algorithm
 * Calculates the next review date and interval based on card performance
 */

interface SM2Result {
  nextReviewDate: string
  intervalDays: number
  mastery: MasteryLevel
}

const INTERVALS: Record<MasteryLevel, number> = {
  new: 0,
  learning: 1,
  reviewing: 3,
  mastered: 7,
}

export function calculateNextReview(card: Flashcard, quality: MasteryLevel): SM2Result {
  let intervalDays: number

  switch (quality) {
    case 'mastered': {
      const baseInterval = INTERVALS.mastered
      const multiplier = Math.min(card.correctCount + 1, 5)
      intervalDays = baseInterval * multiplier
      break
    }
    case 'reviewing': {
      intervalDays = INTERVALS.reviewing * Math.max(Math.floor(card.correctCount / 2), 1)
      break
    }
    case 'learning': {
      intervalDays = INTERVALS.learning
      break
    }
    default:
      intervalDays = 0
  }

  const nextReviewDate = addDays(new Date(), intervalDays).toISOString()

  return {
    nextReviewDate,
    intervalDays,
    mastery: quality,
  }
}

export function isDueForReview(card: Flashcard): boolean {
  if (card.mastery === 'new') return true
  if (!card.lastReviewed) return true

  const lastReviewed = new Date(card.lastReviewed)
  const interval = INTERVALS[card.mastery] || 1
  const multiplier = card.mastery === 'mastered' ? Math.min(card.correctCount, 5) : 1
  const nextDue = addDays(lastReviewed, interval * multiplier)

  return new Date() >= nextDue
}

export function getDueCards(cards: Flashcard[]): Flashcard[] {
  return cards.filter(isDueForReview).sort((a, b) => {
    // Priority: new > learning > reviewing > mastered
    const priority: Record<MasteryLevel, number> = { new: 0, learning: 1, reviewing: 2, mastered: 3 }
    return priority[a.mastery] - priority[b.mastery]
  })
}

export function getNextReviewDate(card: Flashcard): Date | null {
  if (card.mastery === 'new' || !card.lastReviewed) return null

  const lastReviewed = new Date(card.lastReviewed)
  const interval = INTERVALS[card.mastery] || 1
  const multiplier = card.mastery === 'mastered' ? Math.min(card.correctCount, 5) : 1
  return addDays(lastReviewed, interval * multiplier)
}

export function getStudyRecommendation(cards: Flashcard[]): {
  dueCount: number
  urgentCount: number
  message: string
} {
  const dueCards = getDueCards(cards)
  const urgentCards = dueCards.filter(c => c.mastery === 'learning' || c.mastery === 'new')

  let message = ''
  if (dueCards.length === 0) {
    message = 'All caught up! No cards due for review.'
  } else if (urgentCards.length > 0) {
    message = `${urgentCards.length} card${urgentCards.length > 1 ? 's' : ''} need${urgentCards.length === 1 ? 's' : ''} immediate attention.`
  } else {
    message = `${dueCards.length} card${dueCards.length > 1 ? 's' : ''} due for review.`
  }

  return { dueCount: dueCards.length, urgentCount: urgentCards.length, message }
}

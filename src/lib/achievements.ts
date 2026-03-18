import type { StudySession, Flashcard } from '@/types'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (data: AchievementData) => boolean
}

export interface AchievementData {
  totalSessions: number
  totalStudyTime: number
  streak: number
  masteredCards: number
  totalFlashcards: number
  totalSubjects: number
  sessions: StudySession[]
  allCards: Flashcard[]
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    name: 'First Steps',
    description: 'Complete your first study session',
    icon: 'Footprints',
    condition: (d) => d.totalSessions >= 1,
  },
  {
    id: 'five-sessions',
    name: 'Getting Started',
    description: 'Complete 5 study sessions',
    icon: 'Rocket',
    condition: (d) => d.totalSessions >= 5,
  },
  {
    id: 'ten-sessions',
    name: 'Dedicated Learner',
    description: 'Complete 10 study sessions',
    icon: 'GraduationCap',
    condition: (d) => d.totalSessions >= 10,
  },
  {
    id: 'twenty-five-sessions',
    name: 'Study Machine',
    description: 'Complete 25 study sessions',
    icon: 'Cpu',
    condition: (d) => d.totalSessions >= 25,
  },
  {
    id: 'first-mastered',
    name: 'Quick Learner',
    description: 'Master your first flashcard',
    icon: 'Star',
    condition: (d) => d.masteredCards >= 1,
  },
  {
    id: 'ten-mastered',
    name: 'Knowledge Builder',
    description: 'Master 10 flashcards',
    icon: 'Trophy',
    condition: (d) => d.masteredCards >= 10,
  },
  {
    id: 'twenty-five-mastered',
    name: 'Card Shark',
    description: 'Master 25 flashcards',
    icon: 'Crown',
    condition: (d) => d.masteredCards >= 25,
  },
  {
    id: 'streak-3',
    name: 'On a Roll',
    description: 'Maintain a 3-day study streak',
    icon: 'Flame',
    condition: (d) => d.streak >= 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: 'Zap',
    condition: (d) => d.streak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day study streak',
    icon: 'Shield',
    condition: (d) => d.streak >= 30,
  },
  {
    id: 'hour-studied',
    name: 'Hour Glass',
    description: 'Study for a total of 1 hour',
    icon: 'Clock',
    condition: (d) => d.totalStudyTime >= 3600,
  },
  {
    id: 'five-hours',
    name: 'Time Investor',
    description: 'Study for a total of 5 hours',
    icon: 'Timer',
    condition: (d) => d.totalStudyTime >= 18000,
  },
  {
    id: 'perfect-session',
    name: 'Perfect Score',
    description: 'Get 100% in a study session',
    icon: 'Sparkles',
    condition: (d) => d.sessions.some(s => s.score === 100 && s.cardsReviewed >= 3),
  },
  {
    id: 'multi-subject',
    name: 'Renaissance Student',
    description: 'Study 3 or more subjects',
    icon: 'BookOpen',
    condition: (d) => d.totalSubjects >= 3,
  },
  {
    id: 'fifty-cards',
    name: 'Card Collector',
    description: 'Create 50 flashcards',
    icon: 'Layers',
    condition: (d) => d.totalFlashcards >= 50,
  },
]

export function getUnlockedAchievements(data: AchievementData): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.condition(data))
}

export function getLockedAchievements(data: AchievementData): Achievement[] {
  return ACHIEVEMENTS.filter(a => !a.condition(data))
}

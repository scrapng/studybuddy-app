import type { Difficulty, MasteryLevel } from '@/types'

export const SUBJECT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
]

export const SUBJECT_ICONS = [
  'BookOpen', 'Calculator', 'Atom', 'Globe',
  'Palette', 'Music', 'Code', 'FlaskConical',
  'Languages', 'History', 'Scale', 'Brain',
  'Microscope', 'Landmark', 'HeartPulse', 'Cpu',
  'Leaf', 'Pen', 'GraduationCap', 'Lightbulb',
]

export const NOTE_COLORS = [
  null, '#fef3c7', '#dcfce7', '#dbeafe',
  '#fce7f3', '#e0e7ff', '#f3e8ff', '#ccfbf1',
]

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bgColor: string }> = {
  easy: { label: 'Easy', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  medium: { label: 'Medium', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  hard: { label: 'Hard', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
}

export const MASTERY_CONFIG: Record<MasteryLevel, { label: string; color: string; bgColor: string; percentage: number }> = {
  new: { label: 'New', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', percentage: 0 },
  learning: { label: 'Learning', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', percentage: 25 },
  reviewing: { label: 'Reviewing', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', percentage: 60 },
  mastered: { label: 'Mastered', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', percentage: 100 },
}

export const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  language: 'en' as const,
  sidebarCollapsed: false,
}

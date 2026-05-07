import type { ColorTheme, Difficulty, MasteryLevel } from '@/types'

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

export type ThemeConfig = {
  label: string
  swatch: string
  light: { primary: string; fg: string }
  dark:  { primary: string; fg: string }
}

export const COLOR_THEMES: Record<ColorTheme, ThemeConfig> = {
  slate:   { label: 'Slate',   swatch: '#64748b', light: { primary: 'oklch(0.21 0 0)',        fg: 'oklch(0.985 0 0)' }, dark:  { primary: 'oklch(0.92 0 0)',        fg: 'oklch(0.145 0 0)' } },
  indigo:  { label: 'Indigo',  swatch: '#6366f1', light: { primary: 'oklch(0.46 0.19 264)',    fg: 'oklch(0.985 0 0)' }, dark:  { primary: 'oklch(0.71 0.19 264)',    fg: 'oklch(0.985 0 0)' } },
  violet:  { label: 'Violet',  swatch: '#8b5cf6', light: { primary: 'oklch(0.46 0.22 285)',    fg: 'oklch(0.985 0 0)' }, dark:  { primary: 'oklch(0.71 0.22 285)',    fg: 'oklch(0.985 0 0)' } },
  rose:    { label: 'Rose',    swatch: '#f43f5e', light: { primary: 'oklch(0.50 0.22 10)',     fg: 'oklch(0.985 0 0)' }, dark:  { primary: 'oklch(0.73 0.19 10)',     fg: 'oklch(0.985 0 0)' } },
  amber:   { label: 'Amber',   swatch: '#f59e0b', light: { primary: 'oklch(0.62 0.15 70)',     fg: 'oklch(0.145 0 0)' }, dark:  { primary: 'oklch(0.82 0.16 70)',     fg: 'oklch(0.145 0 0)' } },
  emerald: { label: 'Emerald', swatch: '#10b981', light: { primary: 'oklch(0.50 0.15 160)',    fg: 'oklch(0.985 0 0)' }, dark:  { primary: 'oklch(0.75 0.15 160)',    fg: 'oklch(0.985 0 0)' } },
  sky:     { label: 'Sky',     swatch: '#0ea5e9', light: { primary: 'oklch(0.52 0.17 230)',    fg: 'oklch(0.985 0 0)' }, dark:  { primary: 'oklch(0.75 0.17 230)',    fg: 'oklch(0.985 0 0)' } },
}

export const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  language: 'en' as const,
  sidebarCollapsed: false,
  colorTheme: 'indigo' as const,
  fontSize: 'md' as const,
}

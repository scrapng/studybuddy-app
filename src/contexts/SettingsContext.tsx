import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppSettings } from '@/types'
import type { Language } from '@/lib/i18n'
import { DEFAULT_SETTINGS, COLOR_THEMES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'studybuddy-settings'

const FONT_SIZE_MAP = { sm: '13px', md: '16px', lg: '18px' } as const

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS
}

function applyColorTheme(settings: AppSettings) {
  const root = document.documentElement
  const config = COLOR_THEMES[settings.colorTheme]
  root.style.setProperty('--theme-primary-light',    config.light.primary)
  root.style.setProperty('--theme-primary-fg-light', config.light.fg)
  root.style.setProperty('--theme-primary-dark',     config.dark.primary)
  root.style.setProperty('--theme-primary-fg-dark',  config.dark.fg)
}

function applyFontSize(settings: AppSettings) {
  document.documentElement.style.setProperty(
    '--base-font-size',
    FONT_SIZE_MAP[settings.fontSize],
  )
}

interface SettingsContextType {
  settings: AppSettings
  setTheme: (theme: AppSettings['theme']) => void
  setLanguage: (language: Language) => Promise<void>
  setColorTheme: (colorTheme: AppSettings['colorTheme']) => void
  setFontSize: (fontSize: AppSettings['fontSize']) => void
  toggleSidebar: () => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  // Dark / light class
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else if (settings.theme === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }, [settings.theme])

  // Color theme — set four CSS vars so both light and dark modes are covered
  useEffect(() => {
    applyColorTheme(settings)
  }, [settings.colorTheme])

  // Font size
  useEffect(() => {
    applyFontSize(settings)
  }, [settings.fontSize])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore storage errors
    }
  }, [settings])

  // Apply on first mount (covers page refresh with stored settings)
  useEffect(() => {
    applyColorTheme(settings)
    applyFontSize(settings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTheme = (theme: AppSettings['theme']) => setSettings(s => ({ ...s, theme }))

  const setLanguage = async (language: Language) => {
    setSettings(s => ({ ...s, language }))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ language }).eq('id', user.id)
    }
  }

  const setColorTheme = (colorTheme: AppSettings['colorTheme']) =>
    setSettings(s => ({ ...s, colorTheme }))

  const setFontSize = (fontSize: AppSettings['fontSize']) =>
    setSettings(s => ({ ...s, fontSize }))

  const toggleSidebar = () => setSettings(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setLanguage, setColorTheme, setFontSize, toggleSidebar }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider')
  return ctx
}

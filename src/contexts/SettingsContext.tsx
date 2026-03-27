import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppSettings } from '@/types'
import type { Language } from '@/lib/i18n'
import { DEFAULT_SETTINGS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'studybuddy-settings'

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

interface SettingsContextType {
  settings: AppSettings
  setTheme: (theme: AppSettings['theme']) => void
  setLanguage: (language: Language) => Promise<void>
  toggleSidebar: () => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

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

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore storage errors
    }
  }, [settings])

  const setTheme = (theme: AppSettings['theme']) => setSettings(s => ({ ...s, theme }))
  const setLanguage = async (language: Language) => {
    setSettings(s => ({ ...s, language }))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ language }).eq('id', user.id)
    }
  }
  const toggleSidebar = () => setSettings(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setLanguage, toggleSidebar }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider')
  return ctx
}

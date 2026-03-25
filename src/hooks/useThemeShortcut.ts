import { useEffect, useState, useCallback } from 'react'
import { useSettingsContext } from '@/contexts/SettingsContext'

/**
 * Toggles theme between light/dark when "M" is pressed.
 * Returns the current toast state so the component can render an overlay.
 */
export function useThemeShortcut() {
  const { settings, setTheme } = useSettingsContext()
  const [toast, setToast] = useState<{ theme: string; visible: boolean } | null>(null)

  const toggle = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark')
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    setToast({ theme: next, visible: true })
    setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 1500)
    setTimeout(() => setToast(null), 2000)
  }, [setTheme])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs/textareas/contenteditable
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'm' || e.key === 'M') {
        if (e.ctrlKey || e.altKey || e.metaKey) return
        toggle()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  return toast
}

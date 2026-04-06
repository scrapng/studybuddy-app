import { Sun, Moon } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface ThemeToastProps {
  theme: string
  visible: boolean
}

export function ThemeToast({ theme, visible }: ThemeToastProps) {
  const isDark = theme === 'dark'
  const { t } = useTranslation()

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none
        flex items-center gap-2.5 px-5 py-3 rounded-xl
        bg-card/90 backdrop-blur-md border border-border shadow-2xl
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
    >
      <div className={`rounded-lg p-1.5 transition-colors duration-300 ${isDark ? 'bg-indigo-500/20' : 'bg-amber-500/20'}`}>
        {isDark ? (
          <Moon className="h-4 w-4 text-indigo-400 animate-spin-once" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 animate-spin-once" />
        )}
      </div>
      <span className="text-sm font-medium">
        {isDark ? t.theme.darkMode : t.theme.lightMode}
      </span>
      <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">M</kbd>
    </div>
  )
}

import { Sun, Moon, Monitor } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { useTranslation } from '@/hooks/useTranslation'
import { COLOR_THEMES } from '@/lib/constants'
import type { ColorTheme, FontSize } from '@/types'
import { cn } from '@/lib/utils'

const COLOR_THEME_KEYS = Object.keys(COLOR_THEMES) as ColorTheme[]

const FONT_SIZES: { value: FontSize; labelKey: 'fontSizeSm' | 'fontSizeMd' | 'fontSizeLg'; display: string }[] = [
  { value: 'sm', labelKey: 'fontSizeSm', display: 'A' },
  { value: 'md', labelKey: 'fontSizeMd', display: 'A' },
  { value: 'lg', labelKey: 'fontSizeLg', display: 'A' },
]

export function AppearanceCard() {
  const { settings, setTheme, setColorTheme, setFontSize } = useSettingsContext()
  const { t } = useTranslation()

  return (
    <Card className="card-hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="h-4 w-4" />
          {t.settings.appearance}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Theme mode */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.settings.themeMode}</p>
          <div className="flex gap-2">
            {([
              { value: 'light', icon: Sun,     label: t.theme.light },
              { value: 'dark',  icon: Moon,    label: t.theme.dark },
              { value: 'system',icon: Monitor, label: t.theme.system },
            ] as const).map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setTheme(value)}
                className={cn(
                  'flex-1 gap-2',
                  settings.theme === value && 'border-primary bg-primary/10 text-primary',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Color theme */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.settings.colorTheme}</p>
          <div className="flex flex-wrap gap-3">
            {COLOR_THEME_KEYS.map(key => {
              const config = COLOR_THEMES[key]
              const isActive = settings.colorTheme === key
              return (
                <button
                  key={key}
                  onClick={() => setColorTheme(key)}
                  title={config.label}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all',
                    isActive
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:bg-muted/60',
                  )}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-black/10 shadow-sm"
                    style={{ background: config.swatch }}
                  />
                  <span className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {config.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Font size */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t.settings.fontSize}</p>
          <div className="flex gap-2">
            {FONT_SIZES.map(({ value, labelKey, display }, i) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setFontSize(value)}
                className={cn(
                  'flex-1 gap-2',
                  settings.fontSize === value && 'border-primary bg-primary/10 text-primary',
                )}
              >
                <span style={{ fontSize: `${12 + i * 3}px`, lineHeight: 1, fontWeight: 600 }}>
                  {display}
                </span>
                {t.settings[labelKey]}
              </Button>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}

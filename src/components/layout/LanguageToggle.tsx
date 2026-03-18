import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { useTranslation } from '@/hooks/useTranslation'

export function LanguageToggle() {
  const { setLanguage } = useSettingsContext()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9" />}>
        <Globe className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')}>
          <span className="mr-2 text-base">🇬🇧</span>
          {t.lang.english}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('pl')}>
          <span className="mr-2 text-base">🇵🇱</span>
          {t.lang.polish}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

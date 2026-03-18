import { useSettingsContext } from '@/contexts/SettingsContext'
import { getTranslations } from '@/lib/i18n'

export function useTranslation() {
  const { settings } = useSettingsContext()
  const lang = settings.language
  const tr = getTranslations(lang)
  return { t: tr, lang }
}

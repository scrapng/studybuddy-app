import en from './i18n/en.json'
import pl from './i18n/pl.json'

export type Language = 'en' | 'pl'

type TranslationMap = typeof en

const translations: Record<Language, TranslationMap> = { en, pl }

export function getTranslations(language: Language): TranslationMap {
  return translations[language] ?? translations.en
}

import type { Difficulty } from '@/types'
import { DIFFICULTY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = DIFFICULTY_CONFIG[difficulty]
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.color, config.bgColor)}>
      {t.difficulty[difficulty]}
    </span>
  )
}

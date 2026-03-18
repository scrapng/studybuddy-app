import type { MasteryLevel } from '@/types'
import { MASTERY_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

export function MasteryIndicator({ mastery }: { mastery: MasteryLevel }) {
  const config = MASTERY_CONFIG[mastery]
  const { t } = useTranslation()
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.color)}>
      <span className={cn('h-2 w-2 rounded-full', config.color.replace('text-', 'bg-'))} />
      {t.mastery[mastery]}
    </span>
  )
}

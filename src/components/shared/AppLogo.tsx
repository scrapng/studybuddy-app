import { cn } from '@/lib/utils'

interface AppLogoProps {
  className?: string
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="StudyBuddy"
      className={cn('h-6 w-6 logo-theme', className)}
    />
  )
}

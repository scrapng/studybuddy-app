import { cn } from '@/lib/utils'
import type { Profile } from '@/types/social'

interface Props {
  profile: Profile
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FriendAvatar({ profile, size = 'md', className }: Props) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm'
  const initial = (profile.display_name?.[0] || profile.friend_code[0]).toUpperCase()

  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold shrink-0 text-white', sizeClass, className)}
      style={{ backgroundColor: profile.avatar_color }}
    >
      {initial}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Check, CheckCheck, Trash2, UserPlus, MessageCircle, Share2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSocialContext } from '@/contexts/SocialContext'
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/lib/social-service'
import { getRelativeTime } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'
import type { Notification } from '@/types/social'

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const cls = 'h-4 w-4'
  if (type === 'friend_request') return <UserPlus className={cn(cls, 'text-primary')} />
  if (type === 'friend_accepted') return <UserPlus className={cn(cls, 'text-green-500')} />
  if (type === 'message') return <MessageCircle className={cn(cls, 'text-blue-500')} />
  if (type === 'content_shared') return <Share2 className={cn(cls, 'text-purple-500')} />
  if (type === 'group_invite') return <Users className={cn(cls, 'text-orange-500')} />
  return <Bell className={cls} />
}

function getNavTarget(n: Notification): string | null {
  if (n.type === 'friend_request' || n.type === 'friend_accepted') return '/social'
  if (n.type === 'message') return '/social'
  if (n.type === 'content_shared') return '/social'
  if (n.type === 'group_invite') return '/groups'
  return null
}

export function NotificationsPanel({ dropUp = false, dropDown = false }: { dropUp?: boolean; dropDown?: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    notifications,
    unreadNotificationCount,
    markNotificationReadLocal,
    markAllNotificationsReadLocal,
    removeNotificationLocal,
  } = useSocialContext()
  const [open, setOpen] = useState(false)
  const [fixedPos, setFixedPos] = useState({ bottom: 0, left: 0, top: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      if (dropUp) {
        // Sidebar: open upward
        setFixedPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left, top: 0 })
      } else {
        // Mobile top nav or desktop: open downward, clamped to screen edge
        const left = Math.min(rect.left, window.innerWidth - 320 - 8)
        setFixedPos({ bottom: 0, left: Math.max(8, left), top: rect.bottom + 4 })
      }
    }
    setOpen(v => !v)
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleMarkRead(n: Notification, e: React.MouseEvent) {
    e.stopPropagation()
    markNotificationReadLocal(n.id)
    await markNotificationRead(n.id)
  }

  async function handleDelete(n: Notification, e: React.MouseEvent) {
    e.stopPropagation()
    removeNotificationLocal(n.id)
    await deleteNotification(n.id)
  }

  async function handleMarkAllRead() {
    markAllNotificationsReadLocal()
    const unread = notifications.find(n => !n.read)
    if (unread) await markAllNotificationsRead(unread.user_id)
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      markNotificationReadLocal(n.id)
      await markNotificationRead(n.id)
    }
    const target = getNavTarget(n)
    if (target) {
      navigate(target)
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="h-9 w-9 relative"
        onClick={handleToggle}
      >
        <Bell className="h-4 w-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-0.5">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </Button>

      {open && createPortal(
        <div
          className="w-80 max-h-[480px] flex flex-col bg-card border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={dropUp
            ? { position: 'fixed', bottom: fixedPos.bottom, left: fixedPos.left, zIndex: 9999 }
            : dropDown
            ? { position: 'fixed', top: fixedPos.top, left: fixedPos.left, zIndex: 9999 }
            : { position: 'fixed', top: fixedPos.top, left: fixedPos.left, zIndex: 9999 }
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <h3 className="font-semibold text-sm">{t.notifications.title}</h3>
            {unreadNotificationCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t.notifications.markAllRead}
              </Button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">{t.notifications.empty}</p>
                <p className="text-xs text-muted-foreground/60">{t.notifications.allCaughtUp}</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      'flex items-start gap-3 p-3 cursor-pointer transition-colors group hover:bg-muted/50',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      !n.read ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.read && 'font-medium')}>{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{getRelativeTime(n.created_at)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={e => handleMarkRead(n, e)}
                          title={t.notifications.markAsRead}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={e => handleDelete(n, e)}
                        title={t.common.delete}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2 ml-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

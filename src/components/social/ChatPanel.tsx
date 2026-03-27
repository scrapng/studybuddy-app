import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Send, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FriendAvatar } from './FriendAvatar'
import { getMessages, sendMessage, markMessagesRead } from '@/lib/social-service'
import { useSocialContext } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getRelativeTime } from '@/lib/utils'
import type { Friend, Message } from '@/types/social'
import { cn } from '@/lib/utils'

interface Props {
  friend: Friend
  onBack?: () => void
  mobileBackButton?: ReactNode
}

export function ChatPanel({ friend, onBack, mobileBackButton }: Props) {
  const { user } = useAuth()
  const { addLastMessage, clearUnreadCount } = useSocialContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      const msgs = await getMessages(user!.id, friend.profile.id)
      setMessages(msgs)
      setLoading(false)
      await markMessagesRead(user!.id, friend.profile.id)
      clearUnreadCount(friend.profile.id)
    }

    load()

    // Subscribe to real-time messages in this conversation
    const channel = supabase
      .channel(`chat-${user.id}-${friend.profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${friend.profile.id}`,
        },
        async (payload) => {
          const msg = payload.new as Message
          if (msg.recipient_id !== user.id) return
          setMessages(prev => [...prev, msg])
          addLastMessage(friend.profile.id, msg)
          await markMessagesRead(user.id, friend.profile.id)
          clearUnreadCount(friend.profile.id)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [user?.id, friend.profile.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!user || !body.trim() || sending) return
    setSending(true)
    const msg = await sendMessage(user.id, friend.profile.id, body.trim())
    if (msg) {
      setMessages(prev => [...prev, msg])
      addLastMessage(friend.profile.id, msg)
      setBody('')
    }
    setSending(false)
  }

  const name = friend.profile.display_name || friend.profile.friend_code

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b shrink-0">
        {mobileBackButton}
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <FriendAvatar profile={friend.profile} size="sm" />
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-muted-foreground font-mono">{friend.profile.friend_code}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <FriendAvatar profile={friend.profile} size="lg" />
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  )}
                >
                  <p className="break-words">{msg.body}</p>
                  <p className={cn(
                    'text-[10px] mt-1',
                    isMe ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
                  )}>
                    {getRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Message…"
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!body.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

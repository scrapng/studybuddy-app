import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Send, ArrowLeft, Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FriendAvatar } from './FriendAvatar'
import { VoiceMessageBubble } from './VoiceMessageBubble'
import { getMessages, sendMessage, markMessagesRead } from '@/lib/social-service'
import { useSocialContext } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getRelativeTime } from '@/lib/utils'
import type { Friend, Message } from '@/types/social'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

interface Props {
  friend: Friend
  onBack?: () => void
  mobileBackButton?: ReactNode
}

interface VoicePayload {
  _v: true
  data: string
  dur: number
}

function isVoiceMessage(body: string): VoicePayload | null {
  try {
    const parsed = JSON.parse(body)
    if (parsed && parsed._v === true && typeof parsed.data === 'string') {
      return parsed as VoicePayload
    }
  } catch {
    // not JSON
  }
  return null
}

function shouldShowTimestamp(prev: Message | null, curr: Message): boolean {
  if (!prev) return true
  const prevTime = new Date(prev.created_at).getTime()
  const currTime = new Date(curr.created_at).getTime()
  return currTime - prevTime >= 30 * 60 * 1000
}

function formatTimestampLabel(dateStr: string, todayLabel: string, locale: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  if (isToday) {
    return `${todayLabel} ${timeStr}`
  }

  const dateLabel = date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  return `${dateLabel}, ${timeStr}`
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function ChatPanel({ friend, onBack, mobileBackButton }: Props) {
  const { user } = useAuth()
  const { addLastMessage, clearUnreadCount } = useSocialContext()
  const { t, lang } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Voice recording state
  const [recording, setRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

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

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (!user || audioChunksRef.current.length === 0) return
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = recordingDuration
        const dataUrl = await blobToBase64(blob)
        const voiceBody = JSON.stringify({ _v: true, data: dataUrl, dur: duration })
        setSending(true)
        const msg = await sendMessage(user.id, friend.profile.id, voiceBody)
        if (msg) {
          setMessages(prev => [...prev, msg])
          addLastMessage(friend.profile.id, msg)
        }
        setSending(false)
        setRecordingDuration(0)
      }

      mediaRecorder.start()
      setRecording(true)
      setRecordingDuration(0)
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  function stopRecording() {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
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
            <p className="text-sm text-muted-foreground">{t.social.loadingMessages}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <FriendAvatar profile={friend.profile} size="lg" />
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{t.social.noMessages}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === user?.id
            const prevMsg = index > 0 ? messages[index - 1] : null
            const showTs = shouldShowTimestamp(prevMsg, msg)
            const voicePayload = isVoiceMessage(msg.body)

            return (
              <div key={msg.id}>
                {showTs && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTimestampLabel(msg.created_at, t.common.today, lang)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  {voicePayload ? (
                    <VoiceMessageBubble
                      dataUrl={voicePayload.data}
                      duration={voicePayload.dur}
                      isMe={isMe}
                    />
                  ) : (
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
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t shrink-0">
        {recording ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border bg-destructive/5 border-destructive/30">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm text-destructive font-medium">
                {t.social.recording} {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Button
              size="icon"
              variant="destructive"
              onClick={stopRecording}
              title={t.social.stopAndSend}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder={t.social.messagePlaceholder}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={startRecording}
              disabled={sending}
              title={t.social.recordVoice}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleSend} disabled={!body.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

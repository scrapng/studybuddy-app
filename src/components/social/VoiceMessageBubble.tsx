import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  dataUrl: string
  duration: number
  isMe: boolean
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Simple waveform bars — static decorative representation
const BAR_COUNT = 20
const BAR_HEIGHTS = [3, 5, 8, 6, 10, 7, 4, 9, 6, 8, 5, 10, 7, 4, 8, 6, 9, 5, 7, 4]

export function VoiceMessageBubble({ dataUrl, duration, isMe }: Props) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(dataUrl)
    audioRef.current = audio

    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(Math.round(audio.duration))
      }
    }

    audio.ontimeupdate = () => {
      setCurrentTime(Math.floor(audio.currentTime))
    }

    audio.onended = () => {
      setPlaying(false)
      setCurrentTime(0)
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [dataUrl])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(console.error)
      setPlaying(true)
    }
  }

  const progress = audioDuration > 0 ? currentTime / audioDuration : 0
  const filledBars = Math.round(progress * BAR_COUNT)

  return (
    <div
      className={cn(
        'flex items-center gap-2 max-w-[75%] rounded-2xl px-3 py-2',
        isMe
          ? 'bg-primary text-primary-foreground rounded-br-sm'
          : 'bg-muted rounded-bl-sm'
      )}
    >
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          'h-8 w-8 shrink-0 rounded-full',
          isMe
            ? 'hover:bg-primary-foreground/20 text-primary-foreground'
            : 'hover:bg-muted-foreground/20'
        )}
        onClick={togglePlay}
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Waveform bars */}
      <div className="flex items-center gap-[2px] flex-1">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={cn(
              'w-[3px] rounded-full transition-colors',
              i < filledBars
                ? isMe ? 'bg-primary-foreground' : 'bg-primary'
                : isMe ? 'bg-primary-foreground/40' : 'bg-muted-foreground/40'
            )}
            style={{ height: h * 2 }}
          />
        ))}
      </div>

      <span className={cn(
        'text-[10px] shrink-0 tabular-nums',
        isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {playing ? formatDuration(currentTime) : formatDuration(audioDuration)}
      </span>
    </div>
  )
}

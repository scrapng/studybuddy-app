import { useEffect, useState } from 'react'
import { MessageCircle, Trophy, Clock, Flame, Brain, UserMinus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FriendAvatar } from './FriendAvatar'
import { supabase } from '@/lib/supabase'
import { unfriend } from '@/lib/social-service'
import { useSocialContext } from '@/contexts/SocialContext'
import { formatDuration } from '@/lib/utils'
import { ACHIEVEMENTS, getUnlockedAchievements } from '@/lib/achievements'
import { toast } from 'sonner'
import type { Friend } from '@/types/social'

interface FriendStats {
  totalStudyTime: number
  totalSessions: number
  streak: number
  masteredCards: number
  totalFlashcards: number
}

interface Props {
  friend: Friend
  onChat: () => void
}

export function FriendProfilePanel({ friend, onChat }: Props) {
  const { removeFriendLocal } = useSocialContext()
  const [stats, setStats] = useState<FriendStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true)
      try {
        const { data } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', friend.profile.id)
          .single()

        if (data?.data) {
          const d = data.data as {
            sessions?: Array<{ duration: number; startTime: string }>
            studySets?: Array<{ flashcards: Array<{ mastery: string }> }>
          }
          const sessions = d.sessions ?? []
          const studySets = d.studySets ?? []
          const allCards = studySets.flatMap(s => s.flashcards ?? [])

          // Calculate streak from sessions
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const sessionDays = new Set(
            sessions.map(s => new Date(s.startTime).toDateString())
          )
          let streak = 0
          for (let i = 0; i < 365; i++) {
            const d = new Date(today)
            d.setDate(today.getDate() - i)
            if (sessionDays.has(d.toDateString())) streak++
            else if (i > 0) break
          }

          setStats({
            totalStudyTime: sessions.reduce((t, s) => t + (s.duration ?? 0), 0),
            totalSessions: sessions.length,
            streak,
            masteredCards: allCards.filter(c => c.mastery === 'mastered').length,
            totalFlashcards: allCards.length,
          })
        }
      } catch {
        // Stats unavailable (user hasn't shared)
      }
      setLoadingStats(false)
    }
    loadStats()
  }, [friend.profile.id])

  async function handleUnfriend() {
    await unfriend(friend.friendship_id)
    removeFriendLocal(friend.friendship_id)
    toast.success(`Removed ${friend.profile.display_name || 'friend'}`)
  }

  const name = friend.profile.display_name || friend.profile.friend_code

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 text-center mb-4">
            <FriendAvatar profile={friend.profile} size="lg" />
            <div>
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{friend.profile.friend_code}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={onChat} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
            <Button
              variant="outline"
              className="gap-2 hover:text-red-500 hover:border-red-300"
              onClick={handleUnfriend}
            >
              <UserMinus className="h-4 w-4" />
              Unfriend
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Study Stats</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Study Time</span>
                </div>
                <p className="font-bold">{formatDuration(stats.totalStudyTime)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Streak</span>
                </div>
                <p className="font-bold">{stats.streak} days</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Brain className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs text-muted-foreground">Mastered</span>
                </div>
                <p className="font-bold">{stats.masteredCards} <span className="text-xs font-normal text-muted-foreground">/ {stats.totalFlashcards}</span></p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Sessions</span>
                </div>
                <p className="font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Stats not available</p>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      {stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const unlocked = getUnlockedAchievements({
                totalSessions: stats.totalSessions,
                totalStudyTime: stats.totalStudyTime,
                streak: stats.streak,
                masteredCards: stats.masteredCards,
                totalFlashcards: stats.totalFlashcards,
                totalSubjects: 1,
                sessions: [],
                allCards: [],
              })
              const unlockedIds = new Set(unlocked.map(a => a.id))
              return (
                <div className="grid grid-cols-4 gap-2">
                  {ACHIEVEMENTS.slice(0, 8).map(achievement => {
                    const isUnlocked = unlockedIds.has(achievement.id)
                    return (
                      <div
                        key={achievement.id}
                        title={achievement.name}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center ${
                          isUnlocked ? 'bg-yellow-500/10' : 'bg-muted/30 opacity-40'
                        }`}
                      >
                        <span className="text-xl">{achievement.icon}</span>
                        <span className="text-[9px] text-muted-foreground leading-tight line-clamp-1">
                          {achievement.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

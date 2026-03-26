import { useState } from 'react'
import { UserPlus, MessageCircle, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FriendAvatar } from './FriendAvatar'
import { AddFriendDialog } from './AddFriendDialog'
import { useSocialContext } from '@/contexts/SocialContext'
import type { Friend } from '@/types/social'
import { cn } from '@/lib/utils'

interface Props {
  selectedFriendId?: string
  onSelectFriend: (friend: Friend, view: 'profile' | 'chat') => void
}

export function FriendsList({ selectedFriendId, onSelectFriend }: Props) {
  const { friends, pendingIncoming, unreadMessageCounts } = useSocialContext()
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = friends.filter(f => {
    const name = f.profile.display_name || f.profile.friend_code
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Friends</h2>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)} className="gap-1.5 h-7 text-xs">
            <UserPlus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search friends…"
            className="h-8 pl-8 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {pendingIncoming.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
            <Badge variant="destructive" className="text-xs h-5">{pendingIncoming.length}</Badge>
            <span className="text-xs text-muted-foreground">pending request{pendingIncoming.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Friends list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
            <UserPlus className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">No friends yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add friends using their friend code</p>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Add Friend
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {filtered.map(friend => {
              const unread = unreadMessageCounts[friend.profile.id] ?? 0
              const isSelected = selectedFriendId === friend.profile.id
              const name = friend.profile.display_name || friend.profile.friend_code

              return (
                <div
                  key={friend.friendship_id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group',
                    isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                  onClick={() => onSelectFriend(friend, 'profile')}
                >
                  <FriendAvatar profile={friend.profile} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{friend.profile.friend_code}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={e => { e.stopPropagation(); onSelectFriend(friend, 'chat') }}
                      title="Message"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={e => { e.stopPropagation(); onSelectFriend(friend, 'profile') }}
                      title="Profile"
                    >
                      <User className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {unread > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 text-xs shrink-0">
                      {unread}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddFriendDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

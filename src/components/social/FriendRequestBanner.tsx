import { useState } from 'react'
import { UserPlus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSocialContext } from '@/contexts/SocialContext'
import { respondToFriendRequest } from '@/lib/social-service'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function FriendRequestBanner() {
  const { pendingIncoming, acceptRequestLocal, rejectRequestLocal } = useSocialContext()
  const { user } = useAuth()
  const [responding, setResponding] = useState<string | null>(null)

  // Show the most recent unresponded request
  const request = pendingIncoming[0]
  if (!request) return null

  const senderName =
    request.requester?.display_name ||
    request.requester?.friend_code ||
    'Someone'

  async function handleAccept() {
    if (!user) return
    setResponding(request.id)
    await respondToFriendRequest(request.id, 'accepted', request.requester_id, user.id)
    acceptRequestLocal(request.id, {
      friendship_id: request.id,
      profile: request.requester!,
      since: new Date().toISOString(),
    })
    toast.success(`You are now friends with ${senderName}!`)
    setResponding(null)
  }

  async function handleReject() {
    if (!user) return
    setResponding(request.id)
    await respondToFriendRequest(request.id, 'rejected', request.requester_id, user.id)
    rejectRequestLocal(request.id)
    setResponding(null)
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="bg-card border rounded-xl shadow-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Friend Request</p>
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground">{senderName}</span> wants to be your friend
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleAccept}
            disabled={responding === request.id}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20"
            onClick={handleReject}
            disabled={responding === request.id}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Decline
          </Button>
        </div>
        {pendingIncoming.length > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            +{pendingIncoming.length - 1} more request{pendingIncoming.length > 2 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

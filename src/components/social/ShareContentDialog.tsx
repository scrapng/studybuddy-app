import { useState } from 'react'
import { Share2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { shareContent } from '@/lib/social-service'
import { useSocialContext } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { SharedContentType } from '@/types/social'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: SharedContentType
  title: string
  payload: Record<string, unknown>
}

export function ShareContentDialog({ open, onOpenChange, contentType, title, payload }: Props) {
  const { user } = useAuth()
  const { friends } = useSocialContext()
  const [recipientId, setRecipientId] = useState('')
  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    if (!user || !recipientId) return
    setSharing(true)
    const ok = await shareContent(user.id, recipientId, null, contentType, title, payload)
    if (ok) {
      toast.success('Content shared!')
      onOpenChange(false)
      setRecipientId('')
    } else {
      toast.error('Failed to share. Try again.')
    }
    setSharing(false)
  }

  const contentTypeLabel = contentType === 'note'
    ? 'Note'
    : contentType === 'flashcard_set'
    ? 'Flashcard Set'
    : 'Quiz Set'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share {contentTypeLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{contentTypeLabel}</p>
            <p className="font-medium text-sm truncate">{title}</p>
          </div>

          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              You have no friends to share with yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label>Share with</Label>
              <Select value={recipientId} onValueChange={(v) => setRecipientId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a friend…" />
                </SelectTrigger>
                <SelectContent>
                  {friends.map(f => (
                    <SelectItem key={f.profile.id} value={f.profile.id}>
                      {f.profile.display_name || f.profile.friend_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleShare}
            disabled={!recipientId || sharing || friends.length === 0}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

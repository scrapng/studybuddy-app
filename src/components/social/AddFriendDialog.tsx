import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getProfileByFriendCode, sendFriendRequest } from '@/lib/social-service'
import { useAuth } from '@/contexts/AuthContext'
import { useSocialContext } from '@/contexts/SocialContext'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddFriendDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth()
  const { profile } = useSocialContext()
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!user || !code.trim()) return

    const trimmed = code.trim().toUpperCase()

    if (trimmed === profile?.friend_code) {
      toast.error(t.social.cantAddYourself)
      return
    }

    setLoading(true)

    const targetProfile = await getProfileByFriendCode(trimmed)
    if (!targetProfile) {
      toast.error(t.social.noUserFound)
      setLoading(false)
      return
    }

    const result = await sendFriendRequest(user.id, targetProfile.id)

    if (!result.success) {
      if (result.error === 'already_friends') toast.error(t.social.alreadyFriends)
      else if (result.error === 'request_pending') toast.info(t.social.requestPending)
      else toast.error(t.social.requestFailed)
    } else {
      toast.success(t.social.requestSent.replace('{name}', targetProfile.display_name || trimmed))
      setCode('')
      onOpenChange(false)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t.social.addFriend}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {t.social.addFriendDesc}
          </p>
          {profile && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t.social.yourFriendCode}</p>
              <p className="font-mono font-bold text-lg tracking-widest text-primary">
                {profile.friend_code}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label>{t.social.friendCode}</Label>
            <Input
              placeholder={t.social.friendCodePlaceholder}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="font-mono tracking-widest text-center text-lg"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} disabled={loading || code.trim().length !== 8}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t.social.sendRequest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

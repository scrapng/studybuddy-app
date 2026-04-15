import { useState, useEffect } from 'react'
import { Share2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { shareContent, getMyGroups } from '@/lib/social-service'
import { useSocialContext } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { SharedContentType, StudyGroup } from '@/types/social'
import { useTranslation } from '@/hooks/useTranslation'

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
  const { t } = useTranslation()
  const [recipientId, setRecipientId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [activeTab, setActiveTab] = useState('friends')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (open && user) {
      getMyGroups(user.id).then(setGroups)
    }
  }, [open, user?.id])

  async function handleShare() {
    if (!user) return
    if (activeTab === 'friends' && !recipientId) return
    if (activeTab === 'groups' && !groupId) return

    setSharing(true)
    const rId = activeTab === 'friends' ? recipientId : null
    const gId = activeTab === 'groups' ? groupId : null
    const ok = await shareContent(user.id, rId, gId, contentType, title, payload)
    if (ok) {
      toast.success(t.social.shareSuccess)
      onOpenChange(false)
      setRecipientId('')
      setGroupId('')
    } else {
      toast.error(t.social.shareFailed)
    }
    setSharing(false)
  }

  const contentTypeLabel = contentType === 'note'
    ? t.social.shareNote
    : contentType === 'flashcard_set'
    ? t.social.shareFlashcardSet
    : t.social.shareQuizSet

  const isShareDisabled = sharing
    || (activeTab === 'friends' && (!recipientId || friends.length === 0))
    || (activeTab === 'groups' && (!groupId || groups.length === 0))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {`${t.studySet.share} ${contentTypeLabel}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{contentTypeLabel}</p>
            <p className="font-medium text-sm truncate">{title}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="friends" className="flex-1">
                {t.social.friends}
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex-1">
                {t.nav.groups}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="mt-3">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {t.social.noFriendsToShare}
                </p>
              ) : (
                <div className="space-y-1.5">
                  <Label>{t.social.shareWith}</Label>
                  <Select value={recipientId} onValueChange={(v) => setRecipientId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.social.selectFriendPlaceholder} />
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
            </TabsContent>

            <TabsContent value="groups" className="mt-3">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {t.social.notInGroups}
                </p>
              ) : (
                <div className="space-y-1.5">
                  <Label>{t.social.shareWithGroup}</Label>
                  <Select value={groupId} onValueChange={(v) => setGroupId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.social.selectGroupPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleShare}
            disabled={isShareDisabled}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {t.studySet.share}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

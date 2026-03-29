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
  const { t, lang } = useTranslation()
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
      toast.success(lang === 'pl' ? 'Treść udostępniona!' : 'Content shared!')
      onOpenChange(false)
      setRecipientId('')
      setGroupId('')
    } else {
      toast.error(lang === 'pl' ? 'Nie udało się udostępnić. Spróbuj ponownie.' : 'Failed to share. Try again.')
    }
    setSharing(false)
  }

  const contentTypeLabel = contentType === 'note'
    ? (lang === 'pl' ? 'Notatka' : 'Note')
    : contentType === 'flashcard_set'
    ? (lang === 'pl' ? 'Zestaw fiszek' : 'Flashcard Set')
    : (lang === 'pl' ? 'Zestaw quizów' : 'Quiz Set')

  const isShareDisabled = sharing
    || (activeTab === 'friends' && (!recipientId || friends.length === 0))
    || (activeTab === 'groups' && (!groupId || groups.length === 0))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            {lang === 'pl' ? `Udostępnij ${contentTypeLabel}` : `Share ${contentTypeLabel}`}
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
                {lang === 'pl' ? 'Znajomi' : 'Friends'}
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex-1">
                {lang === 'pl' ? 'Grupy' : 'Groups'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="mt-3">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {lang === 'pl'
                    ? 'Nie masz jeszcze znajomych do udostępnienia.'
                    : 'You have no friends to share with yet.'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  <Label>{lang === 'pl' ? 'Udostępnij znajomemu' : 'Share with'}</Label>
                  <Select value={recipientId} onValueChange={(v) => setRecipientId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder={lang === 'pl' ? 'Wybierz znajomego…' : 'Select a friend…'} />
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
                  {lang === 'pl'
                    ? 'Nie należysz do żadnych grup.'
                    : 'You are not a member of any groups yet.'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  <Label>{lang === 'pl' ? 'Udostępnij grupie' : 'Share with group'}</Label>
                  <Select value={groupId} onValueChange={(v) => setGroupId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder={lang === 'pl' ? 'Wybierz grupę…' : 'Select a group…'} />
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
            {lang === 'pl' ? 'Udostępnij' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

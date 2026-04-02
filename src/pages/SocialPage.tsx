import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { FriendsList } from '@/components/social/FriendsList'
import { FriendProfilePanel } from '@/components/social/FriendProfilePanel'
import { ChatPanel } from '@/components/social/ChatPanel'
import type { Friend } from '@/types/social'

type View = 'profile' | 'chat'

export function SocialPage() {
  const [selected, setSelected] = useState<{ friend: Friend; view: View } | null>(null)
  const { t } = useTranslation()

  function handleSelect(friend: Friend, view: View) {
    setSelected({ friend, view })
  }

  function handleBack() {
    setSelected(null)
  }

  return (
    <div className="h-full flex rounded-xl border overflow-hidden" style={{ minHeight: 'calc(100vh - 10rem)' }}>
      {/* Left panel: friends list — hidden on mobile when a friend is selected */}
      <div className={`
        w-full md:w-64 md:flex shrink-0 flex-col bg-white/30 dark:bg-card/40 backdrop-blur-md
        ${selected ? 'hidden md:flex' : 'flex'}
      `}>
        <FriendsList
          selectedFriendId={selected?.friend.profile.id}
          onSelectFriend={handleSelect}
        />
      </div>

      {/* Right panel — full width on mobile, flex-1 on desktop */}
      <div className={`
        flex-1 flex flex-col min-w-0 bg-white/65 dark:bg-card/70 backdrop-blur-md
        ${selected ? 'flex' : 'hidden md:flex'}
      `}>
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <div className="rounded-full bg-primary/10 p-6">
              <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t.social.selectFriend}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t.social.selectFriendDesc}
              </p>
            </div>
          </div>
        ) : selected.view === 'chat' ? (
          <ChatPanel
            friend={selected.friend}
            onBack={() => setSelected(s => s ? { ...s, view: 'profile' } : null)}
            mobileBackButton={
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            }
          />
        ) : (
          <div className="p-4 overflow-y-auto flex-1">
            {/* Mobile back button */}
            <div className="flex items-center gap-2 mb-4 md:hidden">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                {t.common.back}
              </Button>
            </div>
            <FriendProfilePanel
              friend={selected.friend}
              onChat={() => setSelected(s => s ? { ...s, view: 'chat' } : null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettingsContext } from '@/contexts/SettingsContext'
import { supabase } from '@/lib/supabase'
import {
  getOrCreateProfile,
  getFriends,
  getPendingRequests,
  getSentRequests,
  getNotifications,
  updateDisplayName as updateDisplayNameService,
} from '@/lib/social-service'
import type { Profile, Friend, Friendship, Notification, Message } from '@/types/social'

interface SocialState {
  profile: Profile | null
  friends: Friend[]
  pendingIncoming: Friendship[]
  pendingSent: Friendship[]
  notifications: Notification[]
  // Map friendId -> last message (for unread badges)
  lastMessages: Record<string, Message>
  unreadMessageCounts: Record<string, number>
  loading: boolean
}

interface SocialContextValue extends SocialState {
  unreadNotificationCount: number
  refreshFriends: () => Promise<void>
  refreshNotifications: () => Promise<void>
  addNotification: (n: Notification) => void
  markNotificationReadLocal: (id: string) => void
  markAllNotificationsReadLocal: () => void
  removeNotificationLocal: (id: string) => void
  addPendingRequest: (f: Friendship) => void
  acceptRequestLocal: (friendshipId: string, friend: Friend) => void
  rejectRequestLocal: (friendshipId: string) => void
  removeFriendLocal: (friendshipId: string) => void
  addLastMessage: (friendId: string, msg: Message) => void
  clearUnreadCount: (friendId: string) => void
  updateDisplayName: (name: string) => Promise<void>
}

const SocialContext = createContext<SocialContextValue | null>(null)

export function useSocialContext(): SocialContextValue {
  const ctx = useContext(SocialContext)
  if (!ctx) throw new Error('useSocialContext must be used within SocialProvider')
  return ctx
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { setLanguage } = useSettingsContext()
  const [state, setState] = useState<SocialState>({
    profile: null,
    friends: [],
    pendingIncoming: [],
    pendingSent: [],
    notifications: [],
    lastMessages: {},
    unreadMessageCounts: {},
    loading: true,
  })

  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([])

  // Load initial data when user changes
  useEffect(() => {
    if (!user?.id) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    const userId = user.id

    // Request browser notification permission once
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    async function init() {
      let [profile, friends, pendingIncoming, pendingSent, notifications] = await Promise.all([
        getOrCreateProfile(userId),
        getFriends(userId),
        getPendingRequests(userId),
        getSentRequests(userId),
        getNotifications(userId),
      ])

      // Apply saved language preference from profile
      if (profile?.language) {
        setLanguage(profile.language as import('@/lib/i18n').Language)
      }

      // If profile has no display_name but user signed up with one, save it now
      if (profile && !profile.display_name) {
        const metaName = user?.user_metadata?.display_name as string | undefined
        if (metaName?.trim()) {
          await updateDisplayNameService(userId, metaName.trim())
          profile = { ...profile, display_name: metaName.trim() }
        }
      }

      setState(s => ({
        ...s,
        profile,
        friends,
        pendingIncoming,
        pendingSent,
        notifications,
        loading: false,
      }))
    }

    init()

    // Set up real-time subscriptions
    const channels: ReturnType<typeof supabase.channel>[] = []

    // 1. Friend requests addressed to me
    const friendshipChannel = supabase
      .channel(`social-friendships-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // New friend request incoming
            const newFriendship = payload.new as Friendship
            // Fetch requester profile
            const { data: requesterProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newFriendship.requester_id)
              .single()

            const enriched = { ...newFriendship, requester: requesterProfile ?? undefined }
            setState(s => ({
              ...s,
              pendingIncoming: [enriched, ...s.pendingIncoming.filter(f => f.id !== enriched.id)],
            }))
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Friendship
            if (updated.status === 'accepted') {
              // Move from pending to friends (guard against duplicate from optimistic update)
              setState(s => {
                if (s.friends.some(f => f.friendship_id === updated.id)) {
                  return {
                    ...s,
                    pendingIncoming: s.pendingIncoming.filter(f => f.id !== updated.id),
                  }
                }
                const req = s.pendingIncoming.find(f => f.id === updated.id)
                const newFriends = req?.requester
                  ? [
                      ...s.friends,
                      {
                        friendship_id: updated.id,
                        profile: req.requester,
                        since: updated.updated_at,
                      },
                    ]
                  : s.friends
                return {
                  ...s,
                  pendingIncoming: s.pendingIncoming.filter(f => f.id !== updated.id),
                  friends: newFriends,
                }
              })
            } else if (updated.status === 'rejected') {
              setState(s => ({
                ...s,
                pendingIncoming: s.pendingIncoming.filter(f => f.id !== updated.id),
              }))
            }
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setState(s => ({
              ...s,
              friends: s.friends.filter(f => f.friendship_id !== deleted.id),
              pendingIncoming: s.pendingIncoming.filter(f => f.id !== deleted.id),
            }))
          }
        }
      )
      .subscribe()

    channels.push(friendshipChannel)

    // 1b. Requests I sent — watch for acceptance/rejection
    const sentChannel = supabase
      .channel(`social-sent-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new as Friendship
          if (updated.status === 'accepted') {
            setState(s => {
              if (s.friends.some(f => f.friendship_id === updated.id)) {
                return { ...s, pendingSent: s.pendingSent.filter(f => f.id !== updated.id) }
              }
              // Fetch addressee profile to build Friend object
              return { ...s, pendingSent: s.pendingSent.filter(f => f.id !== updated.id) }
            })
            // Fetch the addressee's profile and add to friends list
            const { data: addresseeProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', updated.addressee_id)
              .single()
            if (addresseeProfile) {
              setState(s => {
                if (s.friends.some(f => f.friendship_id === updated.id)) return s
                return {
                  ...s,
                  friends: [
                    ...s.friends,
                    { friendship_id: updated.id, profile: addresseeProfile, since: updated.updated_at },
                  ],
                }
              })
            }
          } else if (updated.status === 'rejected') {
            setState(s => ({
              ...s,
              pendingSent: s.pendingSent.filter(f => f.id !== updated.id),
            }))
          }
        }
      )
      .subscribe()

    channels.push(sentChannel)

    // 2. Notifications (INSERT + UPDATE + DELETE)
    const notifChannel = supabase
      .channel(`social-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notification
          setState(s => ({
            ...s,
            notifications: s.notifications.some(x => x.id === n.id)
              ? s.notifications
              : [n, ...s.notifications],
          }))
          if (
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.visibilityState === 'hidden'
          ) {
            new Notification(n.title, {
              body: n.body ?? undefined,
              icon: '/favicon.ico',
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          setState(s => ({
            ...s,
            notifications: s.notifications.map(n => n.id === updated.id ? updated : n),
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string }
          setState(s => ({
            ...s,
            notifications: s.notifications.filter(n => n.id !== deleted.id),
          }))
        }
      )
      .subscribe()

    channels.push(notifChannel)

    // 3. Incoming messages (unread badge tracking only)
    const msgChannel = supabase
      .channel(`social-messages-unread-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setState(s => ({
            ...s,
            lastMessages: { ...s.lastMessages, [msg.sender_id]: msg },
            unreadMessageCounts: {
              ...s.unreadMessageCounts,
              [msg.sender_id]: (s.unreadMessageCounts[msg.sender_id] ?? 0) + 1,
            },
          }))
        }
      )
      .subscribe()

    channels.push(msgChannel)

    channelsRef.current = channels

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [user?.id])

  const unreadNotificationCount = state.notifications.filter(n => !n.read).length

  function addNotification(n: Notification) {
    setState(s => ({ ...s, notifications: [n, ...s.notifications] }))
  }

  function markNotificationReadLocal(id: string) {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }))
  }

  function markAllNotificationsReadLocal() {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    }))
  }

  function removeNotificationLocal(id: string) {
    setState(s => ({
      ...s,
      notifications: s.notifications.filter(n => n.id !== id),
    }))
  }

  function addPendingRequest(f: Friendship) {
    setState(s => ({ ...s, pendingIncoming: [f, ...s.pendingIncoming] }))
  }

  function acceptRequestLocal(friendshipId: string, friend: Friend) {
    setState(s => ({
      ...s,
      pendingIncoming: s.pendingIncoming.filter(f => f.id !== friendshipId),
      friends: [...s.friends, friend],
    }))
  }

  function rejectRequestLocal(friendshipId: string) {
    setState(s => ({
      ...s,
      pendingIncoming: s.pendingIncoming.filter(f => f.id !== friendshipId),
    }))
  }

  function removeFriendLocal(friendshipId: string) {
    setState(s => ({
      ...s,
      friends: s.friends.filter(f => f.friendship_id !== friendshipId),
    }))
  }

  function addLastMessage(friendId: string, msg: Message) {
    setState(s => ({
      ...s,
      lastMessages: { ...s.lastMessages, [friendId]: msg },
    }))
  }

  function clearUnreadCount(friendId: string) {
    setState(s => ({
      ...s,
      unreadMessageCounts: { ...s.unreadMessageCounts, [friendId]: 0 },
    }))
  }

  async function updateDisplayName(name: string) {
    if (!state.profile) return
    await updateDisplayNameService(state.profile.id, name)
    setState(s => s.profile ? { ...s, profile: { ...s.profile!, display_name: name.trim() || null } } : s)
  }

  async function refreshFriends() {
    if (!user?.id) return
    const [friends, pendingIncoming, pendingSent] = await Promise.all([
      getFriends(user.id),
      getPendingRequests(user.id),
      getSentRequests(user.id),
    ])
    setState(s => ({ ...s, friends, pendingIncoming, pendingSent }))
  }

  async function refreshNotifications() {
    if (!user?.id) return
    const notifications = await getNotifications(user.id)
    setState(s => ({ ...s, notifications }))
  }

  return (
    <SocialContext.Provider
      value={{
        ...state,
        unreadNotificationCount,
        refreshFriends,
        refreshNotifications,
        addNotification,
        markNotificationReadLocal,
        markAllNotificationsReadLocal,
        removeNotificationLocal,
        addPendingRequest,
        acceptRequestLocal,
        rejectRequestLocal,
        removeFriendLocal,
        addLastMessage,
        clearUnreadCount,
        updateDisplayName,
      }}
    >
      {children}
    </SocialContext.Provider>
  )
}

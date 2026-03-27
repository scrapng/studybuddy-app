import { supabase } from './supabase'
import type {
  Profile,
  Friendship,
  Friend,
  StudyGroup,
  GroupMember,
  SharedContent,
  SharedContentType,
  Message,
  Notification,
} from '@/types/social'

// ============================================================
// PROFILES
// ============================================================

export async function getOrCreateProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error.message)
    return null
  }

  if (data) return data as Profile

  // Profile should be auto-created by DB trigger, but create manually if missing
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating profile:', insertError.message)
    return null
  }
  return inserted as Profile
}

export async function updateDisplayName(userId: string, displayName: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() || null })
    .eq('id', userId)
  if (error) { console.error('Error updating display name:', error.message); return false }
  return true
}

export async function getProfileByFriendCode(code: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('friend_code', code.toUpperCase())
    .single()

  if (error) return null
  return data as Profile
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string; avatar_color?: string },
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error.message)
    return null
  }
  return data as Profile
}

// ============================================================
// FRIENDSHIPS
// ============================================================

export async function getFriends(userId: string): Promise<Friend[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id, requester_id, addressee_id, status, created_at,
      requester:profiles!friendships_requester_id_fkey(*),
      addressee:profiles!friendships_addressee_id_fkey(*)
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) {
    console.error('Error fetching friends:', error.message)
    return []
  }

  return ((data ?? []) as unknown as Friendship[]).map(f => ({
    friendship_id: f.id,
    profile: f.requester_id === userId ? f.addressee! : f.requester!,
    since: f.created_at,
  }))
}

export async function getPendingRequests(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      requester:profiles!friendships_requester_id_fkey(*),
      addressee:profiles!friendships_addressee_id_fkey(*)
    `)
    .eq('addressee_id', userId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending requests:', error.message)
    return []
  }
  return (data ?? []) as unknown as Friendship[]
}

export async function getSentRequests(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      addressee:profiles!friendships_addressee_id_fkey(*)
    `)
    .eq('requester_id', userId)
    .eq('status', 'pending')

  if (error) return []
  return (data ?? []) as unknown as Friendship[]
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<{ success: boolean; error?: string }> {
  // Check not already friends or request pending
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(
      `and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),` +
      `and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`
    )
    .single()

  if (existing) {
    if (existing.status === 'accepted') return { success: false, error: 'already_friends' }
    if (existing.status === 'pending') return { success: false, error: 'request_pending' }
  }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId })

  if (error) return { success: false, error: error.message }

  // Create notification for addressee
  await insertNotification(addresseeId, {
    type: 'friend_request',
    title: 'New friend request',
    body: 'Someone wants to be your friend!',
    ref_id: requesterId,
    ref_type: 'profile',
  })

  return { success: true }
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: 'accepted' | 'rejected',
  requesterId: string,
  currentUserId: string,
): Promise<void> {
  await supabase
    .from('friendships')
    .update({ status })
    .eq('id', friendshipId)

  if (status === 'accepted') {
    await insertNotification(requesterId, {
      type: 'friend_accepted',
      title: 'Friend request accepted!',
      body: 'Your friend request was accepted.',
      ref_id: currentUserId,
      ref_type: 'profile',
    })
  }
}

export async function unfriend(friendshipId: string): Promise<void> {
  await supabase.from('friendships').delete().eq('id', friendshipId)
}

// ============================================================
// MESSAGES
// ============================================================

export async function getMessages(userId: string, friendId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${friendId}),` +
      `and(sender_id.eq.${friendId},recipient_id.eq.${userId})`
    )
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    console.error('Error fetching messages:', error.message)
    return []
  }
  return (data ?? []) as Message[]
}

export async function sendMessage(
  senderId: string,
  recipientId: string,
  body: string,
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, body })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error.message)
    return null
  }

  // Create notification
  await insertNotification(recipientId, {
    type: 'message',
    title: 'New message',
    body: body.length > 60 ? body.slice(0, 60) + '…' : body,
    ref_id: senderId,
    ref_type: 'profile',
  })

  return data as Message
}

export async function markMessagesRead(userId: string, senderId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('sender_id', senderId)
    .is('read_at', null)
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return (data ?? []) as Notification[]
}

export async function insertNotification(
  userId: string,
  n: {
    type: Notification['type']
    title: string
    body?: string
    ref_id?: string
    ref_type?: string
  },
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type: n.type,
    title: n.title,
    body: n.body ?? null,
    ref_id: n.ref_id ?? null,
    ref_type: n.ref_type ?? null,
  })
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await supabase.from('notifications').delete().eq('id', notificationId)
}

// ============================================================
// STUDY GROUPS
// ============================================================

export async function getMyGroups(userId: string): Promise<StudyGroup[]> {
  const { data, error } = await supabase
    .from('study_groups')
    .select('*, group_members(count)')
    .or(
      `owner_id.eq.${userId},id.in.(${
        // sub-select handled by RLS + join
        'select group_id from group_members where user_id = ' + userId
      })`
    )

  if (error) {
    // Simpler fallback query
    const { data: d2 } = await supabase
      .from('group_members')
      .select('group_id, study_groups(*)')
      .eq('user_id', userId)

    if (!d2) return []
    return d2.map((r: any) => r.study_groups).filter(Boolean) as StudyGroup[]
  }
  return (data ?? []) as StudyGroup[]
}

export async function createStudyGroup(
  ownerId: string,
  name: string,
  description?: string,
): Promise<StudyGroup | null> {
  // Generate unique invite code
  const invite_code = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { data: group, error } = await supabase
    .from('study_groups')
    .insert({ name, description: description ?? null, owner_id: ownerId, invite_code })
    .select()
    .single()

  if (error) {
    console.error('Error creating group:', error.message)
    return null
  }

  // Add owner as member
  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: ownerId, role: 'owner' })

  return group as StudyGroup
}

export async function joinGroupByCode(
  userId: string,
  inviteCode: string,
): Promise<{ success: boolean; group?: StudyGroup; error?: string }> {
  const { data: group, error } = await supabase
    .from('study_groups')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error || !group) return { success: false, error: 'group_not_found' }

  const { error: joinError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'member' })

  if (joinError) {
    if (joinError.code === '23505') return { success: false, error: 'already_member' }
    return { success: false, error: joinError.message }
  }

  return { success: true, group: group as StudyGroup }
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profile:profiles(*)')
    .eq('group_id', groupId)

  if (error) return []
  return (data ?? []) as unknown as GroupMember[]
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
}

export async function deleteGroup(groupId: string): Promise<void> {
  await supabase.from('study_groups').delete().eq('id', groupId)
}

// ============================================================
// SHARED CONTENT
// ============================================================

export async function shareContent(
  senderId: string,
  recipientId: string | null,
  groupId: string | null,
  contentType: SharedContentType,
  title: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await supabase.from('shared_content').insert({
    sender_id: senderId,
    recipient_id: recipientId,
    group_id: groupId,
    content_type: contentType,
    title,
    payload,
  })

  if (error) {
    console.error('Error sharing content:', error.message)
    return false
  }

  // Notify recipient
  if (recipientId) {
    await insertNotification(recipientId, {
      type: 'content_shared',
      title: `Shared with you: ${title}`,
      body: `A ${contentType.replace('_', ' ')} was shared with you.`,
      ref_id: senderId,
      ref_type: 'profile',
    })
  }

  return true
}

export async function getSharedWithMe(userId: string): Promise<SharedContent[]> {
  const { data, error } = await supabase
    .from('shared_content')
    .select('*, sender:profiles!shared_content_sender_id_fkey(*)')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as SharedContent[]
}

export async function getGroupSharedContent(groupId: string): Promise<SharedContent[]> {
  const { data, error } = await supabase
    .from('shared_content')
    .select('*, sender:profiles!shared_content_sender_id_fkey(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as SharedContent[]
}

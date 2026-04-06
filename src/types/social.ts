export interface Profile {
  id: string
  friend_code: string
  display_name: string | null
  avatar_color: string
  language: string | null
  created_at: string
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  updated_at: string
  // Joined profile data
  requester?: Profile
  addressee?: Profile
}

export interface Friend {
  friendship_id: string
  profile: Profile
  since: string
}

export interface StudyGroup {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  created_at: string
  member_count?: number
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile?: Profile
}

export type SharedContentType = 'note' | 'flashcard_set' | 'quiz_set'

export interface SharedContent {
  id: string
  sender_id: string
  recipient_id: string | null
  group_id: string | null
  content_type: SharedContentType
  title: string
  payload: Record<string, unknown>
  created_at: string
  sender?: Profile
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  read_at: string | null
  created_at: string
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'content_shared'
  | 'group_invite'
  | 'message'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  ref_id: string | null
  ref_type: string | null
  read: boolean
  created_at: string
}

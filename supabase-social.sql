-- ============================================================
-- SOCIAL FEATURES MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This migration is safe to run multiple times (idempotent)
-- ============================================================

-- Helper: auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PROFILES TABLE
-- Public profile + unique friend code, auto-created on signup
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_code  TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_color TEXT NOT NULL DEFAULT '#6366f1',
  language     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add language column if upgrading from older schema
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT;

-- Drop and recreate RLS if it exists
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Profiles readable by authenticated users"
  ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile with unique friend code on new user signup
-- Drop function with CASCADE to automatically drop dependent trigger
DROP FUNCTION IF EXISTS create_profile_on_signup() CASCADE;
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = code);
  END LOOP;
  INSERT INTO public.profiles (id, friend_code)
  VALUES (NEW.id, code)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup even if profile creation fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- Create profiles for existing users who don't have one yet
INSERT INTO profiles (id, friend_code)
SELECT
  u.id,
  upper(substring(md5(random()::text || u.id::text) FROM 1 FOR 8))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. FRIENDSHIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON friendships;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP TRIGGER IF EXISTS friendships_updated_at ON friendships;
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 3. STUDY GROUPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS study_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE study_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create groups" ON study_groups;
DROP POLICY IF EXISTS "Owner can update group" ON study_groups;
DROP POLICY IF EXISTS "Owner can delete group" ON study_groups;
DROP POLICY IF EXISTS "Group members can view their groups" ON study_groups;

CREATE POLICY "Authenticated users can create groups"
  ON study_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update group"
  ON study_groups FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete group"
  ON study_groups FOR DELETE USING (auth.uid() = owner_id);


-- ============================================================
-- 4. GROUP MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS group_members (
  group_id  UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Members can leave or be removed" ON group_members;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM group_members gm WHERE gm.group_id = group_id));

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave or be removed"
  ON group_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = group_members.group_id AND role = 'owner')
  );


-- Add group view policy for study_groups (after group_members exists)
CREATE POLICY "Group members can view their groups"
  ON study_groups FOR SELECT
  USING (
    auth.uid() = owner_id OR
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = id)
  );


-- ============================================================
-- 5. SHARED CONTENT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id     UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('note', 'flashcard_set', 'quiz_set')),
  title        TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (recipient_id IS NOT NULL AND group_id IS NULL) OR
    (recipient_id IS NULL AND group_id IS NOT NULL)
  )
);

ALTER TABLE shared_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant shared content" ON shared_content;
DROP POLICY IF EXISTS "Users can send content" ON shared_content;
DROP POLICY IF EXISTS "Sender can delete shared content" ON shared_content;

CREATE POLICY "Users can view relevant shared content"
  ON shared_content FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = recipient_id OR
    auth.uid() IN (SELECT user_id FROM group_members WHERE group_id = shared_content.group_id)
  );

CREATE POLICY "Users can send content"
  ON shared_content FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Sender can delete shared content"
  ON shared_content FOR DELETE USING (auth.uid() = sender_id);


-- ============================================================
-- 6. MESSAGES TABLE (Direct Messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to friends" ON messages;
DROP POLICY IF EXISTS "Recipient can mark messages as read" ON messages;
DROP POLICY IF EXISTS "Sender can delete messages" ON messages;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages to friends"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted' AND (
        (requester_id = auth.uid() AND addressee_id = recipient_id) OR
        (addressee_id = auth.uid() AND requester_id = recipient_id)
      )
    )
  );

CREATE POLICY "Recipient can mark messages as read"
  ON messages FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Sender can delete messages"
  ON messages FOR DELETE USING (auth.uid() = sender_id);


-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'friend_request', 'friend_accepted',
               'content_shared', 'group_invite', 'message'
             )),
  title      TEXT NOT NULL,
  body       TEXT,
  ref_id     UUID,
  ref_type   TEXT,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Any authenticated user can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Any authenticated user can insert notifications"
  ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- Enable Realtime on social tables
-- (Enable via Supabase Dashboard → Replication if needed)
-- ============================================================
-- Note: Realtime can be enabled in Supabase Dashboard → Database → Replication
-- Tables are created with REPLICA IDENTITY FULL for realtime support

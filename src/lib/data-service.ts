import { supabase } from './supabase'
import type { Subject, StudySet, StudySession } from '@/types'

export interface UserStudyData {
  subjects: Subject[]
  studySets: StudySet[]
  sessions: StudySession[]
}

const EMPTY_DATA: UserStudyData = {
  subjects: [],
  studySets: [],
  sessions: [],
}

/**
 * Load user data from Supabase.
 * Falls back to localStorage if Supabase is unavailable.
 */
export async function loadUserData(userId: string): Promise<UserStudyData> {
  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .single()

    if (!error && data?.data) {
      const parsed = data.data as UserStudyData
      return {
        subjects: parsed.subjects ?? [],
        studySets: parsed.studySets ?? [],
        sessions: parsed.sessions ?? [],
      }
    }

    // No row found = new user, return empty
    if (error?.code === 'PGRST116') {
      return EMPTY_DATA
    }

    // Other error - fall through to localStorage
    if (error) {
      console.warn('Supabase load failed, falling back to localStorage:', error.message)
    }
  } catch (e) {
    console.warn('Supabase unavailable, using localStorage:', e)
  }

  // Fallback: try localStorage
  return loadFromLocalStorage(userId)
}

/**
 * Save user data to Supabase (with localStorage backup).
 * Uses upsert so it works for both new and existing users.
 */
export async function saveUserData(userId: string, state: UserStudyData): Promise<void> {
  // Always save to localStorage as backup
  saveToLocalStorage(userId, state)

  // Save to Supabase
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert(
        {
          user_id: userId,
          data: state,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.warn('Supabase save failed (data saved locally):', error.message)
    }
  } catch (e) {
    console.warn('Supabase unavailable (data saved locally):', e)
  }
}

// --- localStorage helpers (backup/fallback) ---

function getStorageKey(userId: string): string {
  return `studybuddy-data-${userId}`
}

function loadFromLocalStorage(userId: string): UserStudyData {
  try {
    const stored = localStorage.getItem(getStorageKey(userId))
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        subjects: parsed.subjects ?? [],
        studySets: parsed.studySets ?? [],
        sessions: parsed.sessions ?? [],
      }
    }
  } catch {
    // ignore
  }
  return EMPTY_DATA
}

function saveToLocalStorage(userId: string, state: UserStudyData): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  } catch {
    // storage full
  }
}

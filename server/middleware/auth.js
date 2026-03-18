import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase = null

function getSupabaseAdmin() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
  }
  return supabase
}

export async function requireAuth(req, res, next) {
  // Skip auth if Supabase is not configured (development mode)
  if (!supabaseUrl || !supabaseServiceKey) {
    req.user = { id: 'dev-user', email: 'dev@localhost' }
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error.message)
    return res.status(500).json({ error: 'Authentication service unavailable' })
  }
}

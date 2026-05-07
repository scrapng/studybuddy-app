import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current file
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables FIRST - before other imports
dotenv.config({ path: path.join(__dirname, '.env') })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { requireAuth } from './middleware/auth.js'
import aiRoutes from './routes/ai.js'

const app = express()
const PORT = process.env.PORT || 3001
const isDev = process.env.NODE_ENV !== 'production'

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY not set. AI features will not work.')
}

// CORS must be configured BEFORE helmet (helmet can strip CORS headers)
// We use wildcard origin — security is handled by JWT auth, not origin checks.
// Authorization header-based auth doesn't require credentials:true (that's for cookies).
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.options('*', cors(corsOptions))  // handle preflight first
app.use(cors(corsOptions))

// Security middleware (after CORS so it doesn't strip CORS headers)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Rate limiting for AI routes (keyed by authenticated user ID)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 min window
  keyGenerator: (req) => req.user?.id || 'anonymous',
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NoteBuddy API Server running' })
})

// POST routing test (public, no auth) — helps diagnose 405 issues
app.post('/api/ai/test-post', (req, res) => {
  res.json({ ok: true, method: req.method, body: req.body })
})

// AI model connectivity test (public, no auth required)
app.get('/api/ai/test', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ ok: false, error: 'OPENAI_API_KEY not set on server' })
  }
  try {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-5.4-nano-2026-03-17',
      messages: [{ role: 'user', content: 'Say "OK" and nothing else.' }],
      max_completion_tokens: 10,
    })
    const text = response.choices[0]?.message?.content || ''
    res.json({ ok: true, textModel: 'gpt-5.4-nano-2026-03-17', response: text })
  } catch (err) {
    console.error('AI test error:', err?.message)
    res.status(500).json({ ok: false, textModel: 'gpt-5.4-nano-2026-03-17', error: err?.message })
  }
})

// AI routes (protected + rate limited)
app.use('/api/ai', requireAuth, aiLimiter, aiRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: isDev ? err.message : undefined
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NoteBuddy AI Server running on http://localhost:${PORT}`)
  if (isDev) {
    console.log('📌 Running in development mode (CORS: allow all origins)')
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('📌 Supabase not configured - auth middleware in passthrough mode')
    }
  }
})

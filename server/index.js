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

// Security middleware
app.use(helmet())

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173']

app.use(cors({
  origin: isDev ? true : allowedOrigins,
  credentials: true,
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

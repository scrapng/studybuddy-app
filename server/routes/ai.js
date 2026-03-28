import express from 'express'
import OpenAI from 'openai'

const router = express.Router()

const MODEL = 'gpt-5.4-nano-2026-03-17'

// Lazy-load OpenAI client
let openai = null
function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openai
}

// Language names for prompts
const LANGUAGE_NAMES = { en: 'English', pl: 'Polish' }

// Foreign language subject detection keywords
const FOREIGN_LANG_KW = [
  'english', 'angielski', 'język angielski',
  'german', 'niemiecki', 'język niemiecki', 'deutsch',
  'french', 'francuski', 'język francuski',
  'spanish', 'hiszpański', 'język hiszpański',
  'italian', 'włoski', 'język włoski',
  'russian', 'rosyjski', 'język rosyjski',
  'japanese', 'japoński', 'język japoński',
  'chinese', 'chiński', 'język chiński',
  'korean', 'koreański', 'język koreański',
  'portuguese', 'portugalski', 'język portugalski',
  'latin', 'łaciński', 'łacina',
]

function getLangInstruction(language, subjectName) {
  const langName = LANGUAGE_NAMES[language] || 'English'
  if (!subjectName) {
    return language === 'en' ? '' : `IMPORTANT: Respond entirely in ${langName}. All text must be in ${langName}.`
  }
  const sub = subjectName.toLowerCase()
  if (FOREIGN_LANG_KW.some(kw => sub.includes(kw))) {
    if (language === 'en') {
      return `This is a foreign language learning subject ("${subjectName}"). Include target language terms with English explanations.`
    }
    return `This is a foreign language learning subject ("${subjectName}"). Student's native language: ${langName}. Write explanations in ${langName}, vocabulary/examples in the target language with ${langName} translations.`
  }
  return language === 'en' ? '' : `IMPORTANT: Respond entirely in ${langName}. All text must be in ${langName}.`
}

/**
 * Call OpenAI Responses API for text-only tasks.
 * Uses `instructions` for system prompt and `input` as a string.
 */
async function callText(instructions, userPrompt, maxTokens = 4096) {
  const params = {
    model: MODEL,
    input: userPrompt,
    max_output_tokens: maxTokens,
  }
  if (instructions) {
    params.instructions = instructions
  }
  const response = await getClient().responses.create(params)
  return response.output_text || ''
}

/**
 * Call OpenAI Responses API for vision (image + text) tasks.
 * Uses array input with user message containing image and text content parts.
 */
async function callVision(imageUrl, textPrompt, maxTokens = 2048) {
  const response = await getClient().responses.create({
    model: MODEL,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_image', image_url: imageUrl, detail: 'high' },
          { type: 'input_text', text: textPrompt },
        ],
      },
    ],
    max_output_tokens: maxTokens,
  })
  return response.output_text || ''
}

// Validate API key middleware
router.use((req, res, next) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OpenAI API key not configured' })
  }
  next()
})

// ---------------------------------------------------------------------------
// OCR: Extract text from image
// ---------------------------------------------------------------------------
router.post('/ocr', async (req, res) => {
  try {
    const { imageData, language, subjectName } = req.body
    if (!imageData) return res.status(400).json({ error: 'imageData required' })

    const imageUrl = imageData.startsWith('data:')
      ? imageData
      : `data:image/jpeg;base64,${imageData}`

    const langNote = getLangInstruction(language, subjectName)
    const prompt = [
      'Extract ALL text visible in this image of handwritten or printed notes.',
      'Preserve structure, headings, bullet points, and numbering as closely as possible.',
      'If handwriting is unclear, make your best interpretation.',
      'Return ONLY the extracted text — no commentary, no extra text.',
      langNote,
    ].filter(Boolean).join('\n')

    const text = await callVision(imageUrl, prompt)
    res.json({ text, success: true })
  } catch (err) {
    console.error('OCR error:', err?.message ?? err)
    res.status(500).json({ error: 'Failed to process image', message: err?.message, success: false })
  }
})

// ---------------------------------------------------------------------------
// Enhance OCR text: Clean up raw OCR output
// ---------------------------------------------------------------------------
router.post('/enhance-ocr-text', async (req, res) => {
  try {
    const { text, language, subjectName } = req.body
    if (!text) return res.status(400).json({ error: 'text required' })

    const langNote = getLangInstruction(language, subjectName)
    const instructions = [
      'You are a text cleanup assistant.',
      'Fix OCR errors, typos, and formatting while preserving the original meaning and structure.',
      langNote,
    ].filter(Boolean).join(' ')

    const cleaned = await callText(
      instructions,
      `Clean up this raw OCR text, fix typos, and make it readable. Return only the cleaned text:\n\n${text}`
    )
    res.json({ text: cleaned, success: true })
  } catch (err) {
    console.error('Enhance OCR error:', err?.message ?? err)
    res.status(500).json({ error: 'Failed to enhance text', message: err?.message, success: false })
  }
})

// ---------------------------------------------------------------------------
// Enhance notes
// ---------------------------------------------------------------------------
router.post('/enhance-notes', async (req, res) => {
  try {
    const { content, mode, language, subjectName } = req.body
    if (!content || !mode) return res.status(400).json({ error: 'content and mode required' })

    const modeInstructions = {
      simplify:       'Simplify this text while keeping all important information. Make it easier to understand.',
      detailed:       'Expand on this text with more detail and explanation. Add helpful context.',
      'bullet-points':'Convert this text into a clear, structured bullet-point list. Use bullets for each key idea.',
      eli5:           'Explain this text as if teaching it to a 5-year-old. Use simple words and clear analogies.',
      'exam-prep':    'Format this as exam preparation notes. Highlight key terms, definitions, and important concepts.',
    }
    const modePrompt = modeInstructions[mode] || modeInstructions.simplify
    const langNote = getLangInstruction(language, subjectName)

    const instructions = [
      'You are a helpful study assistant. Enhance study notes.',
      modePrompt,
      langNote,
    ].filter(Boolean).join('\n')

    const enhanced = await callText(instructions, `Enhance these notes:\n\n${content}`)
    res.json({ enhanced, success: true })
  } catch (err) {
    console.error('Enhance notes error:', err?.message ?? err)
    res.status(500).json({ error: 'Failed to enhance notes', message: err?.message, success: false })
  }
})

// ---------------------------------------------------------------------------
// Generate quiz questions from notes
// ---------------------------------------------------------------------------
router.post('/generate-quiz', async (req, res) => {
  try {
    const { notes, count = 5, language, subjectName } = req.body
    if (!notes?.length) return res.status(400).json({ error: 'notes array required' })

    const notesText = Array.isArray(notes) ? notes.join('\n\n') : notes
    const n = Math.min(parseInt(count) || 5, 20)
    const langNote = getLangInstruction(language, subjectName)

    const instructions = [
      'You are a quiz generator. Generate quiz questions from study notes.',
      'Always return ONLY valid JSON — no markdown fences, no extra text.',
      langNote,
    ].filter(Boolean).join('\n')

    const userPrompt = `Generate ${n} quiz questions from the notes below as a JSON array.

STRICT RULES:
- "multiple-choice": include "options" array with exactly 4 answer choices (plain text, no A/B/C/D letters). "answer" must exactly match one option string.
- "true-false": NO "options" field at all. "answer" must be exactly "True" or "False".
- "short-answer": NO "options" field. "answer" is a brief text.
- Never mix types: if answer is True/False, type MUST be "true-false" with no options array.

JSON structure:
[{"type":"multiple-choice"|"true-false"|"short-answer","question":"...","options":[...] (mc only),"answer":"...","explanation":"..."}]

Notes:
${notesText}

Return ONLY the JSON array.`

    const raw = await callText(instructions, userPrompt, 4096)

    let questions = []
    try {
      const m = raw.match(/\[[\s\S]*\]/)
      questions = m ? JSON.parse(m[0]) : []
    } catch {
      console.warn('Quiz JSON parse failed, raw:', raw.slice(0, 200))
    }

    // Normalise: ensure true-false questions never have options
    questions = questions.map(q => {
      const ans = (q.answer || '').trim()
      if (ans === 'True' || ans === 'False' || q.type === 'true-false') {
        return { ...q, type: 'true-false', options: undefined }
      }
      return q
    })

    res.json({ questions, success: true })
  } catch (err) {
    console.error('Generate quiz error:', err?.message ?? err)
    res.status(500).json({ error: 'Failed to generate quiz', message: err?.message, success: false })
  }
})

// ---------------------------------------------------------------------------
// Generate flashcards from notes
// ---------------------------------------------------------------------------
router.post('/generate-flashcards', async (req, res) => {
  try {
    const { notes, count = 5, language, subjectName } = req.body
    if (!notes?.length) return res.status(400).json({ error: 'notes array required' })

    const notesText = Array.isArray(notes) ? notes.join('\n\n') : notes
    const n = Math.min(parseInt(count) || 5, 20)
    const langNote = getLangInstruction(language, subjectName)

    const instructions = [
      'You are a flashcard generator. Create study flashcards from notes.',
      'Always return ONLY valid JSON — no markdown fences, no extra text.',
      langNote,
    ].filter(Boolean).join('\n')

    const userPrompt = `Generate ${n} flashcard pairs from the notes below as a JSON array.

JSON structure: [{"front":"question or concept","back":"answer or definition"}]

Notes:
${notesText}

Return ONLY the JSON array.`

    const raw = await callText(instructions, userPrompt, 4096)

    let flashcards = []
    try {
      const m = raw.match(/\[[\s\S]*\]/)
      flashcards = m ? JSON.parse(m[0]) : []
    } catch {
      console.warn('Flashcard JSON parse failed, raw:', raw.slice(0, 200))
    }

    res.json({ flashcards, success: true })
  } catch (err) {
    console.error('Generate flashcards error:', err?.message ?? err)
    res.status(500).json({ error: 'Failed to generate flashcards', message: err?.message, success: false })
  }
})

export default router

import express from 'express'
import OpenAI from 'openai'

const router = express.Router()

const MODEL = 'gpt-4o-mini'
const VISION_MODEL = 'gpt-4o-mini'

// Lazy-load OpenAI client - don't instantiate until environment is ready
let openai = null

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openai
}

// Language names for prompts
const LANGUAGE_NAMES = {
  en: 'English',
  pl: 'Polish',
}

// Common foreign language keywords that indicate a language-learning subject
const FOREIGN_LANGUAGE_KEYWORDS = [
  // English
  'english', 'angielski', 'język angielski',
  // German
  'german', 'niemiecki', 'język niemiecki', 'deutsch',
  // French
  'french', 'francuski', 'język francuski', 'français',
  // Spanish
  'spanish', 'hiszpański', 'język hiszpański', 'español',
  // Italian
  'italian', 'włoski', 'język włoski', 'italiano',
  // Russian
  'russian', 'rosyjski', 'język rosyjski',
  // Japanese
  'japanese', 'japoński', 'język japoński',
  // Chinese
  'chinese', 'chiński', 'język chiński',
  // Korean
  'korean', 'koreański', 'język koreański',
  // Portuguese
  'portuguese', 'portugalski', 'język portugalski',
  // Latin
  'latin', 'łaciński', 'łacina',
]

/**
 * Determines the language instruction for AI prompts based on user language and subject.
 * If the subject is a foreign language, adapts the prompt for language learning context.
 */
function getLanguageInstruction(language, subjectName) {
  const langName = LANGUAGE_NAMES[language] || 'English'

  if (!subjectName) {
    if (language === 'en') return '' // Default behavior for English
    return `IMPORTANT: Respond entirely in ${langName}. All text, explanations, and content must be in ${langName}.`
  }

  const subjectLower = subjectName.toLowerCase().trim()
  const isForeignLanguageSubject = FOREIGN_LANGUAGE_KEYWORDS.some(kw => subjectLower.includes(kw))

  if (isForeignLanguageSubject) {
    if (language === 'en') {
      return `This is a foreign language learning subject ("${subjectName}"). Generate content appropriate for someone learning this language. Include the target language terms with English explanations where appropriate.`
    }
    return `This is a foreign language learning subject ("${subjectName}"). The student's native language is ${langName}. Generate content in ${langName} but include the target foreign language terms, vocabulary, and expressions that the student is learning. Explanations and instructions should be in ${langName}, while the learning material (vocabulary, example sentences) should be in the target language with ${langName} translations.`
  }

  if (language === 'en') return '' // Default behavior for English
  return `IMPORTANT: Respond entirely in ${langName}. All text, explanations, and content must be in ${langName}.`
}

// Validate API key is configured
router.use((req, res, next) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OpenAI API key not configured' })
  }
  next()
})

// OCR: Extract text from image using GPT-4o Vision
router.post('/ocr', async (req, res) => {
  try {
    const { imageData, language, subjectName } = req.body

    if (!imageData) {
      return res.status(400).json({ error: 'imageData required' })
    }

    // Ensure the image data is a proper data URL for OpenAI
    const imageUrl = imageData.startsWith('data:')
      ? imageData
      : `data:image/jpeg;base64,${imageData}`

    const langInstruction = getLanguageInstruction(language, subjectName)
    const langNote = langInstruction ? `\n\n${langInstruction}` : ''

    const response = await getOpenAIClient().chat.completions.create({
      model: VISION_MODEL,
      max_completion_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: `Please extract ALL text from this image of handwritten or printed notes. Preserve the original structure, headings, bullet points, and formatting as much as possible. If the handwriting is unclear, make your best interpretation. Return ONLY the extracted text, no explanations or commentary.${langNote}`
            }
          ]
        }
      ]
    })

    const text = response.choices[0]?.message?.content || ''

    res.json({
      text,
      success: true
    })
  } catch (error) {
    console.error('OCR error:', error.message || error)
    res.status(500).json({
      error: 'Failed to process image',
      success: false,
      message: error.message
    })
  }
})

// Enhance OCR text: Clean up raw OCR output
router.post('/enhance-ocr-text', async (req, res) => {
  try {
    const { text, language, subjectName } = req.body

    if (!text) {
      return res.status(400).json({ error: 'text required' })
    }

    const langInstruction = getLanguageInstruction(language, subjectName)
    const systemPrompt = `You are a text cleanup assistant. Fix OCR errors, typos, and formatting issues while preserving the original meaning and structure.${langInstruction ? ' ' + langInstruction : ''}`

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `This is raw OCR text that may have errors. Please clean it up, fix typos, and make it readable. Return only the cleaned text:\n\n${text}`
        }
      ]
    })

    const cleanedText = response.choices[0]?.message?.content || ''

    res.json({
      text: cleanedText,
      success: true
    })
  } catch (error) {
    console.error('Enhance OCR error:', error.message || error)
    res.status(500).json({
      error: 'Failed to enhance text',
      success: false,
      message: error.message
    })
  }
})

// Enhance notes: Apply various enhancement modes
router.post('/enhance-notes', async (req, res) => {
  try {
    const { content, mode, language, subjectName } = req.body

    if (!content || !mode) {
      return res.status(400).json({ error: 'content and mode required' })
    }

    const modePrompts = {
      simplify: 'Simplify this text while keeping all important information. Make it easier to understand.',
      detailed: 'Expand on this text with more detail and explanation. Add helpful context.',
      'bullet-points': 'Convert this text into a clear bullet-point list. Use bullets for each key idea.',
      eli5: 'Explain this text as if teaching it to a 5-year-old. Use simple words and clear explanations.',
      'exam-prep': 'Format this text as exam preparation notes. Include key terms, definitions, and important concepts.'
    }

    const prompt = modePrompts[mode] || modePrompts.simplify
    const langInstruction = getLanguageInstruction(language, subjectName)

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `You are a helpful study assistant. Your task is to enhance study notes. ${prompt}${langInstruction ? '\n\n' + langInstruction : ''}`
        },
        {
          role: 'user',
          content: `Please enhance the following notes:\n\n${content}`
        }
      ]
    })

    const enhanced = response.choices[0]?.message?.content || ''

    res.json({
      enhanced,
      success: true
    })
  } catch (error) {
    console.error('Enhance notes error:', error.message || error)
    res.status(500).json({
      error: 'Failed to enhance notes',
      success: false,
      message: error.message
    })
  }
})

// Generate quiz questions from notes
router.post('/generate-quiz', async (req, res) => {
  try {
    const { notes, count = 5, language, subjectName } = req.body

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'notes array required' })
    }

    const notesText = notes.join('\n\n')
    const numQuestions = Math.min(parseInt(count) || 5, 20)
    const langInstruction = getLanguageInstruction(language, subjectName)

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `You are a quiz generator. Generate quiz questions from study notes. Always return valid JSON arrays.${langInstruction ? '\n\n' + langInstruction : ''}`
        },
        {
          role: 'user',
          content: `Based on these study notes, generate ${numQuestions} quiz questions as a JSON array.

Rules:
- "multiple-choice": include "options" array with exactly 4 answer choices (full text, not letters). "answer" must exactly match one of the options.
- "true-false": NO "options" field. "answer" must be exactly "True" or "False".
- "short-answer": NO "options" field. "answer" is a short text.

Structure: [{"type": "multiple-choice"|"true-false"|"short-answer", "question": "...", "options": [...] (multiple-choice only), "answer": "...", "explanation": "..."}]

Study notes:
${notesText}

Return ONLY valid JSON, no markdown or extra text.`
        }
      ]
    })

    const responseText = response.choices[0]?.message?.content || '[]'

    // Parse the JSON response
    let questions = []
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      questions = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      console.warn('Failed to parse quiz questions JSON, returning empty array')
    }

    // Normalize: ensure true-false questions never have 4 options, and
    // questions whose answer is True/False are forced to true-false type
    const normalized = questions.map(q => {
      const ans = (q.answer || '').trim()
      const isTrueFalse = ans === 'True' || ans === 'False'
      if (isTrueFalse) {
        return { ...q, type: 'true-false', options: undefined }
      }
      if (q.type === 'true-false') {
        return { ...q, options: undefined }
      }
      return q
    })

    res.json({
      questions: normalized,
      success: true
    })
  } catch (error) {
    console.error('Generate quiz error:', error.message || error)
    res.status(500).json({
      error: 'Failed to generate quiz',
      success: false,
      message: error.message
    })
  }
})

// Generate flashcards from notes
router.post('/generate-flashcards', async (req, res) => {
  try {
    const { notes, count = 5, language, subjectName } = req.body

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'notes array required' })
    }

    const notesText = notes.join('\n\n')
    const numFlashcards = Math.min(parseInt(count) || 5, 20)
    const langInstruction = getLanguageInstruction(language, subjectName)

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      max_completion_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `You are a flashcard generator. Create study flashcards from notes. Always return valid JSON arrays.${langInstruction ? '\n\n' + langInstruction : ''}`
        },
        {
          role: 'user',
          content: `Based on these study notes, generate ${numFlashcards} flashcard pairs. Return them as a JSON array with this structure: [{"front": "question/concept", "back": "answer/definition"}, ...]

Study notes:
${notesText}

Return ONLY valid JSON, no markdown or extra text.`
        }
      ]
    })

    const responseText = response.choices[0]?.message?.content || '[]'

    // Parse the JSON response
    let flashcards = []
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      flashcards = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      console.warn('Failed to parse flashcards JSON, returning empty array')
    }

    res.json({
      flashcards,
      success: true
    })
  } catch (error) {
    console.error('Generate flashcards error:', error.message || error)
    res.status(500).json({
      error: 'Failed to generate flashcards',
      success: false,
      message: error.message
    })
  }
})

export default router

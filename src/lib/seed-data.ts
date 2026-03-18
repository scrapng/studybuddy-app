import type { Subject, StudySet, StudySession } from '@/types'

const yesterday = new Date(Date.now() - 86400000).toISOString()
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString()
const threeDaysAgo = new Date(Date.now() - 259200000).toISOString()
const oneWeekAgo = new Date(Date.now() - 604800000).toISOString()
const inTwoWeeks = new Date(Date.now() + 1209600000).toISOString()
const inOneWeek = new Date(Date.now() + 604800000).toISOString()
const inThreeDays = new Date(Date.now() + 259200000).toISOString()

export const SEED_SUBJECTS: Subject[] = [
  {
    id: 'subj-math',
    name: 'Mathematics',
    color: '#3b82f6',
    icon: 'Calculator',
    description: 'Algebra, calculus, and statistics fundamentals',
    createdAt: oneWeekAgo,
  },
  {
    id: 'subj-bio',
    name: 'Biology',
    color: '#22c55e',
    icon: 'Microscope',
    description: 'Cell biology, genetics, and ecology',
    createdAt: oneWeekAgo,
  },
  {
    id: 'subj-history',
    name: 'World History',
    color: '#f59e0b',
    icon: 'Landmark',
    description: 'Major civilizations and historical events',
    createdAt: threeDaysAgo,
  },
]

export const SEED_STUDY_SETS: StudySet[] = [
  {
    id: 'set-algebra',
    subjectId: 'subj-math',
    name: 'Algebra Basics',
    description: 'Fundamental algebraic concepts and equations',
    difficulty: 'easy',
    targetDate: inTwoWeeks,
    createdAt: oneWeekAgo,
    lastStudied: yesterday,
    flashcards: [
      { id: 'fc-1', front: 'What is a variable?', back: 'A symbol (usually a letter) that represents an unknown value in an equation.', difficulty: 'easy', mastery: 'mastered', correctCount: 5, reviewCount: 6, lastReviewed: yesterday, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-2', front: 'What is the quadratic formula?', back: 'x = (-b ± √(b² - 4ac)) / 2a', difficulty: 'medium', mastery: 'reviewing', correctCount: 3, reviewCount: 5, lastReviewed: yesterday, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-3', front: 'What does PEMDAS stand for?', back: 'Parentheses, Exponents, Multiplication, Division, Addition, Subtraction — the order of operations.', difficulty: 'easy', mastery: 'mastered', correctCount: 4, reviewCount: 4, lastReviewed: twoDaysAgo, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-4', front: 'Simplify: 3(x + 2) - 5', back: '3x + 6 - 5 = 3x + 1', difficulty: 'easy', mastery: 'reviewing', correctCount: 2, reviewCount: 3, lastReviewed: twoDaysAgo, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-5', front: 'What is the slope-intercept form?', back: 'y = mx + b, where m is the slope and b is the y-intercept.', difficulty: 'medium', mastery: 'learning', correctCount: 1, reviewCount: 3, lastReviewed: yesterday, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-6', front: 'Factor: x² - 9', back: '(x + 3)(x - 3) — this is a difference of squares.', difficulty: 'medium', mastery: 'new', correctCount: 0, reviewCount: 0, lastReviewed: null, nextReviewDate: null, createdAt: threeDaysAgo },
    ],
    notes: [
      { id: 'note-1', title: 'Key Algebra Rules', body: 'Remember:\n- Always combine like terms first\n- Distribute before solving\n- Check solutions by substituting back\n- When dividing by a negative, flip the inequality sign', tags: ['rules', 'important'], color: '#dbeafe', isPinned: true, imageUrl: null, sourceType: 'manual', createdAt: oneWeekAgo, updatedAt: yesterday },
      { id: 'note-2', title: 'Common Mistakes', body: '- Forgetting to distribute negative signs\n- Not flipping inequality when multiplying/dividing by negative\n- Confusing multiplication and exponent rules', tags: ['mistakes'], color: '#fef3c7', isPinned: false, imageUrl: null, sourceType: 'manual', createdAt: threeDaysAgo, updatedAt: threeDaysAgo },
    ],
    questions: [
      { id: 'q-1', type: 'multiple-choice', questionText: 'What is the solution to 2x + 5 = 15?', options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 4'], correctAnswer: 'x = 5', explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5', difficulty: 'easy', createdAt: oneWeekAgo },
      { id: 'q-2', type: 'true-false', questionText: 'The expression (a + b)² equals a² + b²', options: ['True', 'False'], correctAnswer: 'False', explanation: '(a + b)² = a² + 2ab + b², not a² + b². The middle term 2ab is often forgotten.', difficulty: 'medium', createdAt: oneWeekAgo },
      { id: 'q-3', type: 'short-answer', questionText: 'Solve for x: 3x - 7 = 14', options: [], correctAnswer: '7', explanation: 'Add 7 to both sides: 3x = 21, divide by 3: x = 7', difficulty: 'easy', createdAt: threeDaysAgo },
    ],
    goals: [
      { id: 'goal-1', description: 'Master all basic algebra flashcards', targetProficiency: 80, deadline: inTwoWeeks, status: 'in-progress', createdAt: oneWeekAgo },
    ],
  },
  {
    id: 'set-calculus',
    subjectId: 'subj-math',
    name: 'Introduction to Calculus',
    description: 'Limits, derivatives, and basic integration',
    difficulty: 'hard',
    targetDate: inOneWeek,
    createdAt: threeDaysAgo,
    lastStudied: null,
    flashcards: [
      { id: 'fc-7', front: 'What is a limit?', back: 'The value that a function approaches as the input approaches some value.', difficulty: 'medium', mastery: 'new', correctCount: 0, reviewCount: 0, lastReviewed: null, nextReviewDate: null, createdAt: threeDaysAgo },
      { id: 'fc-8', front: 'What is the derivative of x²?', back: '2x — using the power rule: d/dx(xⁿ) = nxⁿ⁻¹', difficulty: 'medium', mastery: 'new', correctCount: 0, reviewCount: 0, lastReviewed: null, nextReviewDate: null, createdAt: threeDaysAgo },
      { id: 'fc-9', front: 'What is the integral of 2x?', back: 'x² + C — the antiderivative, where C is a constant of integration.', difficulty: 'hard', mastery: 'new', correctCount: 0, reviewCount: 0, lastReviewed: null, nextReviewDate: null, createdAt: threeDaysAgo },
    ],
    notes: [],
    questions: [],
    goals: [
      { id: 'goal-2', description: 'Understand basic derivative rules', targetProficiency: 70, deadline: inOneWeek, status: 'not-started', createdAt: threeDaysAgo },
    ],
  },
  {
    id: 'set-cells',
    subjectId: 'subj-bio',
    name: 'Cell Biology',
    description: 'Cell structure, organelles, and cellular processes',
    difficulty: 'medium',
    targetDate: inThreeDays,
    createdAt: oneWeekAgo,
    lastStudied: twoDaysAgo,
    flashcards: [
      { id: 'fc-10', front: 'What is the powerhouse of the cell?', back: 'Mitochondria — responsible for producing ATP through cellular respiration.', difficulty: 'easy', mastery: 'mastered', correctCount: 6, reviewCount: 6, lastReviewed: twoDaysAgo, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-11', front: 'What is the function of ribosomes?', back: 'Protein synthesis — they translate mRNA into amino acid chains.', difficulty: 'medium', mastery: 'reviewing', correctCount: 3, reviewCount: 4, lastReviewed: twoDaysAgo, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-12', front: 'What is the cell membrane made of?', back: 'A phospholipid bilayer with embedded proteins — the fluid mosaic model.', difficulty: 'medium', mastery: 'learning', correctCount: 1, reviewCount: 3, lastReviewed: threeDaysAgo, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-13', front: 'What is osmosis?', back: 'The movement of water molecules across a semipermeable membrane from an area of low solute concentration to high solute concentration.', difficulty: 'medium', mastery: 'reviewing', correctCount: 2, reviewCount: 3, lastReviewed: twoDaysAgo, nextReviewDate: null, createdAt: oneWeekAgo },
      { id: 'fc-14', front: 'What is the difference between prokaryotic and eukaryotic cells?', back: 'Eukaryotic cells have a membrane-bound nucleus and organelles; prokaryotic cells do not.', difficulty: 'easy', mastery: 'mastered', correctCount: 4, reviewCount: 4, lastReviewed: twoDaysAgo, nextReviewDate: null, createdAt: oneWeekAgo },
    ],
    notes: [
      { id: 'note-3', title: 'Cell Organelles Summary', body: '- Nucleus: contains DNA, controls cell\n- Mitochondria: energy production (ATP)\n- ER: protein (rough) and lipid (smooth) synthesis\n- Golgi: packaging and transport\n- Lysosomes: digestion and waste removal\n- Chloroplasts: photosynthesis (plant cells only)', tags: ['organelles', 'summary'], color: '#dcfce7', isPinned: true, imageUrl: null, sourceType: 'manual', createdAt: oneWeekAgo, updatedAt: twoDaysAgo },
    ],
    questions: [
      { id: 'q-4', type: 'multiple-choice', questionText: 'Which organelle is responsible for protein synthesis?', options: ['Mitochondria', 'Ribosome', 'Golgi apparatus', 'Lysosome'], correctAnswer: 'Ribosome', explanation: 'Ribosomes are the sites of protein synthesis, translating mRNA into proteins.', difficulty: 'easy', createdAt: oneWeekAgo },
    ],
    goals: [],
  },
  {
    id: 'set-ancient',
    subjectId: 'subj-history',
    name: 'Ancient Civilizations',
    description: 'Mesopotamia, Egypt, Greece, and Rome',
    difficulty: 'medium',
    targetDate: inTwoWeeks,
    createdAt: threeDaysAgo,
    lastStudied: null,
    flashcards: [
      { id: 'fc-15', front: 'What was the first known civilization?', back: 'Sumer, in southern Mesopotamia (modern-day Iraq), around 4500 BCE.', difficulty: 'medium', mastery: 'new', correctCount: 0, reviewCount: 0, lastReviewed: null, nextReviewDate: null, createdAt: threeDaysAgo },
      { id: 'fc-16', front: 'What is the Rosetta Stone?', back: 'A stone with a decree written in three scripts (hieroglyphic, demotic, Greek) that allowed scholars to decipher Egyptian hieroglyphs.', difficulty: 'medium', mastery: 'new', correctCount: 0, reviewCount: 0, lastReviewed: null, nextReviewDate: null, createdAt: threeDaysAgo },
      { id: 'fc-17', front: 'Who was Alexander the Great?', back: 'King of Macedonia who created one of the largest empires in ancient history by age 30, spreading Greek culture across the known world.', difficulty: 'easy', mastery: 'new', correctCount: 0, reviewCount: 0, lastReviewed: null, nextReviewDate: null, createdAt: threeDaysAgo },
    ],
    notes: [],
    questions: [],
    goals: [],
  },
]

export const SEED_SESSIONS: StudySession[] = [
  {
    id: 'sess-1',
    setId: 'set-algebra',
    subjectId: 'subj-math',
    setName: 'Algebra Basics',
    subjectName: 'Mathematics',
    type: 'flashcards',
    startTime: new Date(Date.now() - 90000000).toISOString(),
    endTime: new Date(Date.now() - 88200000).toISOString(),
    cardsReviewed: 6,
    correctAnswers: 4,
    score: 67,
    duration: 1800,
  },
  {
    id: 'sess-2',
    setId: 'set-cells',
    subjectId: 'subj-bio',
    setName: 'Cell Biology',
    subjectName: 'Biology',
    type: 'flashcards',
    startTime: new Date(Date.now() - 180000000).toISOString(),
    endTime: new Date(Date.now() - 178800000).toISOString(),
    cardsReviewed: 5,
    correctAnswers: 4,
    score: 80,
    duration: 1200,
  },
  {
    id: 'sess-3',
    setId: 'set-algebra',
    subjectId: 'subj-math',
    setName: 'Algebra Basics',
    subjectName: 'Mathematics',
    type: 'flashcards',
    startTime: new Date(Date.now() - 260000000).toISOString(),
    endTime: new Date(Date.now() - 259100000).toISOString(),
    cardsReviewed: 4,
    correctAnswers: 3,
    score: 75,
    duration: 900,
  },
]

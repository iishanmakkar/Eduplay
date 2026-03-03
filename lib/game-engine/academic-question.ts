/**
 * lib/game-engine/academic-question.ts
 *
 * PHASE 1 — AcademicQuestion schema & runtime validator
 *
 * Every question generated or stored in EduPlay must conform to this schema.
 * This type is the single source of truth for question structure across:
 * - AI generators (ai-question-generator.ts)
 * - Content pools (lib/game-engine/content-pools/*)
 * - Admin Content Lab bulk generation
 * - IRT calibration system
 */

// ── Core Types ────────────────────────────────────────────────────────────────

export type GradeBand = 'KG2' | '35' | '68' | '912'
export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
export type DifficultyTier = 1 | 2 | 3 | 4 | 5
export type QuestionType = 'mcq' | 'numeric' | 'text' | 'sequence' | 'coordinate' | 'multi_select' | 'essay' | 'debate'

export interface AcademicQuestion {
    id: string
    gradeBand: GradeBand
    subject: string            // 'mathematics' | 'english' | 'science' | 'social_studies' | 'hindi' | 'computer_science' | 'gk'
    topic: string              // e.g. 'fractions', 'photosynthesis', 'mughal_empire'
    subtopic?: string          // e.g. 'adding_unlike_fractions'
    bloomsLevel: BloomsLevel
    difficultyTier: DifficultyTier
    questionType: QuestionType
    prompt: string
    options?: string[]          // MCQ only — exactly 4 options required
    correctAnswer: string
    distractors?: string[]      // The wrong options with their error type tags
    distractorRationale?: string[] // Why each distractor is wrong (for teacher view)
    explanation: string         // Full academic explanation
    skillTag: string            // e.g. 'fraction_addition_unlike_denominators'
    curriculumTag?: string[]    // e.g. ['CBSE_G6_M_CH7', 'ICSE_G6_M']
    // IRT parameters (calibrated over time)
    irtA?: number               // discrimination
    irtB?: number               // difficulty
    irtC?: number               // guessing
    // Metadata
    sourceType: 'ai_generated' | 'human_authored' | 'ai_human_reviewed'
    validated: boolean
    createdAt?: string
}

// ── Runtime Validator ─────────────────────────────────────────────────────────

export interface QuestionValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    score: number   // 0–100: academic quality score
}

export function validateAcademicQuestion(q: Partial<AcademicQuestion>): QuestionValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // ── Required field checks ──────────────────────────────────────────────────
    if (!q.id?.trim()) errors.push('Missing id')
    if (!q.gradeBand) errors.push('Missing gradeBand')
    if (!q.subject?.trim()) errors.push('Missing subject')
    if (!q.topic?.trim()) errors.push('Missing topic')
    if (!q.bloomsLevel) errors.push('Missing bloomsLevel')
    if (!q.difficultyTier || q.difficultyTier < 1 || q.difficultyTier > 5) errors.push('Invalid difficultyTier (must be 1–5)')
    if (!q.prompt?.trim() || q.prompt.length < 10) errors.push('Prompt too short or missing')
    if (!q.correctAnswer?.trim()) errors.push('Missing correctAnswer')
    if (!q.explanation?.trim() || q.explanation.length < 20) errors.push('Explanation too short or missing')
    if (!q.skillTag?.trim()) errors.push('Missing skillTag')

    // ── MCQ-specific checks ────────────────────────────────────────────────────
    if (q.questionType === 'mcq' || q.options) {
        if (!q.options || q.options.length !== 4) {
            errors.push('MCQ must have exactly 4 options')
        } else {
            // Check correctAnswer is in options
            const hasCorrect = q.options.some(o =>
                o.trim().toLowerCase() === q.correctAnswer!.trim().toLowerCase()
            )
            if (!hasCorrect) errors.push('correctAnswer must be verbatim in options array')

            // Check no duplicates
            const lower = q.options.map(o => o.trim().toLowerCase())
            const unique = new Set(lower)
            if (unique.size < q.options.length) errors.push('Duplicate options detected')

            // Check no invalid placeholders
            const badOptions = ['all of the above', 'none of the above', 'both a and b', 'both a & b']
            for (const opt of lower) {
                if (badOptions.includes(opt)) errors.push(`Invalid option: "${opt}" — use specific content instead`)
            }
        }
    }

    // ── Grammar / quality warnings ─────────────────────────────────────────────
    if (q.prompt && !q.prompt.match(/[?.]$/)) warnings.push('Prompt should end with ? or .')
    if (q.explanation && q.explanation.length < 50) warnings.push('Explanation seems too brief for academic quality')
    if (q.prompt && (/\btricky\b|\bfunny\b|\bsilly\b/i.test(q.prompt))) {
        warnings.push('Avoid informal language in academic prompts')
    }

    // ── Grade-band vocabulary check ────────────────────────────────────────────
    if (q.gradeBand === 'KG2') {
        const complexWords = ['derivative', 'integral', 'coefficient', 'polynomial', 'hypothesis']
        for (const word of complexWords) {
            if (q.prompt?.toLowerCase().includes(word)) {
                errors.push(`KG2 question contains advanced term: "${word}"`)
            }
        }
        if (q.bloomsLevel && !['remember', 'understand'].includes(q.bloomsLevel)) {
            errors.push(`KG2 questions should be at most Bloom's "understand" level`)
        }
    }

    if (q.gradeBand === '35') {
        const tooAdvanced = ['derivative', 'integral', 'logarithm', 'matrix', 'eigenvector']
        for (const word of tooAdvanced) {
            if (q.prompt?.toLowerCase().includes(word)) {
                errors.push(`Grade 3–5 question contains advanced term: "${word}"`)
            }
        }
    }

    // ── Bloom's vs Grade alignment ─────────────────────────────────────────────
    const bloomsForKG: BloomsLevel[] = ['remember', 'understand']
    const bloomsFor35: BloomsLevel[] = ['remember', 'understand', 'apply']
    if (q.gradeBand === 'KG2' && q.bloomsLevel && !bloomsForKG.includes(q.bloomsLevel)) {
        warnings.push(`KG2 Bloom's level "${q.bloomsLevel}" may be too advanced — prefer remember/understand`)
    }
    if (q.gradeBand === '35' && q.bloomsLevel && !bloomsFor35.includes(q.bloomsLevel)) {
        warnings.push(`Grade 3–5 Bloom's "${q.bloomsLevel}" may be too advanced — prefer apply or below`)
    }

    // ── Quality score ──────────────────────────────────────────────────────────
    let score = 100
    score -= errors.length * 15
    score -= warnings.length * 5
    score = Math.max(0, score)

    return { valid: errors.length === 0, errors, warnings, score }
}

// ── Grade Band Constraints ─────────────────────────────────────────────────────

export interface GradeBandConstraints {
    maxNumberRange: number
    maxSteps: number
    allowedBloomsLevels: BloomsLevel[]
    allowDecimals: boolean
    allowFractions: boolean
    allowAlgebra: boolean
    allowAbstractSymbols: boolean
    idealPromptLength: [number, number]  // [min, max] in words
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'academic'
}

export const GRADE_BAND_CONSTRAINTS: Record<GradeBand, GradeBandConstraints> = {
    KG2: {
        maxNumberRange: 20,
        maxSteps: 1,
        allowedBloomsLevels: ['remember', 'understand'],
        allowDecimals: false,
        allowFractions: false,
        allowAlgebra: false,
        allowAbstractSymbols: false,
        idealPromptLength: [5, 15],
        vocabularyLevel: 'basic',
    },
    '35': {
        maxNumberRange: 10000,
        maxSteps: 2,
        allowedBloomsLevels: ['remember', 'understand', 'apply'],
        allowDecimals: true,
        allowFractions: true,
        allowAlgebra: false,
        allowAbstractSymbols: false,
        idealPromptLength: [8, 25],
        vocabularyLevel: 'intermediate',
    },
    '68': {
        maxNumberRange: 1000000,
        maxSteps: 4,
        allowedBloomsLevels: ['remember', 'understand', 'apply', 'analyze'],
        allowDecimals: true,
        allowFractions: true,
        allowAlgebra: true,
        allowAbstractSymbols: true,
        idealPromptLength: [10, 40],
        vocabularyLevel: 'advanced',
    },
    '912': {
        maxNumberRange: Infinity,
        maxSteps: 8,
        allowedBloomsLevels: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
        allowDecimals: true,
        allowFractions: true,
        allowAlgebra: true,
        allowAbstractSymbols: true,
        idealPromptLength: [15, 60],
        vocabularyLevel: 'academic',
    },
}

// ── Bloom's Level Descriptions (for AI prompts) ────────────────────────────────

export const BLOOMS_PROMPT_DESCRIPTORS: Record<BloomsLevel, string> = {
    remember: 'Recall a fact, definition, or formula directly',
    understand: 'Explain or describe a concept in own words or identify an example',
    apply: 'Use a procedure or formula to solve a specific problem',
    analyze: 'Break down a problem, identify patterns, compare or classify',
    evaluate: 'Justify a choice, critique a solution, or assess validity of a claim',
    create: 'Design a new solution, compose an explanation, or generate an example',
}

// ── Subject Tags ───────────────────────────────────────────────────────────────

export const SUBJECT_TOPICS: Record<string, string[]> = {
    mathematics: [
        'number_sense', 'addition_subtraction', 'multiplication_division',
        'fractions', 'decimals', 'percentages', 'ratios_proportions',
        'integers', 'algebra_expressions', 'linear_equations', 'quadratic_equations',
        'geometry_2d', 'geometry_3d', 'mensuration', 'trigonometry',
        'statistics', 'probability', 'coordinate_geometry', 'calculus_differentiation',
        'calculus_integration', 'matrices_determinants', 'vectors', 'complex_numbers',
        'number_theory', 'combinatorics', 'sets_relations',
    ],
    science: [
        'living_non_living', 'plants_photosynthesis', 'animals_classification',
        'human_body_systems', 'food_nutrition', 'cell_structure', 'dna_genetics',
        'evolution', 'ecosystem_food_chain', 'matter_states', 'atoms_molecules',
        'periodic_table', 'chemical_reactions', 'acids_bases', 'force_motion',
        'work_energy_power', 'waves_sound_light', 'electricity_magnetism',
        'modern_physics', 'optics', 'thermodynamics',
    ],
    english: [
        'phonics', 'sight_words', 'vocabulary', 'synonyms_antonyms',
        'parts_of_speech', 'tenses', 'sentence_structure', 'punctuation',
        'comprehension', 'idioms_phrases', 'figures_of_speech', 'essay_writing',
        'grammar_advanced', 'literary_devices', 'shakespeare',
    ],
    hindi: [
        'varnamala', 'matra', 'shabdkosh', 'vilom_shabd', 'paryayvachi',
        'vakya_rachna', 'vyakaran', 'sandhi', 'samas', 'muhavare_lokoktiyan',
        'anuched_lekhan', 'patra_lekhan', 'dohe', 'kabir', 'rahim',
    ],
    social_studies: [
        'ancient_civilizations', 'medieval_history', 'modern_history',
        'indian_freedom_struggle', 'world_wars', 'geography_physical',
        'geography_political', 'map_skills', 'democracy_government',
        'economics_basics', 'trade_commerce', 'culture_society',
    ],
    computer_science: [
        'number_systems_binary', 'logic_gates_boolean', 'algorithms',
        'data_structures', 'sorting_searching', 'recursion', 'complexity',
        'networking_basics', 'cybersecurity', 'ai_ml_basics', 'web_technologies',
    ],
    gk: [
        'world_capitals', 'national_symbols', 'sports_records', 'famous_scientists',
        'inventions_discoveries', 'current_events', 'books_authors', 'awards',
    ],
}

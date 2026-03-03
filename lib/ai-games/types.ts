/**
 * lib/ai-games/types.ts
 *
 * Shared types for all AI-powered games.
 */

export interface AIGameQuestion {
    id: string
    aiGenerated: true           // Always tagged — never false
    gameType: string
    prompt: string
    generationSeed: string      // Deterministic: hash of (model + prompt params)
    modelUsed: string           // e.g. "gemini-2.0-flash"
    validationPassed: boolean
    validatedAt?: Date
    subjectTag: string
    skillTag: string
    gradeBand: string
    difficulty: number          // 1-5
    answerOptions?: string[]    // Present for MCQ-type AI questions
    correctAnswer?: string      // Present for deterministic AI questions
    rubric?: AIRubric           // Present for essay/debate evaluation
    explanation?: string
    // Phase 2: AI Output Perfection
    confidenceScore?: number    // 0-100: AI certainty about answer validity
    // Phase 6: Cognitive Profile
    bloomsLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
    cognitiveLoad?: 'low' | 'medium' | 'high'
    estimatedSeconds?: number   // Estimated time to solve
}

export interface AIRubric {
    criteria: RubricCriterion[]
    maxScore: number
}

export interface RubricCriterion {
    name: string
    description: string
    maxPoints: number
    levels: {
        score: number
        descriptor: string
    }[]
}

export interface AIValidationResult {
    passed: boolean
    errors: string[]
    warnings: string[]
    score: number               // 0-100 quality score
    confidenceScore: number     // 0-100 AI answer certainty (Phase 2)
}

export interface AIEssayEvalResult {
    totalScore: number
    maxScore: number
    grade: string
    criteriaScores: { criterion: string; score: number; feedback: string }[]
    overallFeedback: string
    suggestions: string[]
    strengths: string[]
}

export interface AIDebateEvalResult {
    argumentQuality: number     // 0-100
    evidenceStrength: number    // 0-100
    logicalCoherence: number    // 0-100
    counterargumentHandling: number // 0-100
    overallScore: number
    feedback: string
    suggestedCounterpoints: string[]
}

export interface AIWeaknessProfile {
    userId: string
    skillGaps: {
        skill: string
        subject: string
        masteryLevel: number    // 0.0 - 1.0 (BKT-style)
        questionsAttempted: number
        correctRate: number
        priority: 'critical' | 'review' | 'strong'
    }[]
    recommendedTopics: string[]
    lastUpdated: Date
}

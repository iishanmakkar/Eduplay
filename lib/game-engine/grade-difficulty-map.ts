/**
 * Cognitive Development Blueprint — Grade-Based Scaling
 * lib/game-engine/grade-difficulty-map.ts
 *
 * Implements Phase 1 & 2 of the Cognitive Blueprint.
 * Defines 5 strict developmental bands mapping to working memory, reading level,
 * time pressure tolerance, and abstraction levels.
 */

import { GradeBand } from '@prisma/client'

export interface CognitiveProfile {
    workingMemoryCapacity: number // max items they can hold
    maxSteps: number              // max reasoning steps
    timeToleranceMs: number      // time in ms they need to comfortably process
    distractorProfile: 'near' | 'plausible' | 'semanticTrap'
}

export interface GradeDifficultyConfig {
    gradeBand: GradeBand
    label: string
    ageRange: [number, number]
    cognitiveProfile: CognitiveProfile

    // Core Game Params
    numberRange: [number, number]
    allowNegatives: boolean
    allowDecimals: boolean
    allowFractions: boolean
    operators: Array<'+' | '-' | '×' | '÷'>

    // Memory/Pattern Games
    patternLength: number
    gridSize: [number, number]

    // General
    timeLimit: number            // base seconds per question
    xpMultiplier: number
}

export const GRADE_DIFFICULTY_MAP: Record<GradeBand, GradeDifficultyConfig> = {
    [GradeBand.BAND_1]: {
        gradeBand: GradeBand.BAND_1,
        label: 'Grades K–2 (Ages 5-7)',
        ageRange: [5, 7],
        cognitiveProfile: {
            workingMemoryCapacity: 4,
            maxSteps: 1,
            timeToleranceMs: 4000,
            distractorProfile: 'near'
        },
        numberRange: [1, 20],
        allowNegatives: false,
        allowDecimals: false,
        allowFractions: false,
        operators: ['+', '-'],
        patternLength: 3,
        gridSize: [3, 3],
        timeLimit: 30, // 30s max
        xpMultiplier: 1.0
    },
    [GradeBand.BAND_2]: {
        gradeBand: GradeBand.BAND_2,
        label: 'Grades 3–5 (Ages 8-10)',
        ageRange: [8, 10],
        cognitiveProfile: {
            workingMemoryCapacity: 5,
            maxSteps: 2,
            timeToleranceMs: 2500,
            distractorProfile: 'plausible'
        },
        numberRange: [1, 100],
        allowNegatives: false,
        allowDecimals: false,
        allowFractions: true,
        operators: ['+', '-', '×', '÷'],
        patternLength: 5,
        gridSize: [4, 4],
        timeLimit: 20, // 20s max
        xpMultiplier: 1.2
    },
    [GradeBand.BAND_3]: {
        gradeBand: GradeBand.BAND_3,
        label: 'Grades 6–8 (Ages 11-13)',
        ageRange: [11, 13],
        cognitiveProfile: {
            workingMemoryCapacity: 7,
            maxSteps: 3,
            timeToleranceMs: 1500,
            distractorProfile: 'plausible'
        },
        numberRange: [-999, 999],
        allowNegatives: true,
        allowDecimals: true,
        allowFractions: true,
        operators: ['+', '-', '×', '÷'],
        patternLength: 7,
        gridSize: [5, 5],
        timeLimit: 15,
        xpMultiplier: 1.5
    },
    [GradeBand.BAND_4]: {
        gradeBand: GradeBand.BAND_4,
        label: 'Grades 9–10 (Ages 14-16)',
        ageRange: [14, 16],
        cognitiveProfile: {
            workingMemoryCapacity: 8,
            maxSteps: 4,
            timeToleranceMs: 1000,
            distractorProfile: 'semanticTrap'
        },
        numberRange: [-4999, 4999],
        allowNegatives: true,
        allowDecimals: true,
        allowFractions: true,
        operators: ['+', '-', '×', '÷'],
        patternLength: 8,
        gridSize: [6, 6],
        timeLimit: 10,
        xpMultiplier: 1.8
    },
    [GradeBand.BAND_5]: {
        gradeBand: GradeBand.BAND_5,
        label: 'Grades 11–12 (Ages 16-18)',
        ageRange: [16, 18],
        cognitiveProfile: {
            workingMemoryCapacity: 9,
            maxSteps: 5,
            timeToleranceMs: 800,
            distractorProfile: 'semanticTrap'
        },
        numberRange: [-9999, 9999],
        allowNegatives: true,
        allowDecimals: true,
        allowFractions: true,
        operators: ['+', '-', '×', '÷'],
        patternLength: 10,
        gridSize: [8, 8],
        timeLimit: 6, // extreme pressure
        xpMultiplier: 2.0
    }
}

/**
 * Maps a student's grade string (e.g. "K", "1", "12") to a specific GradeBand enum.
 */
export function gradeToGradeBand(grade: string | number): GradeBand {
    const g = typeof grade === 'string' ? grade.toLowerCase() : grade
    if (g === 'k' || g === 'kg') return GradeBand.BAND_1

    const gradeNum = parseInt(g as string, 10)
    if (isNaN(gradeNum) || gradeNum <= 2) return GradeBand.BAND_1
    if (gradeNum <= 5) return GradeBand.BAND_2
    if (gradeNum <= 8) return GradeBand.BAND_3
    if (gradeNum <= 10) return GradeBand.BAND_4
    return GradeBand.BAND_5
}

/**
 * Convenience getter for the full configuration.
 */
export function getGradeDifficultyConfig(grade: string | number | GradeBand): GradeDifficultyConfig {
    if (grade in GradeBand) {
        return GRADE_DIFFICULTY_MAP[grade as GradeBand]
    }
    return GRADE_DIFFICULTY_MAP[gradeToGradeBand(grade as string)]
}

/**
 * Distractor generator guided by the Cognitive Profile's distractorProfile.
 */
export function generateGradedDistractors(
    correctAnswer: number,
    profileType: 'near' | 'plausible' | 'semanticTrap',
    count: number = 3
): number[] {
    const distractors = new Set<number>()
    let attempts = 0

    // Trap generation bounds
    const ranges = {
        near: [1, 2],           // K-2: Visual simple diffs
        plausible: [3, 10],     // 3-8: Moderate math errors
        semanticTrap: [2, 25]   // 9-12: Sign errors, order of operation errors (simulated via larger bounds)
    }

    const [minOffset, maxOffset] = ranges[profileType]

    while (distractors.size < count && attempts < 200) {
        attempts++
        const offset = Math.floor(Math.random() * (maxOffset - minOffset + 1)) + minOffset

        // Semantic traps (Band 4/5) often invert the sign intentionally
        let sign = Math.random() > 0.5 ? 1 : -1
        if (profileType === 'semanticTrap' && attempts % 3 === 0) {
            sign = -1 // force inverse to create a trap if they messed up a subtraction
        }

        let candidate = correctAnswer + sign * offset

        // Another common trap: forgetting to multiply by the coefficient (simulated)
        if (profileType === 'semanticTrap' && attempts % 5 === 0 && correctAnswer > 10) {
            candidate = correctAnswer * 2
        }

        if (candidate !== correctAnswer && isFinite(candidate) && !isNaN(candidate)) {
            distractors.add(candidate)
        }
    }

    // Safety fill
    let fill = 1
    while (distractors.size < count) {
        let candidate = correctAnswer + fill
        if (fill % 2 === 0) candidate = correctAnswer - fill

        if (!distractors.has(candidate) && candidate !== correctAnswer) {
            distractors.add(candidate)
        }
        fill++
    }

    return Array.from(distractors)
}

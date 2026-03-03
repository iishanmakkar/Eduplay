/**
 * lib/ai-games/weakness-trainer.ts
 *
 * BKT-based weakness detection and targeted question recommendation.
 * Identifies student skill gaps from game history and recommends
 * the most impactful topics to practice next.
 */

import type { AIWeaknessProfile } from './types'

// BKT parameters (industry standard defaults)
const BKT = {
    pLearn: 0.35,    // P(learn) per correct answer  
    pSlip: 0.10,     // P(slip) — know but answer wrong
    pGuess: 0.25,    // P(guess) — don't know but answer right
    pInit: 0.20,     // P(initial mastery)
}

/**
 * Update BKT mastery estimate after one answer.
 * Returns new P(mastery) in [0, 1].
 */
export function updateBKT(pMastery: number, correct: boolean): number {
    // P(correct | mastery) = 1 - pSlip
    // P(correct | no mastery) = pGuess
    const pCorrect = pMastery * (1 - BKT.pSlip) + (1 - pMastery) * BKT.pGuess

    // Bayes update
    const pMasteryGivenObs = correct
        ? (pMastery * (1 - BKT.pSlip)) / pCorrect
        : (pMastery * BKT.pSlip) / (1 - pCorrect)

    // Learning update
    const updated = pMasteryGivenObs + (1 - pMasteryGivenObs) * BKT.pLearn

    // Bounds clamp
    return Math.max(0.001, Math.min(0.999, updated))
}

/**
 * Classify a mastery level into a priority.
 */
export function classifyPriority(mastery: number): 'critical' | 'review' | 'strong' {
    if (mastery < 0.40) return 'critical'
    if (mastery < 0.75) return 'review'
    return 'strong'
}

/**
 * Build a weakness profile from a student's game history.
 *
 * @param userId  - Student ID
 * @param history - Array of {skill, subject, correct} records
 */
export function buildWeaknessProfile(
    userId: string,
    history: { skill: string; subject: string; correct: boolean }[]
): AIWeaknessProfile {
    // Group by skill
    const skillMap = new Map<string, {
        subject: string
        mastery: number
        attempts: number
        correct: number
    }>()

    for (const record of history) {
        const existing = skillMap.get(record.skill) ?? {
            subject: record.subject,
            mastery: BKT.pInit,
            attempts: 0,
            correct: 0,
        }
        existing.mastery = updateBKT(existing.mastery, record.correct)
        existing.attempts++
        if (record.correct) existing.correct++
        skillMap.set(record.skill, existing)
    }

    const skillGaps = Array.from(skillMap.entries()).map(([skill, data]) => ({
        skill,
        subject: data.subject,
        masteryLevel: data.mastery,
        questionsAttempted: data.attempts,
        correctRate: data.attempts > 0 ? data.correct / data.attempts : 0,
        priority: classifyPriority(data.mastery),
    }))

    // Sort: critical first, then review, then strong (within each, lowest mastery first)
    skillGaps.sort((a, b) => {
        const priorityOrder = { critical: 0, review: 1, strong: 2 }
        const pd = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (pd !== 0) return pd
        return a.masteryLevel - b.masteryLevel
    })

    // Recommend top 5 topics to practice
    const recommendedTopics = skillGaps
        .filter(g => g.priority !== 'strong')
        .slice(0, 5)
        .map(g => g.skill)

    return {
        userId,
        skillGaps,
        recommendedTopics,
        lastUpdated: new Date(),
    }
}

/**
 * Get the single most impactful skill to practice next.
 * Uses "expected learning gain" = P(learn) * (1 - currentMastery)
 */
export function getHighestImpactSkill(profile: AIWeaknessProfile): string | null {
    let maxGain = -Infinity
    let best: string | null = null

    for (const gap of profile.skillGaps) {
        if (gap.priority === 'strong') continue
        const expectedGain = BKT.pLearn * (1 - gap.masteryLevel)
        if (expectedGain > maxGain) {
            maxGain = expectedGain
            best = gap.skill
        }
    }
    return best
}

import { prisma } from '@/lib/prisma'

/** Safe probability bounds — prevent division-by-zero and float precision collapse */
export const BKT_BOUNDS = {
    MIN: 0.01,  // Never let P(L) reach 0 — denominator in incorrect posterior becomes (1-P(L))
    MAX: 0.99,  // Never let P(L) reach 1 — denominator in correct posterior includes (1-P(L))*P(G)
} as const

/** Forgetting decay rate λ — half-life ≈ 69 days (ln(2) / 0.01) */
const DECAY_LAMBDA = 0.01

/** Clamp a probability to [MIN, MAX] safe operational range */
export function clampProbability(value: number): number {
    return Math.min(Math.max(value, BKT_BOUNDS.MIN), BKT_BOUNDS.MAX)
}

/**
 * Ebbinghaus forgetting curve decay.
 * P(L)_decayed = P(L) * e^(-λ * daysInactive)
 * Applied when student hasn't practiced a skill for > 0 days.
 */
export function applyForgettingCurve(pL: number, daysInactive: number): number {
    if (daysInactive <= 0) return pL
    const decayed = pL * Math.exp(-DECAY_LAMBDA * daysInactive)
    return clampProbability(decayed)
}

export interface BKTParams {
    masteryProbability: number // P(L)
    slipProbability: number    // P(S)
    guessProbability: number   // P(G)
    transitProbability: number // P(T)
}

export class BayesianKnowledgeTracing {
    /**
     * Update a student's mastery probability based on a new observation (correct/incorrect).
     * Applies forgetting curve before the update if the student has been inactive.
     */
    static async updateMastery(userId: string, skillCode: string, isCorrect: boolean) {
        const skill = await prisma.skillNode.findUnique({
            where: { code: skillCode }
        })

        if (!skill) return null

        // Get or create mastery record
        let mastery = await prisma.userSkillMastery.findUnique({
            where: {
                userId_skillId: {
                    userId,
                    skillId: skill.id
                }
            }
        })

        if (!mastery) {
            mastery = await prisma.userSkillMastery.create({
                data: {
                    userId,
                    skillId: skill.id,
                    masteryProbability: clampProbability(0.1),
                    slipProbability: 0.1,
                    guessProbability: 0.2,
                    transitProbability: 0.1
                }
            })
        }

        const { slipProbability: pS, guessProbability: pG, transitProbability: pT } = mastery

        // Apply forgetting curve before the BKT update
        const daysInactive = Math.floor(
            (Date.now() - mastery.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        const pL = applyForgettingCurve(mastery.masteryProbability, daysInactive)

        // BKT posterior: calculate probability that student knew the skill prior to answer
        let pL_given_obs = 0

        if (isCorrect) {
            // P(L | Correct) = [P(L) * (1 - P(S))] / [P(L) * (1 - P(S)) + (1 - P(L)) * P(G)]
            const num = pL * (1 - pS)
            const den = num + ((1 - pL) * pG)
            pL_given_obs = den === 0 ? BKT_BOUNDS.MIN : num / den
        } else {
            // P(L | Incorrect) = [P(L) * P(S)] / [P(L) * P(S) + (1 - P(L)) * (1 - P(G))]
            const num = pL * pS
            const den = num + ((1 - pL) * (1 - pG))
            pL_given_obs = den === 0 ? BKT_BOUNDS.MIN : num / den
        }

        // New P(L) after incorporating transit probability
        // P(L_new) = P(L | Obs) + (1 - P(L | Obs)) * P(T)
        const newPL = pL_given_obs + ((1 - pL_given_obs) * pT)

        // Hard clamp — guarantees safe denominator in all future iterations
        const finalPL = clampProbability(newPL)

        // Persist update
        const updatedMastery = await prisma.userSkillMastery.update({
            where: { id: mastery.id },
            data: {
                masteryProbability: finalPL,
                totalAttempts: { increment: 1 },
                consecutiveCorrect: isCorrect ? { increment: 1 } : 0,
                lastPracticedAt: new Date()
            }
        })

        return updatedMastery
    }

    /**
     * Has the user mastered this skill?
     * Using a high threshold (e.g., 0.95 or 95% probability)
     */
    static isMastered(masteryProbability: number, threshold = 0.90): boolean {
        return masteryProbability >= threshold
    }

    /**
     * Mastery Ceiling Expansion — Phase 4 AI Stability
     *
     * Checks whether a student has mastered ALL skills in their current tier.
     * If so, returns the skill codes of the NEXT tier that should now be unlocked.
     *
     * Tier structure is derived from the SkillNode.tier field (e.g., "GRADE_3", "GRADE_4").
     * Only considers skills the student has a mastery record for.
     *
     * Returns: { unlocked: string[], currentTierComplete: boolean }
     */
    static async checkTierExpansion(
        userId: string,
        completedSkillCode: string,
        masteryThreshold = 0.90
    ): Promise<{ unlocked: string[]; currentTierComplete: boolean }> {
        // Get the just-completed skill's grade (used as tier proxy)
        const skill = await prisma.skillNode.findUnique({
            where: { code: completedSkillCode },
            select: { grade: true, subject: true }
        })

        if (!skill?.grade) return { unlocked: [], currentTierComplete: false }

        // Find all skills in this grade + subject
        const tierSkills = await prisma.skillNode.findMany({
            where: { grade: skill.grade, subject: skill.subject },
            select: { id: true, code: true }
        })

        if (tierSkills.length === 0) return { unlocked: [], currentTierComplete: false }

        // Get mastery records for all tier skills for this student
        const masteryRecords = await prisma.userSkillMastery.findMany({
            where: {
                userId,
                skillId: { in: tierSkills.map(s => s.id) }
            },
            select: { skillId: true, masteryProbability: true }
        })

        const masteryMap = new Map(masteryRecords.map(m => [m.skillId, m.masteryProbability]))

        // Check if ALL tier skills are mastered
        const allMastered = tierSkills.every(
            s => (masteryMap.get(s.id) ?? 0) >= masteryThreshold
        )

        if (!allMastered) return { unlocked: [], currentTierComplete: false }

        // Find next-grade skills that require current-grade skills as prerequisites
        const nextGradeSkills = await prisma.skillNode.findMany({
            where: {
                subject: skill.subject,
                prerequisites: {
                    some: { code: { in: tierSkills.map(s => s.code) } }
                }
            },
            select: { code: true, grade: true }
        })

        // Filter to skills in a DIFFERENT (higher) grade
        const nextGradeCodes = nextGradeSkills
            .filter(s => s.grade !== skill.grade)
            .map(s => s.code)

        return { unlocked: nextGradeCodes, currentTierComplete: true }
    }

    /**
     * Get the student's weakest skills based on mastery probability.
     */
    static async getWeakestNodes(userId: string, limit: number = 3) {
        return await prisma.userSkillMastery.findMany({
            where: { userId },
            orderBy: { masteryProbability: 'asc' },
            take: limit,
            select: { skillId: true, masteryProbability: true }
        })
    }
}

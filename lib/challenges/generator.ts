import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'

export interface ChallengeDef {
    title: string
    description: string
    gameType: GameType // Use the actual enum
    targetScore: number
    xpReward: number
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

// Extensive list of templates to rotate through
const CHALLENGE_TEMPLATES: ChallengeDef[] = [
    // MATH
    {
        title: 'Math Master',
        description: 'Score over 1500 points in Speed Math.',
        gameType: 'SPEED_MATH',
        targetScore: 1500,
        xpReward: 500,
        difficulty: 'MEDIUM'
    },
    {
        title: 'Math Whiz',
        description: 'Prove your skills! Score 2500+ in Speed Math.',
        gameType: 'SPEED_MATH',
        targetScore: 2500,
        xpReward: 800,
        difficulty: 'HARD'
    },

    // SCIENCE
    {
        title: 'Science Savant',
        description: 'Answer correctly to score 1000 points in Science Quiz.',
        gameType: 'SCIENCE_QUIZ',
        targetScore: 1000,
        xpReward: 500,
        difficulty: 'MEDIUM'
    },
    {
        title: 'Lab Legend',
        description: 'Master the Science Quiz with 2000 points.',
        gameType: 'SCIENCE_QUIZ',
        targetScore: 2000,
        xpReward: 750,
        difficulty: 'HARD'
    },

    // GEOGRAPHY
    {
        title: 'Flag Expert',
        description: 'Identify flags correctly to score 1200 points.',
        gameType: 'WORLD_FLAGS',
        targetScore: 1200,
        xpReward: 550,
        difficulty: 'MEDIUM'
    },
    {
        title: 'Global Guru',
        description: 'Travel the world! Score 2200 points in World Flags.',
        gameType: 'WORLD_FLAGS',
        targetScore: 2200,
        xpReward: 850,
        difficulty: 'HARD'
    },

    // WORD
    {
        title: 'Word Wizard',
        description: 'Unscramble words to score 800 points.',
        gameType: 'WORD_SCRAMBLE',
        targetScore: 800,
        xpReward: 500,
        difficulty: 'MEDIUM'
    },

    // LOGIC & PATTERNS
    {
        title: 'Pattern Pro',
        description: 'Complete sequences to score 1000 points.',
        gameType: 'PATTERN_SEQUENCE',
        targetScore: 1000,
        xpReward: 600,
        difficulty: 'MEDIUM'
    },
    {
        title: 'Logic Legend',
        description: 'Solve the grid! Score 1000 points in Logic Grid.',
        gameType: 'LOGIC_GRID',
        targetScore: 1000,
        xpReward: 600,
        difficulty: 'MEDIUM'
    },
    {
        title: 'Code Breaker',
        description: 'Crack the code and score 1500 points.',
        gameType: 'CODE_BREAKER',
        targetScore: 1500,
        xpReward: 700,
        difficulty: 'HARD'
    },

    // MEMORY
    {
        title: 'Memory Master',
        description: 'Match cards quickly to score 1200 points.',
        gameType: 'MEMORY_MATCH',
        targetScore: 1200,
        xpReward: 500,
        difficulty: 'MEDIUM'
    },

    // TYPING (If mapped to Typing Speed)
    // Note: Schema has SPELLING_BEE, maybe use that or create TYPING_SPEED?
    // Using SPELLING_BEE as placeholder for language arts
    {
        title: 'Spelling Star',
        description: 'Spell correctly to score 1000 points.',
        gameType: 'SPELLING_BEE',
        targetScore: 1000,
        xpReward: 500,
        difficulty: 'MEDIUM'
    }
]

/**
 * Get or create the daily challenge for a specific date
 */
export async function getDailyChallenge(utcMidnightDate: Date) {
    // Ensure strict UTC to prevent Vercel edge container timezone mismatches
    const startOfDay = new Date(utcMidnightDate)
    startOfDay.setUTCHours(0, 0, 0, 0)

    // Try to find existing challenge
    const existing = await prisma.dailyChallenge.findUnique({
        where: {
            date: startOfDay
        }
    })

    if (existing) {
        return existing
    }

    // Generate a deterministic challenge based on the date string YYYYMMDD
    // This avoids integer overflow or weird modulo artifacts
    const dateStr = startOfDay.toISOString().split('T')[0].replace(/-/g, '') // "20231027"
    const seed = parseInt(dateStr)

    // Add a salt to rotate differently if needed, or just use seed
    // We want a stable pseudo-random choice
    const index = seed % CHALLENGE_TEMPLATES.length
    const template = CHALLENGE_TEMPLATES[index]

    // Create it
    return await prisma.dailyChallenge.create({
        data: {
            date: startOfDay,
            // title: template.title, // Schema might need title field added if we want it stored
            // Concatenate title to description as workaround for now as per previous code
            description: `${template.title}: ${template.description}`,
            gameType: template.gameType,
            bonusXP: template.xpReward,
            difficulty: template.difficulty
        }
    })
}

/**
 * Check if a user has completed a challenge
 */
export async function checkChallengeCompletion(userId: string, challengeId: string) {
    const completion = await prisma.challengeCompletion.findUnique({
        where: {
            userId_challengeId: {
                userId,
                challengeId
            }
        }
    })

    return !!completion
}

/**
 * Complete a challenge for a user
 */
export async function completeChallenge(userId: string, challengeId: string, score: number) {
    // Verify challenge exists and hasn't been completed
    const isCompleted = await checkChallengeCompletion(userId, challengeId)
    if (isCompleted) return null

    const challenge = await prisma.dailyChallenge.findUnique({
        where: { id: challengeId }
    })

    if (!challenge) throw new Error('Challenge not found')

    // Optional: Verify score meets target?
    // The previous implementation didn't store targetScore in DB, only in template.
    // If we want to verify, we'd need to store targetScore or look it up.
    // Use trust model for now (client says they won), or add targetScore to schema later.

    // Create completion
    const completion = await prisma.challengeCompletion.create({
        data: {
            userId,
            challengeId,
            score,
            earnedXP: challenge.bonusXP
        }
    })

    // Award XP to user
    await prisma.user.update({
        where: { id: userId },
        data: {
            xp: { increment: challenge.bonusXP }
        }
    })

    return completion
}

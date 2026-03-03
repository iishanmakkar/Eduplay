import { getDailyChallenge } from './generator'
import { BayesianKnowledgeTracing } from '@/lib/gamification/bkt-engine'
import { GameType } from '@prisma/client'

// Rough heuristic map from BKT skill code prefix to GameType
const SKILL_TO_GAME_MAP: Record<string, GameType> = {
    'MATH': 'SPEED_MATH',
    'READING': 'WORD_SCRAMBLE',
    'MEMORY': 'MEMORY_MATCH',
    'LOGIC': 'LOGIC_PUZZLE',
    'FOCUS': 'FOCUS_REACTION',
    'PATTERN': 'PATTERN_SEQUENCE',
    'SCIENCE': 'SCIENCE_QUIZ'
}

/**
 * Intercepts the global daily challenge and applies a BKT-driven weak-skill override
 * for the specific student. Grants 2x XP for completing targeted practice.
 */
export async function getPersonalizedDailyChallenge(userId: string, targetDate: Date) {
    // 1. Get base global challenge
    const baseChallenge = await getDailyChallenge(targetDate)

    // 2. Personalize if user has weak nodes
    try {
        const weakNodes = await BayesianKnowledgeTracing.getWeakestNodes(userId, 1)
        if (weakNodes.length > 0) {
            const skillCode = weakNodes[0].skillId
            // Extract domain (e.g., MATH from MATH.ADD.1DIGIT)
            const domain = skillCode.split('.')[0]
            const mappedGame = SKILL_TO_GAME_MAP[domain]

            if (mappedGame && mappedGame !== baseChallenge.gameType) {
                return {
                    ...baseChallenge,
                    gameType: mappedGame,
                    description: `Targeted Practice: Polish your skills in ${mappedGame.replace('_', ' ')}!`,
                    bonusXP: baseChallenge.bonusXP * 2, // Incentivize weak skill practice
                    isPersonalized: true
                }
            }
        }
    } catch (e) {
        console.warn('Could not personalize challenge for user', userId, e)
    }

    return { ...baseChallenge, isPersonalized: false }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAIMathQuestion, generateAISubjectQuestion } from '@/lib/ai-games/ai-question-generator'
import { validateAIOutputIntegrity } from '@/lib/ai-games/ai-answer-validator'
import type { AIGameQuestion } from '@/lib/ai-games/types'

// Roles that can access the admin content lab
// (OWNER = platform owner, SCHOOL = school admin, TEACHER)
const ADMIN_ROLES = ['OWNER', 'SCHOOL', 'TEACHER']

// Map game keys to readable topic strings for AI prompt
const GAME_TOPIC_MAP: Record<string, { subject: string; topic: string }> = {
    NUMBER_CATERPILLAR: { subject: 'mathematics', topic: 'counting and number sequences' },
    HOT_AIR_BALLOON_RACE: { subject: 'mathematics', topic: 'addition and subtraction' },
    APPLE_ORCHARD_COLLECTOR: { subject: 'mathematics', topic: 'multiplication' },
    FRACTION_ARROW_ARCHER: { subject: 'mathematics', topic: 'fractions' },
    PIZZA_SLICE_WARS: { subject: 'mathematics', topic: 'fractions and proportions' },
    DECIMAL_DODGE: { subject: 'mathematics', topic: 'decimal numbers' },
    MARKET_MAYHEM: { subject: 'mathematics', topic: 'money and percentages' },
    FACTOR_FORTRESS: { subject: 'mathematics', topic: 'factors and multiples' },
    RATIO_RAIL_RUSH: { subject: 'mathematics', topic: 'ratios and proportions' },
    MULTIPLIER_MAYHEM: { subject: 'mathematics', topic: 'multiplication' },
    ANGLE_ASSASSIN: { subject: 'mathematics', topic: 'angles and geometry' },
    ALGEBRA_WAVE_SURFER: { subject: 'mathematics', topic: 'algebra' },
    AREA_CONSTRUCTOR: { subject: 'mathematics', topic: 'area and perimeter' },
    INTEGER_ICE_BATTLE: { subject: 'mathematics', topic: 'integers and negative numbers' },
    DATA_DETECTIVE: { subject: 'mathematics', topic: 'statistics and data' },
    PROBABILITY_POKER: { subject: 'mathematics', topic: 'probability' },
    COORDINATE_COMBAT: { subject: 'mathematics', topic: 'coordinate geometry' },
    QUADRATIC_QUEST: { subject: 'mathematics', topic: 'quadratic equations' },
    TRIG_BRIDGE_BUILDER: { subject: 'mathematics', topic: 'trigonometry' },
    MATRIX_MORPH_DUEL: { subject: 'mathematics', topic: 'matrices' },
    BINARY_BLASTER: { subject: 'computer-science', topic: 'binary numbers and number systems' },
    PERIODIC_BATTLESHIP: { subject: 'science', topic: 'periodic table and elements' },
    ANIMAL_KINGDOM_SORTER: { subject: 'science', topic: 'animal classification' },
    CAPITALS_CONQUEST: { subject: 'social-studies', topic: 'world capitals and geography' },
    SYNONYM_SWITCHBLADE: { subject: 'english', topic: 'synonyms and antonyms' },
    GRAMMAR_GLADIATOR: { subject: 'english', topic: 'grammar rules' },
    SHABDKOSH_SPRINT: { subject: 'hindi', topic: 'Hindi vocabulary' },
    BUDGET_BATTLE: { subject: 'mathematics', topic: 'financial literacy and budgeting' },
}

function getTopicForGame(gameKey: string): { subject: string; topic: string } {
    if (GAME_TOPIC_MAP[gameKey]) return GAME_TOPIC_MAP[gameKey]
    // Fallback: prettify the key
    const lower = gameKey.toLowerCase().replace(/_/g, ' ')
    const isMath = lower.includes('number') || lower.includes('fraction') || lower.includes('algebra')
        || lower.includes('math') || lower.includes('decimal') || lower.includes('integer')
        || lower.includes('calcul') || lower.includes('trig') || lower.includes('matrix')
    return { subject: isMath ? 'mathematics' : 'general', topic: lower }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !ADMIN_ROLES.includes((session.user as { role?: string }).role ?? '')) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { gameKey, gradeBand = '68', difficulty = 3, count = 10 } = body
    if (!gameKey) return NextResponse.json({ error: 'gameKey required' }, { status: 400 })

    const { subject, topic } = getTopicForGame(gameKey)
    const safeCount = Math.min(Math.max(1, Number(count)), 20)  // 1-20 per batch

    const promises = Array.from({ length: safeCount }, () =>
        subject === 'mathematics'
            ? generateAIMathQuestion(gradeBand, topic, difficulty)
            : generateAISubjectQuestion(subject, topic, gradeBand, difficulty)
    )

    const settled = await Promise.allSettled(promises)
    const questions: (AIGameQuestion & { status: string; validationScore: number; validationErrors: string[] })[] = []

    for (const r of settled) {
        if (r.status !== 'fulfilled' || !r.value) continue
        const q = r.value
        const validation = validateAIOutputIntegrity(q)
        questions.push({
            ...q,
            status: validation.passed ? 'validated' : 'rejected',
            validationScore: validation.score,
            validationErrors: validation.errors,
        })
    }

    return NextResponse.json({
        questions,
        stats: {
            requested: safeCount,
            generated: questions.length,
            validated: questions.filter(q => q.status === 'validated').length,
            rejected: questions.filter(q => q.status === 'rejected').length,
        }
    })
}

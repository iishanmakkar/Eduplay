/**
 * /api/games/submit – Server-Authority Game Submission
 *
 * Client sends: gameType, score, accuracy, timeSpent, matchId, assignmentId
 * Server: validates ranges, enforces billing, computes XP via GamificationEngine,
 *         saves result atomically, returns computed XP.
 *
 * This route is legacy-compatible: it accepts client-computed score/accuracy
 * but applies server-side sanity caps (PPS, max score) before saving.
 * True answer-by-answer verification is done in /api/games/save-result via matchId.
 *
 * NOTE: The primary game flow uses /api/games/save-result (which has full
 * server-authority via GamificationEngine+transactions). This route exists for
 * assignment-linked submissions from the assignment dashboard flow.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { GamificationEngine } from '@/lib/gamification/engine'

const MAX_SCORE = 200000
const MAX_PPS = 500 // Points Per Second — generous ceiling

const submitGameSchema = z.object({
    gameType: z.enum([
        'SPEED_MATH',
        'SCIENCE_QUIZ',
        'WORLD_FLAGS',
        'MEMORY_MATCH',
        'WORD_SCRAMBLE',
        'SPELLING_BEE',
        'COUNTING_BUBBLES',
        'TUG_OF_WAR',
        'LOGIC_PUZZLE',
        'PATTERN_SEQUENCE',
        'MEMORY_GRID_ADV',
        'FOCUS_REACTION',
        'MINI_STRATEGY',
        'CREATIVE_THINKING',
        'CODE_BREAKER',
        'MATH_GRID',
        'VISUAL_ROTATION',
        'SEQUENCE_BUILDER',
        'ANALOGY_GAME',
        'ATTENTION_SWITCH',
        'TIME_PLANNER',
        'SHAPE_CONSTRUCTOR',
        'RIDDLE_SPRINT',
        'LOGIC_GRID',
    ]),
    score: z.number().min(0).max(MAX_SCORE),
    accuracy: z.number().min(0).max(1),
    timeSpent: z.number().min(1).max(7200), // 1s–2hrs
    matchId: z.string().optional(),
    assignmentId: z.string().optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'CHALLENGE']).optional(),
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // SECURITY: Require authentication — both STUDENT and INDEPENDENT can submit
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const allowedRoles = ['STUDENT', 'INDEPENDENT']
        if (!allowedRoles.includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // BILLING: Validate School subscription (only for STUDENT role)
        if (session.user.role === 'STUDENT') {
            const userRecord = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    school: {
                        select: { subscription: { select: { status: true } } }
                    }
                }
            })
            const subStatus = userRecord?.school?.subscription?.status
            if (subStatus !== 'ACTIVE' && subStatus !== 'TRIALING') {
                return NextResponse.json({ error: 'School subscription is not active' }, { status: 403 })
            }
        }

        // BILLING: Validate Independent subscription
        if (session.user.role === 'INDEPENDENT') {
            const indSub = await prisma.independentSubscription.findUnique({
                where: { userId: session.user.id },
                select: { status: true }
            })
            if (!indSub || (indSub.status !== 'ACTIVE' && indSub.status !== 'TRIALING')) {
                return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
            }
        }

        const body = await request.json()
        const parsed = submitGameSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.errors },
                { status: 400 }
            )
        }
        const { gameType, score, accuracy, timeSpent, matchId, assignmentId, difficulty } = parsed.data

        // SERVER-SIDE ANTI-CHEAT: Points-Per-Second cap
        const pps = score / timeSpent
        if (pps > MAX_PPS && score > 1000) {
            console.warn(`[submit] Suspicious PPS ${pps.toFixed(1)} from user ${session.user.id}`)
            return NextResponse.json({ error: 'Score validation failed' }, { status: 400 })
        }

        // IDEMPOTENCY: If matchId provided and result already exists → return cached
        if (matchId) {
            const existing = await prisma.gameResult.findUnique({
                where: { matchId_studentId: { matchId, studentId: session.user.id } }
            })
            if (existing) {
                return NextResponse.json({
                    gameResult: existing,
                    xpEarned: existing.xpEarned,
                    newBadges: [],
                    duplicate: true,
                })
            }
        }

        // TRANSACTION: Save result + update XP atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create GameResult
            const gameResult = await tx.gameResult.create({
                data: {
                    matchId: matchId ?? `submit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                    gameType,
                    score,
                    accuracy,
                    timeSpent,
                    xpEarned: 0, // placeholder
                    studentId: session.user.id,
                    assignmentId,
                    difficulty: difficulty ?? 'MEDIUM',
                },
            })

            // 2. Process gamification (server computes XP — client value ignored)
            const gResult = await GamificationEngine.processResult(
                session.user.id,
                { gameType, score, accuracy, timeSpent },
                tx
            )

            // 3. Write server-computed XP back
            const updated = await tx.gameResult.update({
                where: { id: gameResult.id },
                data: { xpEarned: gResult.xpEarned },
            })

            return { gameResult: updated, gResult }
        }, { timeout: 15000 })

        // BADGES: Batch check to avoid N+1 — check all badge types at once
        const badgeNames: string[] = []
        if (accuracy === 1.0) badgeNames.push('Perfect Score')
        if (timeSpent < 60) badgeNames.push('Speed Demon')

        const newBadges = []
        if (badgeNames.length > 0) {
            const existingBadges = await prisma.badge.findMany({
                where: { studentId: session.user.id, name: { in: badgeNames } },
                select: { name: true },
            })
            const existingNames = new Set(existingBadges.map((b) => b.name))

            const toCreate = badgeNames.filter((n) => !existingNames.has(n))
            if (toCreate.length > 0) {
                const badgeDefinitions: Record<string, { description: string; icon: string }> = {
                    'Perfect Score': { description: 'Achieved 100% accuracy', icon: '💯' },
                    'Speed Demon': { description: 'Completed a game in under 60 seconds', icon: '⚡' },
                }
                for (const name of toCreate) {
                    const def = badgeDefinitions[name]
                    if (def) {
                        const badge = await prisma.badge.create({
                            data: { name, ...def, studentId: session.user.id },
                        })
                        newBadges.push(badge)
                    }
                }
            }
        }

        return NextResponse.json({
            gameResult: result.gameResult,
            xpEarned: result.gResult.xpEarned,
            levelUp: result.gResult.levelUp,
            newLevel: result.gResult.newLevel,
            newBadges,
        })
    } catch (error) {
        // Idempotency: unique constraint violation = duplicate submission
        if ((error as any)?.code === 'P2002') {
            return NextResponse.json({
                xpEarned: 0,
                newBadges: [],
                duplicate: true,
                message: 'Result already saved',
            })
        }
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            )
        }
        console.error('[submit] Unhandled error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

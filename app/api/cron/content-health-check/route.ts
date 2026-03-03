/**
 * Nightly Content Health Check Cron
 * Schedule: 0 2 * * * (2 AM UTC daily)
 *
 * Process:
 *  1. For each registered game key, sample 500 questions from GameQuestion DB
 *  2. Run validateQuestionIntegrity() on each
 *  3. For generator games: run 500 live generations and validate
 *  4. Persist results to QuestionHealthLog
 *  5. Send alert email via Resend if any failures detected
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQuestion } from '@/lib/games/generators/math-generator'
import { validateBatch, validateQuestionIntegrity, QuestionRecord } from '@/lib/games/validation/question-integrity'

const CRON_SECRET = process.env.CRON_SECRET

// All registered game keys (must stay in sync with math-generator.ts dispatcher)
const ALL_GAME_KEYS = [
    'NUMBER_CATERPILLAR', 'HOT_AIR_BALLOON_RACE', 'APPLE_ORCHARD_COLLECTOR', 'FISH_TANK_FILL',
    'SHAPE_SORTER_CITY', 'PIZZA_SLICE_WARS', 'DECIMAL_DODGE', 'MARKET_MAYHEM', 'FACTOR_FORTRESS',
    'FRACTION_ARROW_ARCHER', 'RATIO_RAIL_RUSH', 'MULTIPLIER_MAYHEM', 'ANGLE_ASSASSIN',
    'ALGEBRA_WAVE_SURFER', 'AREA_CONSTRUCTOR', 'INTEGER_ICE_BATTLE', 'DATA_DETECTIVE',
    'PROBABILITY_POKER', 'COORDINATE_COMBAT', 'POLYNOMIAL_PACKAGER', 'CALCULUS_CLIFF',
    'QUADRATIC_QUEST', 'TRIG_BRIDGE_BUILDER', 'MATRIX_MORPH_DUEL', 'INTEGRAL_INVADER',
    'VECTOR_SPACE_VOYAGER', 'STATISTICS_STOCK_PROPHET', 'NUMBER_THEORY_VAULT',
    'COMPLEX_NAVIGATOR', 'PERMUTATION_COASTER', 'SURVEYORS_SPRINT',
    'SYNONYM_SWITCHBLADE', 'GRAMMAR_GLADIATOR', 'IDIOM_HUNTER', 'COMPREHENSION_CODEBREAKER',
    'PHONICS_POND_HOP', 'LETTER_LASSO', 'VOWEL_VILLAGE', 'TENSE_TREKKER', 'PUNCTUATION_RUSH',
    'ESSAY_ENGINEER', 'PARTS_OF_SPEECH_DUEL', 'SHAKESPEARE_SHOWDOWN',
    'PERIODIC_BATTLESHIP', 'ANIMAL_KINGDOM_SORTER', 'SOLAR_SYSTEM_DEFENDER',
    'GENETICS_GENOME_DUEL', 'FOOD_CHAIN_ARENA', 'PLANT_POWER_GROWER', 'FORCE_MOTION_DOJO',
    'ELECTROSTATICS_ARENA', 'EVOLUTION_ISLAND', 'CHEMISTRY_CAULDRON', 'CELL_DIVISION_DASH',
    'WAVE_FREQUENCY_FIGHTER', 'OPTICS_OBSTACLE_COURSE', 'HUMAN_BODY_BLITZ', 'ECOLOGY_EXPEDITION',
    'CAPITALS_CONQUEST', 'WORLD_FLAGS', 'CIVILIZATION_BUILDER', 'EMPIRE_FALL',
    'DEMOCRACY_DEBATE', 'TRADE_ROUTE_TYCOON', 'MAP_MASTERY_MISSION', 'GEOSPY',
    'TIMELINE_BLITZ', 'GEOGRAPHY_GLADIATOR',
    'BINARY_BLASTER', 'CYBER_SHIELD', 'DEBUG_DUEL', 'LOGIC_GATE_GARDEN',
    'ENCRYPTION_ESCAPE', 'AI_TRAINING_GROUND', 'SORTING_RACE', 'ALGORITHM_ARENA',
    'CODE_BREAKER', 'RECURSION_REALM', 'DATA_STRUCTURES_DUEL', 'WEB_WEAVER',
    'INVENTORS_WORKSHOP', 'OLYMPIAD_QUALIFIER', 'CRITICAL_THINKERS_COURT',
    'BUDGET_BATTLE', 'SHOP_IT_UP', 'EQ_MAZE', 'SCIENCE_OLYMPIAD', 'NEWS_NINJA',
    'SHABDKOSH_SPRINT', 'VARNAMALA_VILLAGE', 'VYAKARAN_WARRIOR',
    'HINDI_STORY_BUILDER', 'MATRA_MATCH', 'SANDHI_SHOWDOWN', 'MUHAVARE_MANIA', 'DOHE_KI_DAUD',
]

const SAMPLE_SIZE = 500
const ALERT_THRESHOLD = 0 // alert on ANY failure

interface GameHealthResult {
    gameKey: string
    dbTotal: number
    dbFailed: number
    genRuns: number
    genFailed: number
    passRate: number
    failureDetails: Record<string, number>
    hasFailures: boolean
}

async function checkGame(gameKey: string): Promise<GameHealthResult> {
    // ── 1. DB-stored questions ────────────────────────────────────────────────
    let dbFailed = 0
    const failureDetails: Record<string, number> = {}
    let dbTotal = 0

    const dbQuestions = await prisma.gameQuestion.findMany({
        where: { gameKey, isActive: true },
        take: SAMPLE_SIZE,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, gameKey: true, gradeBand: true, questionText: true,
            answerOptions: true, correctAnswer: true, explanation: true,
            isGenerative: true, seedParams: true, answerFormula: true,
        },
    })

    dbTotal = dbQuestions.length
    if (dbTotal > 0) {
        const records: QuestionRecord[] = dbQuestions.map(q => ({
            id: q.id,
            gameKey: q.gameKey,
            gradeBand: q.gradeBand,
            questionText: q.questionText,
            answerOptions: q.answerOptions as string[] | null,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            isGenerative: q.isGenerative,
            seedParams: q.seedParams as Record<string, unknown> | null,
            answerFormula: q.answerFormula,
        }))

        const batchResult = validateBatch(records)
        dbFailed = batchResult.failed
        for (const [code, count] of Object.entries(batchResult.failureDetails)) {
            failureDetails[code] = (failureDetails[code] ?? 0) + count
        }
    }

    // ── 2. Generator-backed validation ────────────────────────────────────────
    let genRuns = 0
    let genFailed = 0

    const firstGen = generateQuestion(gameKey)
    if (firstGen !== null) {
        // This gameKey has a generator — run SAMPLE_SIZE simulations
        genRuns = SAMPLE_SIZE
        for (let i = 0; i < SAMPLE_SIZE; i++) {
            const q = generateQuestion(gameKey)
            if (!q) {
                genFailed++
                continue
            }
            const record: QuestionRecord = {
                gameKey,
                gradeBand: '35',
                questionText: q.prompt,
                answerOptions: q.options,
                correctAnswer: q.answer,
            }
            const result = validateQuestionIntegrity(record)
            if (!result.valid) {
                genFailed++
                for (const err of result.errors) {
                    failureDetails[`GEN_${err.code}`] = (failureDetails[`GEN_${err.code}`] ?? 0) + 1
                }
            }
        }
    }

    const totalRuns = dbTotal + genRuns
    const totalFails = dbFailed + genFailed
    const passRate = totalRuns > 0 ? (totalRuns - totalFails) / totalRuns : 1.0

    return {
        gameKey,
        dbTotal,
        dbFailed,
        genRuns,
        genFailed,
        passRate,
        failureDetails,
        hasFailures: totalFails > ALERT_THRESHOLD,
    }
}

async function sendAlertEmail(failedGames: GameHealthResult[]) {
    if (!process.env.RESEND_API_KEY) return

    const body = failedGames.map(g => (
        `• ${g.gameKey}: ${((1 - g.passRate) * 100).toFixed(2)}% failure rate\n` +
        `  DB: ${g.dbFailed}/${g.dbTotal} failed | Gen: ${g.genFailed}/${g.genRuns} failed\n` +
        `  Errors: ${JSON.stringify(g.failureDetails)}`
    )).join('\n\n')

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'EduPlay System <system@eduplay.in>',
            to: process.env.ADMIN_EMAIL ?? 'admin@eduplay.in',
            subject: `🚨 EduPlay Content Health Alert — ${failedGames.length} game(s) failing`,
            text: `CONTENT HEALTH CHECK FAILED\n\nTime: ${new Date().toISOString()}\n\n${body}\n\nFix immediately to prevent incorrect answers reaching students.`,
        }),
    })
}

export async function GET(request: NextRequest) {
    // Auth: only allow cron secret
    const authHeader = request.headers.get('authorization')
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startedAt = Date.now()
    const results: GameHealthResult[] = []
    const failedGames: GameHealthResult[] = []

    for (const gameKey of ALL_GAME_KEYS) {
        try {
            const result = await checkGame(gameKey)
            results.push(result)
            if (result.hasFailures) failedGames.push(result)

            // Persist to QuestionHealthLog
            await prisma.questionHealthLog.create({
                data: {
                    gameKey,
                    sampleSize: result.dbTotal + result.genRuns,
                    failures: result.dbFailed + result.genFailed,
                    failureDetails: result.failureDetails,
                    generatorRuns: result.genRuns,
                    generatorFails: result.genFailed,
                    passRate: result.passRate,
                    alertSent: false,
                },
            })
        } catch (err) {
            console.error(`[content-health-check] Error checking ${gameKey}:`, err)
        }
    }

    // Send alert if any failures
    let alertSent = false
    if (failedGames.length > 0) {
        await sendAlertEmail(failedGames)
        alertSent = true
        // Mark alerts as sent
        await prisma.questionHealthLog.updateMany({
            where: {
                gameKey: { in: failedGames.map(g => g.gameKey) },
                runAt: { gte: new Date(startedAt) },
            },
            data: { alertSent: true },
        })
    }

    const elapsed = Date.now() - startedAt
    const overallPassRate = results.length > 0
        ? results.reduce((s, r) => s + r.passRate, 0) / results.length
        : 1.0

    console.log(`[content-health-check] Completed in ${elapsed}ms — ${failedGames.length}/${results.length} games failing`)

    return NextResponse.json({
        status: failedGames.length === 0 ? 'ok' : 'alert',
        gamesChecked: results.length,
        gamesFailing: failedGames.length,
        overallPassRate: Math.round(overallPassRate * 10000) / 100,
        alertSent,
        elapsedMs: elapsed,
        failures: failedGames.map(g => ({
            gameKey: g.gameKey,
            passRate: Math.round(g.passRate * 10000) / 100,
            errors: g.failureDetails,
        })),
    })
}

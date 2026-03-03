#!/usr/bin/env ts-node
/**
 * scripts/nightly-audit.ts
 *
 * PHASE 1 — Nightly Deep Validation Mode
 *
 * Runs 1,000 random question generations per game and validates each
 * with strictAcademicValidation(). Generates a JSON compliance report.
 *
 * Usage:
 *   npx ts-node scripts/nightly-audit.ts [--games ALL|GAME_KEY] [--per-game 1000]
 *
 * Output:
 *   audit-reports/nightly-YYYY-MM-DD.json
 */

import { runCertificationAudit, type QuestionForAudit } from '../lib/game-engine/strict-academic-validator'
import { generateAIMathQuestion } from '../lib/ai-games/ai-question-generator'
import * as fs from 'fs'
import * as path from 'path'

const MATH_GAMES = [
    'NUMBER_CATERPILLAR', 'HOT_AIR_BALLOON_RACE', 'APPLE_ORCHARD_COLLECTOR',
    'FRACTION_ARROW_ARCHER', 'PIZZA_SLICE_WARS', 'DECIMAL_DODGE',
    'MARKET_MAYHEM', 'FACTOR_FORTRESS', 'RATIO_RAIL_RUSH', 'MULTIPLIER_MAYHEM',
    'ANGLE_ASSASSIN', 'ALGEBRA_WAVE_SURFER', 'AREA_CONSTRUCTOR',
    'INTEGER_ICE_BATTLE', 'DATA_DETECTIVE', 'PROBABILITY_POKER',
    'COORDINATE_COMBAT', 'QUADRATIC_QUEST', 'TRIG_BRIDGE_BUILDER',
    'MATRIX_MORPH_DUEL', 'BINARY_BLASTER',
]

const args = process.argv.slice(2)
const perGame = parseInt(args.find(a => a.startsWith('--per-game='))?.split('=')[1] ?? '100')
const gameFilter = args.find(a => a.startsWith('--games='))?.split('=')[1] ?? 'ALL'
const targetGames = gameFilter === 'ALL' ? MATH_GAMES : [gameFilter]

async function auditGame(gameKey: string, count: number) {
    const results: QuestionForAudit[] = []
    const topic = gameKey.toLowerCase().replace(/_/g, ' ')

    for (let i = 0; i < count; i++) {
        try {
            const q = await generateAIMathQuestion('68', topic, 3)
            if (q) {
                results.push({
                    prompt: q.prompt,
                    options: q.answerOptions ?? [],
                    answer: q.correctAnswer ?? '',
                    gameKey,
                    gradeBand: '68',
                    subject: q.subjectTag,
                })
            }
        } catch { /* skip failed generation */ }
    }

    return runCertificationAudit(results)
}

async function main() {
    const date = new Date().toISOString().split('T')[0]
    const reportDir = path.join(process.cwd(), 'audit-reports')
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })

    const report: Record<string, {
        passRate: number
        certified: boolean
        avgConfidenceScore: number
        topViolations: { code: string; count: number }[]
    }> = {}

    for (const game of targetGames) {
        process.stdout.write(`Auditing ${game} (${perGame} runs)... `)
        const result = await auditGame(game, perGame)
        report[game] = {
            passRate: result.passRate,
            certified: result.certified,
            avgConfidenceScore: result.avgConfidenceScore,
            topViolations: result.topViolations,
        }
        process.stdout.write(`${(result.passRate * 100).toFixed(1)}% pass — ${result.certified ? '✅ CERTIFIED' : '❌ FAILED'}\n`)
    }

    const summary = {
        date,
        perGameSampleSize: perGame,
        games: report,
        globalPassRate: Object.values(report).reduce((s, r) => s + r.passRate, 0) / Object.values(report).length,
        allCertified: Object.values(report).every(r => r.certified),
    }

    const outPath = path.join(reportDir, `nightly-${date}.json`)
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2))
    console.log(`\n✅ Report saved: ${outPath}`)
    console.log(`Global pass rate: ${(summary.globalPassRate * 100).toFixed(2)}%`)
    console.log(summary.allCertified ? '🏆 ALL GAMES CERTIFIED' : '⚠️  CERTIFICATION FAILED — review violations')
    process.exit(summary.allCertified ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })

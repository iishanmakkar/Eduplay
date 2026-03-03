/**
 * lib/game-engine/grade-calibration.ts
 *
 * PHASE 4 — Grade Calibration & Performance Grading System
 *
 * Maps raw scores/accuracy to:
 *   - Performance band (A/B/C/D/F) per grade band
 *   - Weakest/Strongest topic detection from session history
 *   - Suggested next game based on performance + topic
 *   - Bloom's taxonomy auto-check on submitted questions
 *   - Grade-appropriate difficulty adjustment recommendations
 */

import type { GradeBand, BloomsLevel } from './academic-question'

// ── Performance Bands ─────────────────────────────────────────────────────────

export type PerformanceBand = 'A' | 'B' | 'C' | 'D' | 'F'
export type PerformanceTier = 'Distinction' | 'Merit' | 'Pass' | 'Borderline' | 'Below Standard'

export interface PerformanceGrade {
    letter: PerformanceBand
    tier: PerformanceTier
    percentile: string
    advice: string
    color: 'emerald' | 'blue' | 'amber' | 'orange' | 'red'
}

/**
 * Converts accuracy (0.0–1.0) to academic performance band.
 * Thresholds are calibrated to real CBSE/ICSE marking guidelines.
 */
export function getPerformanceGrade(accuracy: number, gradeBand: GradeBand): PerformanceGrade {
    const pct = Math.round(Math.max(0, Math.min(1, accuracy)) * 100)

    // CBSE/ICSE standard grading
    if (pct >= 90) return { letter: 'A', tier: 'Distinction', percentile: 'Top 10%', advice: 'Outstanding! Try a harder difficulty level.', color: 'emerald' }
    if (pct >= 75) return { letter: 'B', tier: 'Merit', percentile: 'Top 25%', advice: 'Well done! Focus on your weak topics to reach Distinction.', color: 'blue' }
    if (pct >= 55) return { letter: 'C', tier: 'Pass', percentile: 'Average', advice: 'Passing grade. Review the questions you got wrong.', color: 'amber' }
    if (pct >= 33) return { letter: 'D', tier: 'Borderline', percentile: 'Below average', advice: 'Borderline. Revisit the fundamentals before proceeding.', color: 'orange' }
    return { letter: 'F', tier: 'Below Standard', percentile: 'Below 33%', advice: 'Needs improvement. Start from the basics of this topic.', color: 'red' }
}

// ── Topic Performance Analysis ─────────────────────────────────────────────────

export interface AnswerRecord {
    skillTag: string
    topic?: string
    isCorrect: boolean
    timeTaken?: number  // seconds
}

export interface TopicPerformanceSummary {
    skillTag: string
    correct: number
    total: number
    accuracy: number
}

export interface SessionInsight {
    weakestTopic: string
    strongestTopic: string
    topicBreakdown: TopicPerformanceSummary[]
    averageTimeTaken: number  // seconds per question
    consistencyScore: number  // 0–1, measures variance in correctness
}

export function analyzeSessionPerformance(answers: AnswerRecord[]): SessionInsight {
    if (!answers || answers.length === 0) {
        return {
            weakestTopic: 'N/A',
            strongestTopic: 'N/A',
            topicBreakdown: [],
            averageTimeTaken: 0,
            consistencyScore: 0,
        }
    }

    // Group by skill/topic
    const byTopic: Record<string, { correct: number; total: number }> = {}
    const times: number[] = []

    for (const a of answers) {
        const key = a.skillTag || a.topic || 'general'
        if (!byTopic[key]) byTopic[key] = { correct: 0, total: 0 }
        byTopic[key].total++
        if (a.isCorrect) byTopic[key].correct++
        if (a.timeTaken && a.timeTaken > 0) times.push(a.timeTaken)
    }

    const breakdown: TopicPerformanceSummary[] = Object.entries(byTopic).map(([skillTag, { correct, total }]) => ({
        skillTag,
        correct,
        total,
        accuracy: total > 0 ? correct / total : 0,
    }))

    const sorted = [...breakdown].sort((a, b) => a.accuracy - b.accuracy)
    const weakest = sorted[0]?.skillTag ?? 'N/A'
    const strongest = sorted[sorted.length - 1]?.skillTag ?? 'N/A'

    const avg = times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0

    // Consistency: how uniform are scores across topics
    const accuracies = breakdown.map(b => b.accuracy)
    const mean = accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length : 0
    const variance = accuracies.length > 1
        ? accuracies.reduce((s, a) => s + Math.pow(a - mean, 2), 0) / accuracies.length
        : 0
    const consistency = Math.max(0, 1 - variance)

    return {
        weakestTopic: weakest.replace(/_/g, ' '),
        strongestTopic: strongest.replace(/_/g, ' '),
        topicBreakdown: breakdown,
        averageTimeTaken: Math.round(avg * 10) / 10,
        consistencyScore: Math.round(consistency * 100) / 100,
    }
}

// ── Suggested Next Game ────────────────────────────────────────────────────────

interface SuggestedGame {
    gameKey: string
    displayName: string
    reason: string
}

const TOPIC_TO_GAME: Record<string, { gameKey: string; displayName: string }> = {
    fractions: { gameKey: 'FRACTION_ARROW_ARCHER', displayName: 'Fraction Arrow Archer' },
    algebra: { gameKey: 'ALGEBRA_WAVE_SURFER', displayName: 'Algebra Wave Surfer' },
    multiplication: { gameKey: 'MULTIPLIER_MAYHEM', displayName: 'Multiplier Mayhem' },
    percentages: { gameKey: 'MARKET_MAYHEM', displayName: 'Market Mayhem' },
    geometry: { gameKey: 'ANGLE_ASSASSIN', displayName: 'Angle Assassin' },
    integers: { gameKey: 'INTEGER_ICE_BATTLE', displayName: 'Integer Ice Battle' },
    probability: { gameKey: 'PROBABILITY_POKER', displayName: 'Probability Poker' },
    statistics: { gameKey: 'STATISTICS_STOCK_PROPHET', displayName: 'Statistics Stock Prophet' },
    data: { gameKey: 'DATA_DETECTIVE', displayName: 'Data Detective' },
    trigonometry: { gameKey: 'TRIG_BRIDGE_BUILDER', displayName: 'Trig Bridge Builder' },
    calculus: { gameKey: 'CALCULUS_CLIFF', displayName: 'Calculus Cliff' },
    number_theory: { gameKey: 'NUMBER_THEORY_VAULT', displayName: 'Number Theory Vault' },
    grammar: { gameKey: 'GRAMMAR_GLADIATOR', displayName: 'Grammar Gladiator' },
    vocabulary: { gameKey: 'SYNONYM_SWITCHBLADE', displayName: 'Synonym Switchblade' },
    periodic_table: { gameKey: 'PERIODIC_BATTLESHIP', displayName: 'Periodic Battleship' },
    binary: { gameKey: 'BINARY_BLASTER', displayName: 'Binary Blaster' },
    history: { gameKey: 'TIMELINE_BLITZ', displayName: 'Timeline Blitz' },
    geography: { gameKey: 'GEOSPY', displayName: 'GeoSpy' },
}

export function suggestNextGame(insight: SessionInsight, currentGameKey: string): SuggestedGame {
    const weakTopic = insight.weakestTopic.toLowerCase().replace(/\s+/g, '_')

    // Find a game for the weakest topic
    const topicMatch = Object.keys(TOPIC_TO_GAME).find(k => weakTopic.includes(k))
    if (topicMatch) {
        const game = TOPIC_TO_GAME[topicMatch]
        if (game.gameKey !== currentGameKey) {
            return { ...game, reason: `Strengthen your weak topic: ${insight.weakestTopic}` }
        }
    }

    // Default: suggest a related game
    return {
        gameKey: 'SPEED_MATH',
        displayName: 'Speed Math',
        reason: 'Build fluency with timed practice',
    }
}

// ── Bloom's Auto-Check ─────────────────────────────────────────────────────────

export interface BloomsCheckResult {
    declaredLevel: BloomsLevel
    likelyLevel: BloomsLevel
    mismatch: boolean
    note: string
}

const BLOOMS_KEYWORDS: Record<BloomsLevel, string[]> = {
    remember: ['what is', 'define', 'name', 'list', 'recall', 'identify', 'state'],
    understand: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'compare'],
    apply: ['calculate', 'solve', 'compute', 'use', 'find', 'determine', 'apply'],
    analyze: ['analyze', 'break down', 'examine', 'differentiate', 'which of the following', 'identify the error'],
    evaluate: ['evaluate', 'justify', 'assess', 'critique', 'judge', 'is it valid', 'does it'],
    create: ['design', 'construct', 'formulate', 'create', 'develop', 'write', 'compose'],
}

export function checkBloomsAlignment(prompt: string, declaredLevel: BloomsLevel): BloomsCheckResult {
    const lower = prompt.toLowerCase()
    let likelyLevel: BloomsLevel = 'remember'

    for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS) as [BloomsLevel, string[]][]) {
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                likelyLevel = level
                break
            }
        }
    }

    const mismatch = likelyLevel !== declaredLevel
    return {
        declaredLevel,
        likelyLevel,
        mismatch,
        note: mismatch
            ? `Question prompt suggests Bloom's "${likelyLevel}" but declared as "${declaredLevel}"`
            : `Bloom's level is consistent`,
    }
}

// ── Safety utilities for result screen ────────────────────────────────────────

export function buildResultScreenData({
    score,
    accuracy,
    timeSpent,
    answers,
    gameKey,
    gradeBand,
    xpEarned,
    masteryDelta,
}: {
    score: number
    accuracy: number
    timeSpent: number
    answers: AnswerRecord[]
    gameKey: string
    gradeBand?: string
    xpEarned?: number
    masteryDelta?: number
}) {
    const safeAccuracy = isFinite(accuracy) ? Math.max(0, Math.min(1, accuracy)) : 0
    const safeScore = isFinite(score) && score >= 0 ? score : 0
    const safeTime = isFinite(timeSpent) && timeSpent > 0 ? timeSpent : 0
    const safeXP = isFinite(xpEarned ?? 0) ? (xpEarned ?? 0) : 0
    const safeMastery = isFinite(masteryDelta ?? 0) ? (masteryDelta ?? 0) : 0

    const gb = (gradeBand ?? '68').replace(/[^a-z0-9]/gi, '') as GradeBand
    const grade = getPerformanceGrade(safeAccuracy, gb in { KG2: 1, '35': 1, '68': 1, '912': 1 } ? gb : '68')
    const insight = analyzeSessionPerformance(answers)
    const suggestion = suggestNextGame(insight, gameKey)
    const accuracyPct = Math.round(safeAccuracy * 100)

    return {
        score: safeScore,
        accuracyPct,
        timeSpent: safeTime,
        xpEarned: safeXP,
        masteryDelta: safeMastery,
        grade: grade.letter,
        gradeTier: grade.tier,
        gradeAdvice: grade.advice,
        gradeColor: grade.color,
        weakestTopic: insight.weakestTopic,
        strongestTopic: insight.strongestTopic,
        topicBreakdown: insight.topicBreakdown,
        averageTimeTaken: insight.averageTimeTaken,
        suggestedNextGame: suggestion,
        sessionComplete: true,
    }
}

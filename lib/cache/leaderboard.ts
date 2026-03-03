/**
 * Redis Leaderboard — Multi-Board Sorted Set Implementation
 *
 * Board types:
 *   global     → all students, current week
 *   school     → per schoolId, current week
 *   grade      → per grade band, current week
 *   game       → per gameType, current week
 *   alltime    → global, all time (never expires)
 *
 * Data structure (per board):
 *   Key:    lb:{boardType}:{scope}:{weekStart}   (weekly boards)
 *           lb:alltime                            (all-time board)
 *   Member: {studentId}:{studentName}
 *   Score:  cumulative XP
 *
 * Tie handling: members with equal XP are ranked by insertion timestamp
 * (earlier first). We achieve this by using score = xp * 1e10 + (MAX_TS - ts)
 * so higher XP always wins, and for ties, earlier timestamp wins.
 *
 * TTL: 8 days for weekly boards. alltime: no TTL.
 */

import { redis } from './redis'

const LEADERBOARD_TTL_SECONDS = 8 * 24 * 60 * 60  // 8 days
const MAX_TS = 9_999_999_999_999  // Far future ms (larger than any real ts)

export function getWeekStart(date: Date = new Date()): string {
    const d = new Date(date)
    const day = d.getUTCDay()
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
    d.setUTCDate(diff)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0] // e.g. "2026-02-16"
}

// ── Key builders ──────────────────────────────────────────────────────────────

export type LeaderboardBoardType = 'global' | 'school' | 'grade' | 'game' | 'alltime' | 'epr'

function lbKey(type: LeaderboardBoardType, scope?: string, weekStart?: string): string {
    if (type === 'alltime') return 'lb:alltime'
    if (type === 'epr' && scope) return `lb:epr:${scope}` // Global EPR strictly by grade band
    const week = weekStart ?? getWeekStart()
    const scopePart = scope ? `:${scope}` : ''
    return `lb:${type}${scopePart}:${week}`
}

function encodeMember(studentId: string, studentName: string): string {
    return `${studentId}:${studentName.replace(/:/g, '_')}`
}

function decodeMember(member: string): { studentId: string; studentName: string } {
    const idx = member.indexOf(':')
    return {
        studentId: member.slice(0, idx),
        studentName: member.slice(idx + 1).replace(/_/g, ' '),
    }
}

/**
 * Build a tie-aware score: XP takes priority, timestamp is tie-breaker.
 * score = xp * 1e10 + (MAX_TS - Date.now())
 * Higher score wins ZREVRANGE → higher XP wins; for same XP, earlier timestamp wins.
 */
function buildScore(xp: number): number {
    const ts = Date.now()
    return xp * 1e10 + (MAX_TS - ts)
}

// ── Write ─────────────────────────────────────────────────────────────────────

export interface IncrementParams {
    studentId: string
    studentName: string
    xpDelta: number
    schoolId?: string
    grade?: string        // e.g. '6', '7', 'K'
    gameType?: string
    weekStart?: string
}

/**
 * Increment XP across all relevant leaderboards atomically.
 * Called from save-result after server-computed XP is known.
 */
export async function incrementLeaderboardXP(params: IncrementParams): Promise<void> {
    const {
        studentId, studentName, xpDelta,
        schoolId, grade, gameType, weekStart
    } = params

    try {
        const week = weekStart ?? getWeekStart()
        const member = encodeMember(studentId, studentName)
        const score = buildScore(xpDelta)

        const keys: string[] = [
            lbKey('global', undefined, week),
            lbKey('alltime'),
        ]
        if (schoolId) keys.push(lbKey('school', schoolId, week))
        if (grade) keys.push(lbKey('grade', grade, week))
        if (gameType) keys.push(lbKey('game', gameType, week))

        // ZINCRBY all boards in parallel
        await Promise.all(keys.map(async key => {
            await (redis as any).zincrby(key, score, member)
            if (key !== 'lb:alltime') {
                await (redis as any).expire(key, LEADERBOARD_TTL_SECONDS)
            }
        }))
    } catch (err) {
        console.warn('[leaderboard] Redis ZINCRBY failed (non-fatal):', err)
    }
}

/**
 * Increment EduPlay Rating (EPR) for the student's specific Cognitive Band.
 * This is an Elo-like tracking system that never expires.
 */
export async function incrementEPR(params: {
    studentId: string
    studentName: string
    gradeBand: string // BAND_1 ... BAND_5
    eprDelta: number
}): Promise<void> {
    const { studentId, studentName, gradeBand, eprDelta } = params
    try {
        const member = encodeMember(studentId, studentName)
        const key = lbKey('epr', gradeBand)

        // Use true score (Elo) rather than tie-aware because EPR is an exact rating
        await (redis as any).zincrby(key, eprDelta, member)
    } catch (err) {
        console.warn('[leaderboard] Redis ZINCRBY EPR failed:', err)
    }
}

// ── Read ──────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
    rank: number
    studentId: string
    studentName: string
    weeklyXP: number
}

/**
 * Fetch top N entries from any board type.
 *
 * @param boardType   - 'global' | 'school' | 'grade' | 'game' | 'alltime'
 * @param scope       - schoolId / grade string / gameType (ignored for global/alltime)
 * @param n           - Number of entries
 * @param weekStart   - ISO week date (defaults to current week)
 */
export async function getTopLeaderboard(
    boardType: LeaderboardBoardType = 'global',
    scope?: string,
    n: number = 10,
    weekStart?: string,
): Promise<LeaderboardEntry[] | null> {
    try {
        const key = lbKey(boardType, scope, weekStart)
        const results: string[] = await (redis as any).zrevrange(key, 0, n - 1, 'WITHSCORES')
        if (!results || results.length === 0) return null

        const entries: LeaderboardEntry[] = []
        for (let i = 0; i < results.length; i += 2) {
            const { studentId, studentName } = decodeMember(results[i])
            // Decode XP from composite score
            const rawScore = Number(results[i + 1])
            const xp = Math.floor(rawScore / 1e10)
            entries.push({ rank: Math.floor(i / 2) + 1, studentId, studentName, weeklyXP: xp })
        }
        return entries
    } catch (err) {
        console.warn('[leaderboard] getTopLeaderboard failed (non-fatal):', err)
        return null
    }
}

/**
 * Get a student's rank and XP on a specific board.
 */
export async function getPlayerRank(
    studentId: string,
    studentName: string,
    boardType: LeaderboardBoardType = 'global',
    scope?: string,
    weekStart?: string,
): Promise<{ rank: number; weeklyXP: number } | null> {
    try {
        const key = lbKey(boardType, scope, weekStart)
        const member = encodeMember(studentId, studentName)

        const [rank, rawScore] = await Promise.all([
            (redis as any).zrevrank(key, member),
            (redis as any).zscore(key, member),
        ])

        if (rank === null) return null
        const xp = Math.floor(Number(rawScore ?? 0) / 1e10)
        return { rank: (rank as number) + 1, weeklyXP: xp }
    } catch (err) {
        console.warn('[leaderboard] getPlayerRank failed (non-fatal):', err)
        return null
    }
}

/**
 * Fetch all boards for a student in one call (used by student dashboard).
 */
export async function getAllBoardsForStudent(
    studentId: string,
    studentName: string,
    schoolId?: string,
    grade?: string,
): Promise<{
    global: { rank: number; weeklyXP: number } | null
    school: { rank: number; weeklyXP: number } | null
    grade: { rank: number; weeklyXP: number } | null
    alltime: { rank: number; weeklyXP: number } | null
}> {
    const [global_, school, gradeRank, alltime] = await Promise.all([
        getPlayerRank(studentId, studentName, 'global'),
        schoolId ? getPlayerRank(studentId, studentName, 'school', schoolId) : Promise.resolve(null),
        grade ? getPlayerRank(studentId, studentName, 'grade', grade) : Promise.resolve(null),
        getPlayerRank(studentId, studentName, 'alltime'),
    ])

    return { global: global_, school, grade: gradeRank, alltime }
}

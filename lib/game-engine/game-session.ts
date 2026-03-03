/**
 * Unified Game Session Interface
 * lib/game-engine/game-session.ts
 *
 * ALL scored game sessions are created server-side.
 * Questions are hashed to prevent client-side tampering.
 * Correct answers are never sent to the client.
 *
 * Flow:
 *   1. Client calls POST /api/games/session → gets GameSession (no answers)
 *   2. Client plays, collects submitted answers
 *   3. Client calls POST /api/games/save-result with sessionId + submittedAnswers + signature
 *   4. Server validates signature, computes score, saves result
 */

import { randomUUID } from 'crypto'
import { createHmac } from 'crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export type GameMode = 'SOLO' | 'DUEL' | 'CLASSROOM'

export interface GameQuestion {
    /** UUID — used as hash seed and for ordering */
    id: string
    /** Rendered question text or math expression */
    display: string
    /** Question type — determines input component */
    type: 'MCQ' | 'TEXT_INPUT' | 'SEQUENCE' | 'MATCH'
    /** MCQ options (shuffled server-side, no answer field for client) */
    options?: string[]
    /** Optional hint text */
    hint?: string
    /** Curriculum skill code for BKT tracking */
    skillCode: string
    /** Difficulty level for this question */
    difficultyLevel: 1 | 2 | 3 | 4
    /** Per-question time limit in seconds */
    timeLimit: number
}

/** Full session — correct answers kept server-side only */
export interface GameSession {
    sessionId: string
    gameType: string
    mode: GameMode
    /** Questions WITHOUT correctAnswer — sent to client */
    questions: GameQuestion[]
    /** Server UTC ms — client uses for desync detection */
    serverTimestamp: number
    /** HMAC-SHA256 of all question IDs + correct answers + sessionId */
    questionHash: string
    studentId: string
    teacherId?: string           // For DUEL / CLASSROOM
    classroomCode?: string       // For CLASSROOM mode
    /** Session expires 30 minutes after creation */
    expiresAt: number
    /** Grade band for difficulty calculation */
    grade: string
}

/** Internal session stored in Redis — includes correct answers */
export interface GameSessionInternal extends GameSession {
    correctAnswers: string[]     // Indexed parallel to questions[]
    submittedAt?: number         // Set on save-result → prevents replay
    used: boolean                // true after save-result called
}

// ── Submission types ──────────────────────────────────────────────────────────

export interface GameSubmission {
    sessionId: string
    submittedAnswers: string[]   // One per question, may be '' for skipped
    /** Per-answer timestamps (ms since session start) */
    answerTimestamps: number[]
    /** HMAC-SHA256(sessionId + answers.join(',') + userId, NEXTAUTH_SECRET) */
    signature: string
    /** Used power-ups this session */
    powerUpsUsed?: Array<'TIME_FREEZE' | 'DOUBLE_XP' | 'SHIELD'>
}

export interface GameSubmissionResult {
    sessionId: string
    score: number
    accuracy: number
    correctCount: number
    totalQuestions: number
    xpEarned: number
    answerDetails: Array<{
        questionId: string
        submitted: string
        correct: string
        isCorrect: boolean
        timeMs: number
    }>
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
    serverComputedAt: string
}

// ── HMAC helpers ──────────────────────────────────────────────────────────────

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret-replace-in-production'

export function signSession(sessionId: string, correctAnswers: string[]): string {
    return createHmac('sha256', SECRET)
        .update(`${sessionId}|${correctAnswers.join(',')}`)
        .digest('hex')
}

export function verifySubmissionSignature(
    sessionId: string,
    submittedAnswers: string[],
    userId: string,
    signature: string
): boolean {
    const expected = createHmac('sha256', SECRET)
        .update(`${sessionId}|${submittedAnswers.join(',')}|${userId}`)
        .digest('hex')
    // Constant-time comparison
    if (expected.length !== signature.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
        diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    return diff === 0
}

// ── Speed cap enforcement ─────────────────────────────────────────────────────

/** Minimum milliseconds a student must spend on ANY single answer */
export const MIN_ANSWER_TIME_MS = 400

export function validateAnswerSpeeds(
    timestamps: number[],
    sessionStartMs: number
): { valid: boolean; violations: number[] } {
    const violations: number[] = []
    let prev = sessionStartMs

    for (let i = 0; i < timestamps.length; i++) {
        const delta = timestamps[i] - prev
        if (delta < MIN_ANSWER_TIME_MS) {
            violations.push(i)
        }
        prev = timestamps[i]
    }

    return { valid: violations.length === 0, violations }
}

// ── Session factory ───────────────────────────────────────────────────────────

/**
 * Create a new GameSession skeleton.
 * Questions are populated by game-specific generators then merged here.
 */
export function createSessionSkeleton(params: {
    gameType: string
    mode: GameMode
    studentId: string
    grade: string
    teacherId?: string
    classroomCode?: string
}): { sessionId: string; expiresAt: number; serverTimestamp: number } {
    return {
        sessionId: randomUUID(),
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        serverTimestamp: Date.now()
    }
}

/**
 * Build the questionHash for tamper detection.
 * Hash = HMAC(questionIds.join('|') + '|' + correctAnswers.join('|'), SECRET)
 */
export function buildQuestionHash(
    sessionId: string,
    questions: Array<{ id: string }>,
    correctAnswers: string[]
): string {
    const payload = [
        sessionId,
        questions.map(q => q.id).join('|'),
        correctAnswers.join('|')
    ].join('::')

    return createHmac('sha256', SECRET).update(payload).digest('hex')
}

// ── Classroom session types ───────────────────────────────────────────────────

export type ClassroomStatus = 'LOBBY' | 'COUNTDOWN' | 'ACTIVE' | 'FINISHED'

export interface ClassroomSession {
    code: string                         // 6-character alphanumeric
    teacherId: string
    gameType: string
    /** Questions with correct answers (server-side only in Redis) */
    questions: Array<GameQuestion & { correctAnswer: string }>
    players: Map<string, ClassroomPlayer>
    status: ClassroomStatus
    currentQuestionIndex: number
    createdAt: number
    startedAt?: number
    finishedAt?: number
    expiresAt: number                    // Lobby: 2 hours; Active: 45 minutes
}

export interface ClassroomPlayer {
    studentId: string
    displayName: string
    answers: Array<{
        questionIndex: number
        submitted: string
        isCorrect: boolean
        timeMs: number
    }>
    score: number
    rank?: number
    joinedAt: number
    lastHeartbeat: number
}

/** Generate a random 6-character session code */
export function generateClassroomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No 0,O,I,1 to avoid confusion
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

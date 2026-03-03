/**
 * lib/security/input-sanitizer.ts
 *
 * PHASE 3 — Unified Input Sanitization
 *
 * Covers: Phase 3 (input validation), Phase 6 (AI prompt injection prevention),
 * Phase 13 (XSS/injection pen-test mitigations)
 *
 * All game endpoints, AI endpoints, and user-facing forms use this module.
 */

import { z } from 'zod'

// ── 1. Primitive sanitizers ───────────────────────────────────────────────────

const HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#x27;', '/': '&#x2F;',
}

/** Escape HTML special chars to prevent XSS in rendered output */
export function escapeHTML(raw: string): string {
    return String(raw).replace(/[&<>"'/]/g, c => HTML_ESCAPE_MAP[c] ?? c)
}

/** Strip all HTML tags from a string */
export function stripHTML(raw: string): string {
    return String(raw).replace(/<[^>]*>/g, '').trim()
}

/** Remove script-injection patterns from a string */
export function stripScriptTags(raw: string): string {
    return raw
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:/gi, '')
        .trim()
}

/** Safe text: trim + max length + strip HTML + XSS patterns */
export function sanitizeText(raw: string, maxLength = 2000): string {
    return stripScriptTags(stripHTML(String(raw ?? '').trim())).slice(0, maxLength)
}

/** Safe numeric: reject NaN, Infinity, non-finite */
export function sanitizeNumber(raw: unknown): number {
    const n = Number(raw)
    if (!isFinite(n) || isNaN(n)) throw new RangeError(`Invalid numeric value: ${raw}`)
    return n
}

/** Safe integer with bounds */
export function sanitizeInt(raw: unknown, min: number, max: number): number {
    const n = sanitizeNumber(raw)
    if (n < min || n > max) throw new RangeError(`Value ${n} out of range [${min}, ${max}]`)
    return Math.round(n)
}

/** Prevent prototype pollution: reject __proto__, constructor, prototype keys */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const dangerous = ['__proto__', 'constructor', 'prototype']
    for (const key of Object.keys(obj)) {
        if (dangerous.includes(key)) {
            throw new Error(`Prototype pollution attempt detected: key "${key}"`)
        }
    }
    return obj
}

/** Detect and block null-prototype payloads */
export function assertSafePayload(obj: unknown): void {
    if (obj !== null && typeof obj === 'object' && Object.getPrototypeOf(obj) === null) {
        throw new Error('Null-prototype payload rejected')
    }
}

// ── 2. AI Prompt Hardening ─────────────────────────────────────────────────────

// Patterns that indicate prompt injection attempts
const PROMPT_INJECTION_PATTERNS = [
    /ignore (all|previous|prior) (system|instructions?|prompts?)/i,
    /you are now/i,
    /forget your (instructions?|system prompt|rules?)/i,
    /disregard (the above|all|your)/i,
    /override (your|the) (instructions?|system|config)/i,
    /reveal (your|the) (system prompt|instructions?|secret)/i,
    /act as (a different|an evil|a bad|a harmful)/i,
    /\[SYSTEM\]/i, /\[INST\]/i, /\<\|\|system\|\|\>/i,
    /\\n\\nHuman:/i, /\\n\\nAssistant:/i,
]

const TOXICITY_PATTERNS = [
    /\b(kill|murder|harm|hurt|rape|abuse|exploit|bomb|weapon)\b/i,
    /\b(hate|racist|sexist|discriminat)/i,
]

export interface PromptSafetyResult {
    safe: boolean
    reason?: string
    sanitized: string
}

/**
 * Sanitize and validate an AI prompt for injection and toxicity.
 * Returns sanitized version OR marks unsafe.
 */
export function sanitizeAIPrompt(
    raw: string,
    maxLength = 5000
): PromptSafetyResult {
    const trimmed = String(raw ?? '').trim().slice(0, maxLength)

    // Check injection patterns
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { safe: false, reason: 'Prompt injection attempt detected', sanitized: '' }
        }
    }

    // Check toxicity
    for (const pattern of TOXICITY_PATTERNS) {
        if (pattern.test(trimmed)) {
            return { safe: false, reason: 'Toxic content detected', sanitized: '' }
        }
    }

    // Sanitize but preserve academic content
    const sanitized = stripScriptTags(trimmed)

    return { safe: true, sanitized }
}

/**
 * Validate AI-generated output before rendering to users.
 * Prevents hallucinated scripts or malicious output from being rendered.
 */
export function sanitizeAIOutput(raw: string): string {
    return escapeHTML(stripScriptTags(stripHTML(raw)).trim().slice(0, 50000))
}

// ── 3. Zod Schemas for All API Endpoints ──────────────────────────────────────

/** Common field schemas */
const userId = z.string().uuid('Invalid user ID format')
const gameType = z.string().max(60).regex(/^[A-Z0-9_]+$/, 'Invalid game type format')
const gradeBand = z.enum(['KG2', '35', '68', '912', 'K2', '35', '68', '910', '1112'])
const difficulty = z.number().int().min(1).max(5)
const score = z.number().min(0).max(200000, 'Score exceeds maximum')
const accuracy = z.number().min(0).max(1.01)
const timeSpent = z.number().positive('Time must be positive').max(86400, 'Time too large')

/** /api/games/save-result (legacy path) */
export const SaveResultSchema = z.object({
    matchId: z.string().max(100).optional(),
    gameType,
    score,
    accuracy,
    timeSpent,
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'CHALLENGE']).optional(),
    reactionTime: z.number().min(0).max(600000).optional(),
    hintsUsed: z.number().int().min(0).max(100).optional(),
    storyContent: z.string().max(10000).optional(),
    skillAssessments: z.array(z.object({
        code: z.string().max(100),
        isCorrect: z.boolean(),
    })).max(200).optional(),
}).strict()  // reject unknown fields

/** /api/ai-games/generate */
export const AIGenerateSchema = z.object({
    subject: z.string().max(50).toLowerCase().optional().default('general'),
    topic: z.string().max(200).optional().default(''),
    gradeBand: z.string().max(10).optional().default('68'),
    difficulty: z.number().int().min(1).max(5).optional().default(3),
    questionType: z.enum(['mcq', 'numeric', 'essay', 'debate']).optional().default('mcq'),
}).strict()

/** /api/ai-games/evaluate-essay */
export const EvaluateEssaySchema = z.object({
    prompt: z.string().min(5).max(500),
    essay: z.string().min(10).max(5000),
    rubric: z.object({
        criteria: z.array(z.object({
            name: z.string().max(50),
            maxPoints: z.number().int().min(1).max(100),
        })).max(20),
    }).optional(),
    gradeBand: z.string().max(10).optional(),
}).strict()

/** /api/ai-games/evaluate-debate */
export const EvaluateDebateSchema = z.object({
    topic: z.string().min(5).max(500),
    side: z.enum(['for', 'against']).optional(),
    argument: z.string().min(10).max(3000),
    round: z.number().int().min(1).max(10).optional(),
}).strict()

/** /api/ai-games/research */
export const ResearchSchema = z.object({
    topic: z.string().max(200).optional(),
    action: z.enum(['start', 'message']),
    message: z.string().max(2000).optional(),
    history: z.array(z.object({
        role: z.enum(['user', 'ai']),
        text: z.string().max(2000),
    })).max(50).optional(),
}).strict()

/** /api/user/update-profile */
export const UpdateProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    avatar: z.string().url().max(500).optional(),
    gradeBand: gradeBand.optional(),
    language: z.string().max(10).optional(),
}).strict()

// ── 4. Safe Zod parse wrapper ──────────────────────────────────────────────────

export function safeParseAPI<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    try {
        assertSafePayload(data)
        if (data && typeof data === 'object') {
            sanitizeObject(data as Record<string, unknown>)
        }
        const result = schema.safeParse(data)
        if (!result.success) {
            const firstError = result.error.errors[0]
            return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` }
        }
        return { success: true, data: result.data }
    } catch (err) {
        return { success: false, error: (err as Error).message }
    }
}

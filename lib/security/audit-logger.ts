/**
 * lib/security/audit-logger.ts
 *
 * PHASE 10 — Security Audit Logging
 *
 * Structured security event logging via Pino-compatible JSON.
 * Each event has: traceId, timestamp, level, userId, ip, event, metadata.
 *
 * Security events tracked:
 * - Failed login attempts
 * - Rate limit violations
 * - Prompt injection attempts
 * - Suspicious XP patterns
 * - Admin privilege escalation
 * - Schema validation failures
 * - API errors > threshold
 */

import { randomUUID } from 'crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SecurityEventType =
    | 'auth.login_failed'
    | 'auth.login_success'
    | 'auth.session_expired'
    | 'ratelimit.triggered'
    | 'ratelimit.ban_activated'
    | 'input.prototype_pollution'
    | 'input.schema_violation'
    | 'input.xss_attempt'
    | 'ai.prompt_injection'
    | 'ai.toxicity_detected'
    | 'ai.cost_cap_hit'
    | 'game.suspicious_score'
    | 'game.xp_farming_detected'
    | 'game.replay_attack'
    | 'game.signature_invalid'
    | 'admin.privilege_escalation'
    | 'admin.data_export'
    | 'api.error_spike'
    | 'compliance.data_deletion'
    | 'compliance.data_export_request'

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SecurityEvent {
    traceId: string
    timestamp: string
    severity: SecuritySeverity
    event: SecurityEventType
    userId?: string
    schoolId?: string
    ip?: string
    path?: string
    metadata?: Record<string, unknown>
    message: string
}

// Recursive function to mask credentials, tokens, and PII from logs
function maskSensitive(data: any): any {
    if (!data) return data
    if (typeof data !== 'object') return data

    // Primitive array bypass
    if (Array.isArray(data)) return data.map(maskSensitive)

    const masked = { ...data }
    const SENSITIVE_KEYS = ['password', 'token', 'secret', 'email', 'apikey', 'key', 'auth']

    for (const key of Object.keys(masked)) {
        if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
            masked[key] = '[REDACTED_BY_SRE]'
        } else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitive(masked[key])
        }
    }
    return masked
}

// ── Severity map ──────────────────────────────────────────────────────────────

const EVENT_SEVERITY: Record<SecurityEventType, SecuritySeverity> = {
    'auth.login_failed': 'LOW',
    'auth.login_success': 'LOW',
    'auth.session_expired': 'LOW',
    'ratelimit.triggered': 'LOW',
    'ratelimit.ban_activated': 'HIGH',
    'input.prototype_pollution': 'CRITICAL',
    'input.schema_violation': 'MEDIUM',
    'input.xss_attempt': 'HIGH',
    'ai.prompt_injection': 'HIGH',
    'ai.toxicity_detected': 'MEDIUM',
    'ai.cost_cap_hit': 'MEDIUM',
    'game.suspicious_score': 'HIGH',
    'game.xp_farming_detected': 'HIGH',
    'game.replay_attack': 'HIGH',
    'game.signature_invalid': 'CRITICAL',
    'admin.privilege_escalation': 'CRITICAL',
    'admin.data_export': 'MEDIUM',
    'api.error_spike': 'MEDIUM',
    'compliance.data_deletion': 'MEDIUM',
    'compliance.data_export_request': 'LOW',
}

// ── Core logger ───────────────────────────────────────────────────────────────

function formatEvent(
    event: SecurityEventType,
    userId: string | undefined,
    schoolId: string | undefined,
    ip: string | undefined,
    path: string | undefined,
    metadata: Record<string, unknown> | undefined,
    message: string
): SecurityEvent {
    // If we're inside a request context with Next.js headers, we could extract X-Trace-Id.
    // For now we generate a fresh correlation UUID for the log event.
    return {
        traceId: randomUUID(),
        timestamp: new Date().toISOString(),
        severity: EVENT_SEVERITY[event] ?? 'LOW',
        event,
        userId,
        schoolId,
        ip,
        path,
        metadata: maskSensitive(metadata),
        message,
    }
}

/**
 * Log a security event to stdout (structured JSON for ingestion by Datadog/CloudWatch/Sentry).
 * In production, pipe this to your log aggregation platform.
 */
export function logSecurityEvent(
    event: SecurityEventType,
    message: string,
    context?: {
        userId?: string
        schoolId?: string
        ip?: string
        path?: string
        metadata?: Record<string, unknown>
    }
): SecurityEvent {
    const se = formatEvent(event, context?.userId, context?.schoolId, context?.ip, context?.path, context?.metadata, message)

    // Write structured JSON to stdout — ingested by Vercel/Railway/Docker log aggregator
    const output = JSON.stringify({
        level: se.severity === 'CRITICAL' ? 'error' : se.severity === 'HIGH' ? 'warn' : 'info',
        name: 'security',
        ...se,
    })

    if (se.severity === 'CRITICAL' || se.severity === 'HIGH') {
        console.error(output)
    } else {
        console.warn(output)
    }

    return se
}

// ── Convenience helpers ────────────────────────────────────────────────────────

export const securityLog = {
    loginFailed: (ip: string, path: string, reason?: string) =>
        logSecurityEvent('auth.login_failed', `Login failed: ${reason ?? 'credentials'}`, { ip, path }),

    rateLimitTriggered: (key: string, ip?: string, userId?: string) =>
        logSecurityEvent('ratelimit.triggered', `Rate limit hit: ${key}`, { ip, userId }),

    banActivated: (key: string, ip?: string, userId?: string) =>
        logSecurityEvent('ratelimit.ban_activated', `Progressive ban activated: ${key}`, { ip, userId }),

    promptInjection: (userId: string, ip?: string, prompt?: string) =>
        logSecurityEvent('ai.prompt_injection', 'Prompt injection attempt', {
            userId, ip, metadata: { promptSnippet: (prompt ?? '').slice(0, 100) }
        }),

    xssAttempt: (userId?: string, ip?: string, field?: string) =>
        logSecurityEvent('input.xss_attempt', `XSS attempt in field: ${field}`, { userId, ip }),

    prototypePollution: (userId?: string, ip?: string) =>
        logSecurityEvent('input.prototype_pollution', 'Prototype pollution attempt blocked', { userId, ip }),

    schemaViolation: (path: string, error: string, ip?: string) =>
        logSecurityEvent('input.schema_violation', `Schema validation failed: ${error}`, { ip, path }),

    suspiciousScore: (userId: string, gameType: string, score: number, timeSpent: number) =>
        logSecurityEvent('game.suspicious_score', `Suspicious score submission`, {
            userId, metadata: { gameType, score, timeSpent, pps: score / Math.max(timeSpent, 1) }
        }),

    replayBlocked: (userId: string, sessionId: string) =>
        logSecurityEvent('game.replay_attack', `Replay attack blocked`, {
            userId, metadata: { sessionId }
        }),

    signatureInvalid: (userId: string, sessionId: string) =>
        logSecurityEvent('game.signature_invalid', `Invalid submission signature`, {
            userId, metadata: { sessionId }
        }),

    aiCostCapHit: (userId: string, count: number) =>
        logSecurityEvent('ai.cost_cap_hit', `AI daily cap reached: ${count} requests`, {
            userId, metadata: { count }
        }),
}

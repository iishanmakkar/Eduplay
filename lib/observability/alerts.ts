/**
 * lib/observability/alerts.ts
 *
 * PHASE 5 — Incident Response Automation
 *
 * Tracks sliding windows of error events and triggers automated webhooks
 * (Slack/PagerDuty/OpsGenie) when enterprise thresholds are crossed.
 */

import { redis } from '@/lib/cache/redis'

// ── Configuration ───────────────────────────────────────────────────────────

const ALERT_THRESHOLDS = {
    // Alert if overall error rate exceeds 3% in a 5-minute window
    errorRateThreshold: 0.03,
    // Alert if AI failure spikes > 20 times in a 5-minute window
    aiFailureSpike: 20,
    // Alert if rate limit blocks trigger > 500 times in 5 minutes
    rateLimitSurge: 500,
    // Database timeout alert limit
    dbTimeouts: 5,
}

// 5 minute evaluation window
const WINDOW_MS = 5 * 60 * 1000
// Slack or PagerDuty Webhook (typically config via ENV)
const WEBHOOK_URL = process.env.INCIDENT_WEBHOOK_URL

// ── Types ───────────────────────────────────────────────────────────────────

export type AlertType = 'ERROR_SPIKE' | 'AI_FAILURES' | 'RATE_LIMIT_SURGE' | 'DB_TIMEOUTS'

export interface IncidentPayload {
    severity: 'WARNING' | 'CRITICAL' | 'FATAL'
    type: AlertType
    metricValue: number
    threshold: number
    windowMinutes: number
    timestamp: string
    traceContext?: string
}

// ── Core Tracker ────────────────────────────────────────────────────────────

/**
 * Records an incident metric event in Redis. 
 * Then triggers an async evaluation to check if an alert should fire.
 */
export async function recordIncidentMetric(type: AlertType, amount: number = 1): Promise<void> {
    const now = Date.now()
    const pipeline = redis.pipeline()
    const key = `incident_metric:${type}`

    // Slide window: remove old events, add this event
    pipeline.zremrangebyscore(key, '-inf', now - WINDOW_MS)
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` })

    // We don't wait for pipeline exec to evaluate, we do it out of band
    await pipeline.exec()

    // Schedule async evaluation (fire and forget)
    evaluateThresholds(type).catch(err => console.error('[Alerts] Eval failed', err))
}

/**
 * Tracks general HTTP requests vs 5xx errors to monitor global error rate.
 */
export async function recordHttpErrorRate(isError: boolean): Promise<void> {
    const now = Date.now()
    const reqKey = `http_total`
    const errKey = `http_errors`

    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(reqKey, '-inf', now - WINDOW_MS)
    pipeline.zremrangebyscore(errKey, '-inf', now - WINDOW_MS)

    pipeline.zadd(reqKey, { score: now, member: `${now}-${Math.random()}` })
    if (isError) {
        pipeline.zadd(errKey, { score: now, member: `${now}-${Math.random()}` })
    }
    await pipeline.exec()

    if (isError) {
        evaluateErrorRate().catch(console.error)
    }
}

// ── Evaluators ──────────────────────────────────────────────────────────────

async function evaluateThresholds(type: AlertType): Promise<void> {
    const now = Date.now()
    const key = `incident_metric:${type}`
    const count = await redis.zcount(key, now - WINDOW_MS, now)

    let threshold = 0
    let severity: 'WARNING' | 'CRITICAL' | 'FATAL' = 'WARNING'

    switch (type) {
        case 'AI_FAILURES': threshold = ALERT_THRESHOLDS.aiFailureSpike; severity = 'CRITICAL'; break
        case 'RATE_LIMIT_SURGE': threshold = ALERT_THRESHOLDS.rateLimitSurge; severity = 'WARNING'; break
        case 'DB_TIMEOUTS': threshold = ALERT_THRESHOLDS.dbTimeouts; severity = 'FATAL'; break
    }

    if (count >= threshold) {
        await fireAlert({
            severity,
            type,
            metricValue: count,
            threshold,
            windowMinutes: 5,
            timestamp: new Date().toISOString()
        })
    }
}

async function evaluateErrorRate(): Promise<void> {
    const now = Date.now()
    const reqKey = `http_total`
    const errKey = `http_errors`

    const [reqCount, errCount] = await Promise.all([
        redis.zcount(reqKey, now - WINDOW_MS, now),
        redis.zcount(errKey, now - WINDOW_MS, now)
    ])

    if (reqCount < 100) return // Ignore low traffic periods

    const rate = errCount / reqCount
    if (rate >= ALERT_THRESHOLDS.errorRateThreshold) {
        await fireAlert({
            severity: 'CRITICAL',
            type: 'ERROR_SPIKE',
            metricValue: rate,
            threshold: ALERT_THRESHOLDS.errorRateThreshold,
            windowMinutes: 5,
            timestamp: new Date().toISOString()
        })
    }
}

// ── Webhook Publisher ───────────────────────────────────────────────────────

/**
 * Fires the alert to external systems. Debounced by Redis to prevent webhook spam.
 */
async function fireAlert(payload: IncidentPayload): Promise<void> {
    const debounceKey = `alert_sent:${payload.type}`
    const wasSent = await redis.get(debounceKey)
    if (wasSent) return // Already alerted in the last window

    // Lock for 5 minutes
    await redis.set(debounceKey, 'sent', { ex: 300 })

    console.error(`🚨 [INCIDENT ALERT] ${payload.severity} - ${payload.type}`)
    console.error(JSON.stringify(payload, null, 2))

    if (WEBHOOK_URL && process.env.NODE_ENV === 'production') {
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 *${payload.severity} INCIDENT*: ${payload.type}\n> Metric: ${payload.metricValue} (Threshold: ${payload.threshold})\n> Window: ${payload.windowMinutes}m`,
                    payload
                })
            })
        } catch (err) {
            console.error('[Alerts] Webhook delivery failed', err)
        }
    }
}

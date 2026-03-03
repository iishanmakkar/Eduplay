import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/cache/redis'

/**
 * Platform Health Check
 * GET /api/health
 *
 * Returns 200 OK with subsystem statuses when healthy.
 * Returns 503 if any critical subsystem is down.
 *
 * Used by: BetterStack / UptimeRobot / Vercel uptime monitoring
 * Latency target: < 500ms (this is NOT a hot path)
 */
export async function GET() {
    const start = Date.now()
    const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

    // ── Postgres check ────────────────────────────────────────────────────────
    try {
        const dbStart = Date.now()
        await prisma.$queryRaw`SELECT 1`
        checks.postgres = { ok: true, latencyMs: Date.now() - dbStart }
    } catch (err: any) {
        checks.postgres = { ok: false, error: err?.message ?? 'Unknown DB error' }
    }

    // ── Redis check ────────────────────────────────────────────────────────────
    try {
        const redisStart = Date.now()
        await (redis as any).ping()
        checks.redis = { ok: true, latencyMs: Date.now() - redisStart }
    } catch (err: any) {
        checks.redis = { ok: false, error: err?.message ?? 'Unknown Redis error' }
    }

    // ── Build info ────────────────────────────────────────────────────────────
    const buildInfo = {
        version: process.env.npm_package_version ?? '0.0.0',
        nodeVersion: process.version,
        env: process.env.NODE_ENV ?? 'development',
        region: process.env.VERCEL_REGION ?? process.env.RAILWAY_REGION ?? 'local',
    }

    const allOk = Object.values(checks).every(c => c.ok)
    const totalLatencyMs = Date.now() - start

    const body = {
        status: allOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        totalLatencyMs,
        checks,
        build: buildInfo,
    }

    return NextResponse.json(body, {
        status: allOk ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
        },
    })
}

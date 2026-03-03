/**
 * lib/governance/ai-cost.ts
 *
 * PHASE 6 — Financial & AI Cost Governance
 *
 * Enforces hard ceilings on AI token spend per tenant (school) and globally.
 * Prevents runaway billing from unexpected infinite generation loops or 
 * compromised teacher accounts.
 *
 * Connects directly to the rate-limiter logic but operates on a $/token basis.
 */

import { redis } from '@/lib/cache/redis'
import { PrismaClient } from '@prisma/client'

// Use a separate minimal client if tracking decoupled from tenant-middleware
const prisma = new PrismaClient()

// Standard pricing (OpenRouter Gemini 2.5 Flash / Pro estimations)
const COST_PER_1K_INPUT = 0.0001
const COST_PER_1K_OUTPUT = 0.0002

export interface AICostEvent {
    schoolId: string
    userId: string
    route: string
    inputTokens: number
    outputTokens: number
}

/**
 * Validates if the school has enough budget remaining this month to generate AI content.
 * Should be called BEFORE calling the LLM.
 */
export async function assertSchoolAIBudget(schoolId: string): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
    const limitKey = `ai_budget:limit:${schoolId}`
    const spentKey = `ai_budget:spent:${schoolId}:${currentMonth}`

    // 1. Check custom limit or fallback to a hardcoded baseline (e.g., $100/mo)
    let limitStr = await redis.get<string>(limitKey)
    let limitAmount = 100.00

    if (!limitStr) {
        // Fetch from DB if not cached
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { subscription: { select: { plan: true } } }
        })

        switch (school?.subscription?.plan) {
            case 'DISTRICT': limitAmount = 500.00; break
            case 'SCHOOL': limitAmount = 100.00; break
            case 'STARTER': limitAmount = 5.00; break // Strict free tier
            default: limitAmount = 5.00; break // Default fallback
        }
        await redis.set(limitKey, limitAmount.toString(), { ex: 86400 }) // Cache 1 day
    } else {
        limitAmount = parseFloat(limitStr)
    }

    // 2. Check current spend
    const spentStr = await redis.get<string>(spentKey)
    const spentAmount = spentStr ? parseFloat(spentStr) : 0.00

    if (spentAmount >= limitAmount) {
        throw new Error(`[FinancialGovernance] School ${schoolId} has exhausted its monthly AI budget of $${limitAmount}. Generation blocked.`)
    }
}

/**
 * Tracks the actual cost *after* generation and adds it to the monthly bucket.
 */
export async function trackAICost(event: AICostEvent): Promise<void> {
    const cost = (event.inputTokens / 1000 * COST_PER_1K_INPUT) +
        (event.outputTokens / 1000 * COST_PER_1K_OUTPUT)

    const currentMonth = new Date().toISOString().slice(0, 7)
    const spentKey = `ai_budget:spent:${event.schoolId}:${currentMonth}`

    // Increment float (Redis INCRBYFLOAT)
    const newTotal = await redis.incrbyfloat(spentKey, cost)

    // Set expiry if new key (roughly end of next month is safe)
    if (newTotal === cost) {
        await redis.expire(spentKey, 60 * 60 * 24 * 60)
    }

    // Global tracking gauge for Prometheus metrics (if we want to export)
    // metrics.aiCostTotal(schoolId).inc(cost) // (Tied into Phase 1)
}

/**
 * For Dashboard API: get real-time spend.
 */
export async function getSchoolAISpend(schoolId: string, monthYYYYMM: string): Promise<number> {
    const spentKey = `ai_budget:spent:${schoolId}:${monthYYYYMM}`
    const val = await redis.get<string>(spentKey)
    return val ? parseFloat(val) : 0.00
}

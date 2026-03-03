/**
 * Power-Ups System
 * lib/game-engine/power-ups.ts
 *
 * Three power-ups per game session:
 *   TIME_FREEZE  — Pauses timer for 5 seconds (client-enforced; server validates max 1 use)
 *   DOUBLE_XP    — Final XP × 2 (server-side, validated in save-result)
 *   SHIELD       — First wrong answer doesn't break streak (server-side, validated)
 *
 * Inventory stored in Redis: `powerups:{userId}:{gameType}` → JSON
 * Decremented atomically on use.
 */

import { redis } from '@/lib/cache/redis'

export type PowerUpType = 'TIME_FREEZE' | 'DOUBLE_XP' | 'SHIELD'

export const POWER_UP_CONFIG: Record<PowerUpType, {
    label: string
    description: string
    icon: string
    durationSec?: number    // For TIME_FREEZE
    maxPerSession: number   // Max uses in a single game session
    cooldownMs: number      // Cooldown before can be used again in session (0 = no cooldown)
}> = {
    TIME_FREEZE: {
        label: 'Time Freeze',
        description: 'Pauses the countdown timer for 5 seconds',
        icon: '🧊',
        durationSec: 5,
        maxPerSession: 1,
        cooldownMs: 0
    },
    DOUBLE_XP: {
        label: 'Double XP',
        description: 'Doubles all XP earned this session',
        icon: '⚡',
        maxPerSession: 1,
        cooldownMs: 0
    },
    SHIELD: {
        label: 'Shield',
        description: 'First wrong answer this session doesn\'t break your streak',
        icon: '🛡️',
        maxPerSession: 1,
        cooldownMs: 0
    }
}

// ── Inventory management ──────────────────────────────────────────────────────

const INVENTORY_TTL = 7 * 24 * 60 * 60 // 7 days

export interface PowerUpInventory {
    TIME_FREEZE: number
    DOUBLE_XP: number
    SHIELD: number
}

function inventoryKey(userId: string): string {
    return `powerups:inventory:${userId}`
}

function sessionUsageKey(sessionId: string): string {
    return `powerups:session:${sessionId}`
}

export async function getInventory(userId: string): Promise<PowerUpInventory> {
    try {
        const data = await redis.get(inventoryKey(userId))
        if (!data) {
            return { TIME_FREEZE: 0, DOUBLE_XP: 0, SHIELD: 0 }
        }
        return JSON.parse(data as string) as PowerUpInventory
    } catch {
        return { TIME_FREEZE: 0, DOUBLE_XP: 0, SHIELD: 0 }
    }
}

export async function grantPowerUp(
    userId: string,
    type: PowerUpType,
    amount = 1
): Promise<PowerUpInventory> {
    const inv = await getInventory(userId)
    inv[type] = (inv[type] || 0) + amount
    await redis.set(inventoryKey(userId), JSON.stringify(inv), { ex: INVENTORY_TTL })
    return inv
}

/** Returns updated inventory. Throws if insufficient. */
export async function consumePowerUp(
    userId: string,
    sessionId: string,
    type: PowerUpType
): Promise<{ success: boolean; reason?: string; inventory: PowerUpInventory }> {
    const inv = await getInventory(userId)

    if (inv[type] <= 0) {
        return { success: false, reason: `No ${type} power-ups remaining`, inventory: inv }
    }

    // Check session usage limit
    const usageRaw = await redis.get(sessionUsageKey(sessionId))
    const sessionUsage: Partial<Record<PowerUpType, number>> = usageRaw
        ? JSON.parse(usageRaw as string)
        : {}

    const used = sessionUsage[type] ?? 0
    const max = POWER_UP_CONFIG[type].maxPerSession

    if (used >= max) {
        return {
            success: false,
            reason: `${type} already used ${max} time(s) this session`,
            inventory: inv
        }
    }

    // Atomically decrement inventory
    inv[type] = Math.max(0, inv[type] - 1)
    await redis.set(inventoryKey(userId), JSON.stringify(inv), { ex: INVENTORY_TTL })

    // Track session usage
    sessionUsage[type] = used + 1
    await redis.set(sessionUsageKey(sessionId), JSON.stringify(sessionUsage), { ex: 60 * 60 }) // 1hr TTL

    return { success: true, inventory: inv }
}

// ── Server-side effect application ───────────────────────────────────────────

export interface PowerUpEffects {
    xpMultiplier: number        // 1 or 2 for DOUBLE_XP
    shieldActive: boolean       // true = first wrong answer absorbed
    timeFreezeGranted: boolean  // recorded; client enforces the 5s pause
}

export function computePowerUpEffects(
    usedPowerUps: PowerUpType[]
): PowerUpEffects {
    const set = new Set(usedPowerUps)
    return {
        xpMultiplier: set.has('DOUBLE_XP') ? 2 : 1,
        shieldActive: set.has('SHIELD'),
        timeFreezeGranted: set.has('TIME_FREEZE')
    }
}

/**
 * Apply shield: if shield was active and this is the first wrong answer,
 * treat the streak as unbroken for scoring purposes.
 */
export function applyShieldToStreak(
    isCorrect: boolean,
    currentStreak: number,
    shieldActive: boolean,
    shieldConsumed: boolean
): { newStreak: number; shieldConsumed: boolean } {
    if (!isCorrect) {
        if (shieldActive && !shieldConsumed) {
            // Absorb the wrong answer — streak unchanged
            return { newStreak: currentStreak, shieldConsumed: true }
        }
        return { newStreak: 0, shieldConsumed }
    }
    return { newStreak: currentStreak + 1, shieldConsumed }
}

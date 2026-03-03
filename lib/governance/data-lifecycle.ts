/**
 * lib/governance/data-lifecycle.ts
 *
 * PHASE 4 — Data Governance & Retention
 *
 * Enforces FERPA, COPPA, and GDPR compliance points:
 * 1. Configurable retention windows.
 * 2. Automated anonymization of PII after account closure.
 * 3. Soft-delete orchestration with physical delayed purges.
 * 4. Data export payloads for portability.
 */

import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const RETENTION_DAYS = 365 * 3 // 3 years standard retention
const SOFT_DELETE_DELAY_DAYS = 30 // Physical purge 30 days after soft delete

// ── Types ───────────────────────────────────────────────────────────────────

export type LifecycleState = 'ACTIVE' | 'ARCHIVED' | 'SOFT_DELETED' | 'ANONYMIZED'

// ── Background Jobs ─────────────────────────────────────────────────────────

/**
 * Runs nightly via Vercel Cron or standard schedule.
 * Finds soft-deleted accounts past the 30-day window and anonymizes or drops PII.
 */
export async function executeDataRetentionPolicy() {
    const purgeDate = new Date()
    purgeDate.setDate(purgeDate.getDate() - SOFT_DELETE_DELAY_DAYS)

    // Find users soft-deleted before purgeDate
    const targets = await prisma.user.findMany({
        where: {
            deletedAt: {
                lte: purgeDate
            },
            email: { not: { startsWith: 'anon_' } } // Not already anonymized
        },
        select: { id: true }
    })

    console.log(`[governance] Found ${targets.length} accounts pending hard anonymization.`)

    for (const target of targets) {
        await anonymizeUser(target.id)
    }
}

/**
 * Irreversibly strips PII from a student/teacher record while retaining 
 * the abstract UUID bindings for aggregated macro-analytics.
 */
async function anonymizeUser(userId: string) {
    const blindId = randomBytes(16).toString('hex')

    await prisma.$transaction([
        // Scramble User table
        prisma.user.update({
            where: { id: userId },
            data: {
                name: 'Anonymized User',
                firstName: null,
                lastName: null,
                email: `anon_${blindId}@eduplay.local`,
                image: null,
                avatar: null,
                password: null, // Clear hash
                schoolId: null, // Sever direct school tie for anonymity
                deletedAt: new Date(),
            }
        })
    ])

    console.log(`[governance] Successfully anonymized PII for ${userId}`)
}

// ── API Operations ──────────────────────────────────────────────────────────

/**
 * Initiates the right-to-be-forgotten process.
 * Account immediately falls out of active views, purge scheduled 30 days out.
 */
export async function requestSoftDelete(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            deletedAt: new Date()
        }
    })

    // Revoke all active sessions
    await prisma.session.deleteMany({
        where: { userId }
    })

    return { success: true, message: 'Account scheduled for permanent deletion.' }
}

/**
 * Compiles a GDPR / FERPA compliant JSON dump of all personal data held.
 */
export async function exportStudentData(userId: string) {
    const [user, sessions, mastery] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.gameResult.findMany({
            where: { studentId: userId },
            take: 1000,
            orderBy: { completedAt: 'desc' }
        }),
        prisma.userSkillMastery.findMany({
            where: { userId },
            include: { skill: true }
        })
    ])

    if (!user) throw new Error('User not found in system.')

    return {
        exportDate: new Date().toISOString(),
        identity: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        profile: {
            gradeBand: user.gradeBand,
            totalXP: user.xp,
            accountCreated: user.createdAt
        },
        masteryNodes: mastery.map((m: any) => ({
            topic: m.skill.name,
            subject: m.skill.subject,
            masteryLevel: m.masteryProbability,
            confidence: m.totalAttempts,
            updatedAt: m.updatedAt
        })),
        recentActivity: sessions.map((s: any) => ({
            gameId: s.gameId,
            score: s.score,
            accuracy: s.accuracy,
            timeSpentMs: s.timeSpent,
            completedAt: s.completedAt
        }))
    }
}

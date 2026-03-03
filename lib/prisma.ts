/**
 * Prisma Singleton — Enterprise-Grade Configuration
 *
 * Pooling Strategy (100K user scale):
 * - Production uses DATABASE_POOL_URL (Neon serverless pooler, transaction mode)
 *   This prevents connection exhaustion at 35k+ DAU (Neon default limit: 100 connections).
 *   Set DATABASE_POOL_URL to your Neon pooled connection string:
 *   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?pgbouncer=true&connection_limit=10
 *
 * - DATABASE_READONLY_URL: optional Neon read replica for analytics queries (Phase 5).
 *   Offloads GROUP BY / aggregation queries from the primary write node.
 *
 * - Dev: uses DATABASE_URL directly (no pool needed at low connection count).
 * - HMR guard: global singleton prevents new clients being created on every hot reload.
 */
import { PrismaClient } from '@prisma/client'

/** Maximum simultaneous connections this instance should hold in production. */
export const MAX_DB_CONNECTIONS = 10

/** Alert threshold — emit a WARN when connection usage exceeds this fraction. */
export const DB_CONNECTION_WARN_THRESHOLD = 0.7

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    prismaReadonly: PrismaClient | undefined
    prismaReadIndia: PrismaClient | undefined
}

function buildDatasourceUrl(): string | undefined {
    if (process.env.NODE_ENV !== 'production') return undefined // use schema default

    // Prefer the Neon pooled URL in production (pgbouncer transaction mode)
    const poolUrl = process.env.DATABASE_POOL_URL
    if (poolUrl) return poolUrl

    // Fallback: append pgbouncer params to the direct URL if no pool URL is set
    const directUrl = process.env.DATABASE_URL
    if (directUrl && !directUrl.includes('pgbouncer=true')) {
        const sep = directUrl.includes('?') ? '&' : '?'
        return `${directUrl}${sep}pgbouncer=true&connection_limit=${MAX_DB_CONNECTIONS}`
    }
    return directUrl
}

function createPrismaClient(datasourceUrl?: string): PrismaClient {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        errorFormat: 'minimal',
        datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    })
}

/** Primary client — uses pooled connection in production. */
export const prisma: PrismaClient =
    globalForPrisma.prisma ?? createPrismaClient(buildDatasourceUrl())

/**
 * Read-only client — routes analytics & reporting queries to Neon read replica.
 * Falls back to the primary client if DATABASE_READONLY_URL is not configured.
 * Usage: import { prismaReadonly } from '@/lib/prisma'
 */
export const prismaReadonly: PrismaClient =
    globalForPrisma.prismaReadonly ??
    (process.env.DATABASE_READONLY_URL
        ? createPrismaClient(process.env.DATABASE_READONLY_URL)
        : prisma)

/**
 * Read-only client tailored for the ap-south-1 replica (India).
 */
export const prismaReadIndia: PrismaClient =
    globalForPrisma.prismaReadIndia ??
    (process.env.DATABASE_READONLY_IN_URL
        ? createPrismaClient(process.env.DATABASE_READONLY_IN_URL)
        : prismaReadonly)

/**
 * Returns the appropriate read replica given a country code.
 * Falls back to the US read replica if no specialized replica exists for the region.
 */
export function getRegionalReadClient(region: string): PrismaClient {
    if (region === 'IN') return prismaReadIndia
    return prismaReadonly
}

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
    globalForPrisma.prismaReadonly = prismaReadonly
    globalForPrisma.prismaReadIndia = prismaReadIndia
}

/**
 * Exponential-backoff connect with retry.
 * Call this before the first query in cold-start scenarios (cron jobs, health checks).
 */
export async function connectWithRetry(maxRetries = 3): Promise<void> {
    let attempt = 0
    const delays = [500, 1000, 2000]
    while (attempt < maxRetries) {
        try {
            await prisma.$connect()
            return
        } catch (err) {
            attempt++
            if (attempt >= maxRetries) {
                console.error(`[prisma] Failed to connect after ${maxRetries} attempts:`, err)
                throw err
            }
            const delay = delays[attempt - 1] ?? 2000
            console.warn(`[prisma] Connection attempt ${attempt} failed; retrying in ${delay}ms...`)
            await new Promise((r) => setTimeout(r, delay))
        }
    }
}

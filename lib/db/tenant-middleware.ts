/**
 * lib/db/tenant-middleware.ts
 *
 * PHASE 3 — Multi-Tenant Isolation
 *
 * Enforces strict logical isolation for Enterprise B2B SaaS (schools).
 * Uses AsyncLocalStorage to hold the current school context during a request.
 * The Prisma extension intercepts all queries and automatically appends 
 * `{ schoolId: currentTenantSpace }` to where/data clauses.
 */

import { AsyncLocalStorage } from 'async_hooks'

// ── Tenant Context ────────────────────────────────────────────────────────

interface TenantContext {
    schoolId: string
    userId: string
    role: string
    // Special flag allowing admins to query across all tenants (e.g. for global metrics)
    isSystemBypass?: boolean
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>()

/**
 * Helper to run a block of code within a specific tenant context.
 */
export function runWithTenant<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    return tenantStorage.run(context, fn)
}

/**
 * Retrieve the current tenant safely. Throws if context is missing 
 * to prevent accidental cross-tenant bleeds.
 */
export function requireTenant(): TenantContext {
    const ctx = tenantStorage.getStore()
    if (!ctx) {
        throw new Error('FATAL: Database query attempted outside of a secure multi-tenant context.')
    }
    return ctx
}

// ── Prisma Extension ──────────────────────────────────────────────────────

// The models in schema.prisma that belong to a specific school tenant
const TENANT_MODELS = [
    'StudentProfile',
    'TeacherProfile',
    'Classroom',
    'GameSession',
    'SkillMastery',
    'Assignment',
]

/**
 * Configure this in lib/prisma.ts:
 * export const prisma = new PrismaClient().$extends(tenantExtension)
 */
export const tenantExtension = {
    name: 'multi-tenant-isolation',
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }: any) {
                // If the model isn't tenant-bound, just pass through
                if (!TENANT_MODELS.includes(model)) {
                    return query(args)
                }

                // Retrieve context
                const ctx = tenantStorage.getStore()
                if (!ctx) {
                    throw new Error(`[Security] Attempted to query tenant model ${model} without active tenant context.`)
                }

                // If sysadmin explicitly requested bypass, pass through
                if (ctx.isSystemBypass && ctx.role === 'OWNER') {
                    return query(args)
                }

                const { schoolId } = ctx
                if (!schoolId) {
                    throw new Error(`[Security] Active context missing schoolId restriction for ${model}.`)
                }

                // ── Route operations into strict isolation ─────────────

                if (['findUnique', 'findUniqueOrThrow'].includes(operation)) {
                    // Turn unique queries into findFirst with tenant scope
                    args.where = { ...args.where, schoolId }
                    return query({ ...args, operation: operation === 'findUniqueOrThrow' ? 'findFirstOrThrow' : 'findFirst' })
                }

                if (['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                    // Inject into existing where clause
                    args.where = { ...args.where, schoolId }
                    return query(args)
                }

                if (['create', 'createMany'].includes(operation)) {
                    // Force inject schoolId into the data payload
                    if (Array.isArray(args.data)) {
                        args.data = args.data.map((d: any) => ({ ...d, schoolId }))
                    } else {
                        args.data = { ...args.data, schoolId }
                    }
                    return query(args)
                }

                if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                    // Enforce scope on the mutation target
                    args.where = { ...args.where, schoolId }
                    return query(args)
                }

                if (operation === 'upsert') {
                    // Scope both the target and the create payload
                    args.where = { ...args.where, schoolId }
                    args.create = { ...args.create, schoolId }
                    return query(args)
                }

                return query(args)
            }
        }
    }
}

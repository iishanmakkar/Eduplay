import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// API Key model (add to Prisma schema)
interface ApiKey {
    id: string
    key: string
    name: string
    userId: string
    permissions: string[]
    rateLimit: number
    isActive: boolean
    lastUsedAt: Date | null
    createdAt: Date
    expiresAt: Date | null
}

/**
 * Verify API key from request headers
 */
export async function verifyApiKey(request: NextRequest): Promise<{ valid: boolean; userId?: string; permissions?: string[] }> {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
        return { valid: false }
    }

    try {
        // Hash the API key for lookup
        const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')

        // Find API key in database
        const keyRecord = await (prisma as any).apiKey.findUnique({
            where: { key: hashedKey },
            include: { user: true }
        })

        if (!keyRecord || !keyRecord.isActive) {
            return { valid: false }
        }

        // Check expiration
        if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
            return { valid: false }
        }

        // Update last used timestamp
        await (prisma as any).apiKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() }
        })

        return {
            valid: true,
            userId: keyRecord.userId,
            permissions: keyRecord.permissions || []
        }
    } catch (error) {
        console.error('API key verification error:', error)
        return { valid: false }
    }
}

/**
 * Generate new API key
 */
export async function generateApiKey(
    userId: string,
    schoolId: string,
    name: string,
    permissions: string[] = ['read'],
    expiresInDays?: number
): Promise<{ key: string; hashedKey: string }> {
    // Generate random API key
    const key = `epk_${crypto.randomBytes(32).toString('hex')}`
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex')

    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null

    await (prisma as any).apiKey.create({
        data: {
            key: hashedKey,
            name,
            userId,
            schoolId,
            permissions,
            rateLimit: 1000, // requests per hour
            isActive: true,
            expiresAt
        }
    })

    return { key, hashedKey }
}

/**
 * API Response helper
 */
export function apiResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status })
}

/**
 * API Error helper
 */
export function apiError(message: string, status: number = 400, code?: string) {
    return NextResponse.json({
        error: {
            message,
            code: code || `ERROR_${status}`,
            timestamp: new Date().toISOString()
        }
    }, { status })
}

/**
 * Pagination helper
 */
export function parsePagination(request: NextRequest) {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    return { page, limit, skip }
}

/**
 * Filtering helper
 */
export function parseFilters(request: NextRequest, allowedFields: string[]) {
    const url = new URL(request.url)
    const filters: any = {}

    allowedFields.forEach(field => {
        const value = url.searchParams.get(field)
        if (value) {
            filters[field] = value
        }
    })

    return filters
}

/**
 * Sorting helper
 */
export function parseSorting(request: NextRequest, allowedFields: string[], defaultField: string = 'createdAt') {
    const url = new URL(request.url)
    const sortBy = url.searchParams.get('sortBy') || defaultField
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    if (!allowedFields.includes(sortBy)) {
        return { [defaultField]: sortOrder }
    }

    return { [sortBy]: sortOrder }
}

/**
 * Check API permission
 */
export function hasPermission(permissions: string[], required: string): boolean {
    return permissions.includes('admin') || permissions.includes(required)
}

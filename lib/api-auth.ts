import { prisma } from './prisma'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'

type AuthResult =
    | { valid: true; schoolId: string; userId: string; school: Prisma.SchoolGetPayload<{}>; permissions: string[] }
    | { valid: false; error: string; status: number }

export async function verifyApiKey(request: Request): Promise<AuthResult> {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
        return { valid: false, error: 'API key missing', status: 401 }
    }

    // Hash the API key for lookup
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')

    const keyRecord = await prisma.apiKey.findUnique({
        where: { key: hashedKey },
        include: {
            school: true,
            user: true
        }
    })

    if (!keyRecord || !keyRecord.isActive) {
        return { valid: false, error: 'Invalid or inactive API key', status: 403 }
    }

    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        return { valid: false, error: 'API key expired', status: 403 }
    }

    // Log usage (async)
    prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() }
    }).catch(console.error)

    return {
        valid: true,
        schoolId: keyRecord.schoolId,
        userId: keyRecord.userId,
        school: keyRecord.school,
        permissions: keyRecord.permissions || []
    }
}

export function apiError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status })
}

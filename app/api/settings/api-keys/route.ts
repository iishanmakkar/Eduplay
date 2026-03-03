import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateApiKey } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/settings/api-keys
 * List user's API keys
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const apiKeys = await (prisma as any).apiKey.findMany({
            where: {
                schoolId: session.user.schoolId
            },
            select: {
                id: true,
                name: true,
                key: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ apiKeys })

    } catch (error) {
        console.error('API keys fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }
}

/**
 * POST /api/settings/api-keys
 * Generate new API key
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, permissions = ['read'], expiresInDays } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Generate API key
        const { key } = await generateApiKey(
            session.user.id,
            session.user.schoolId,
            name,
            permissions,
            expiresInDays
        )

        return NextResponse.json({
            success: true,
            apiKey: key, // Only shown once!
            message: 'API key generated successfully. Save it securely - it will not be shown again.'
        }, { status: 201 })

    } catch (error) {
        console.error('API key generation error:', error)
        return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 })
    }
}

/**
 * DELETE /api/settings/api-keys/:id
 * Revoke API key
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const keyId = url.pathname.split('/').pop()

        if (!keyId) {
            return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
        }

        // Verify ownership
        const apiKey = await (prisma as any).apiKey.findFirst({
            where: {
                id: keyId,
                userId: session.user.id
            }
        })

        if (!apiKey) {
            return NextResponse.json({ error: 'API key not found' }, { status: 404 })
        }

        // Delete API key
        await (prisma as any).apiKey.delete({
            where: { id: keyId }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('API key deletion error:', error)
        return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }
}

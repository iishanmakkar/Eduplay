import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SCHOOL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await prisma.apiKey.findMany({
        where: { schoolId: session.user.schoolId, isActive: true },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(keys)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SCHOOL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    // Generate a secure API key
    const rawKey = crypto.randomBytes(32).toString('hex')
    const apiKey = `ep_${rawKey}`
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex')

    const newKey = await prisma.apiKey.create({
        data: {
            key: hashedKey,
            name: name,
            userId: session.user.id,
            schoolId: session.user.schoolId,
            permissions: ['READ_STATS', 'READ_STUDENTS']
        }
    })

    // Return the raw key ONLY once
    return NextResponse.json({ ...newKey, key: apiKey })
}

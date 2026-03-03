import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllFlags, setFlag, resetFlag, FeatureFlag } from '@/lib/feature-flags'

/**
 * Feature Flag Kill Switch Admin API
 * OWNER only — emergency toggle for any platform feature
 * 
 * GET  /api/admin/feature-flags        → list all flags
 * POST /api/admin/feature-flags        → set a flag { flag, value }
 * DELETE /api/admin/feature-flags?flag → reset flag to default
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const flags = await getAllFlags()
    return NextResponse.json({ flags })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { flag, value } = await req.json()

    if (typeof flag !== 'string' || typeof value !== 'boolean') {
        return NextResponse.json({ error: 'Bad request: { flag: string, value: boolean }' }, { status: 400 })
    }

    try {
        await setFlag(flag as FeatureFlag, value)
        return NextResponse.json({ success: true, flag, value, updatedAt: new Date().toISOString() })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const flag = req.nextUrl.searchParams.get('flag')
    if (!flag) return NextResponse.json({ error: 'flag query param required' }, { status: 400 })

    await resetFlag(flag as FeatureFlag)
    return NextResponse.json({ success: true, flag, resetToDefault: true })
}

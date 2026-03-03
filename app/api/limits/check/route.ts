import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkLimit } from '@/lib/limits/check'

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get('type') as 'students' | 'teachers' | 'classes'

    if (!type || !['students', 'teachers', 'classes'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    try {
        const result = await checkLimit(session.user.schoolId, type)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to check limit' }, { status: 500 })
    }
}

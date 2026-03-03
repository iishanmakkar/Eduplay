
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setSystemSetting, getSystemSettings } from '@/lib/system-settings'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'OWNER') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const settings = await getSystemSettings()
    return NextResponse.json(settings)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'OWNER') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { key, value } = await req.json()
        if (!key || typeof value !== 'string') {
            return new NextResponse('Invalid request', { status: 400 })
        }

        const setting = await setSystemSetting(key, value, session.user.id)
        return NextResponse.json(setting)
    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPersonalizedDailyChallenge } from '@/lib/challenges/bkt-challenge-mapper'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Get user timezone (fallback to request IP hint or America/New_York)
        const timezone = req.headers.get('x-timezone') || 'America/New_York'

        // Calculate what 'today' is in the user's timezone
        const now = new Date()
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })

        // Parts will be [month, day, year] for en-US
        const parts = dateFormatter.formatToParts(now)
        const year = parts.find(p => p.type === 'year')?.value
        const month = parts.find(p => p.type === 'month')?.value
        const day = parts.find(p => p.type === 'day')?.value

        // Construct a UTC midnight date matching their local date
        const localDateAtUtcMidnight = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

        let challenge;
        if (session?.user?.id) {
            challenge = await getPersonalizedDailyChallenge(session.user.id, localDateAtUtcMidnight)
        } else {
            const { getDailyChallenge } = await import('@/lib/challenges/generator')
            challenge = await getDailyChallenge(localDateAtUtcMidnight)
        }

        let isCompleted = false
        let completionDetails = null

        // If user is logged in, check completion status
        if (session?.user?.id) {
            const completion = await prisma.challengeCompletion.findUnique({
                where: {
                    userId_challengeId: {
                        userId: session.user.id,
                        challengeId: challenge.id
                    }
                }
            })

            if (completion) {
                isCompleted = true
                completionDetails = completion
            }
        }

        return NextResponse.json({
            challenge,
            isCompleted,
            completionDetails
        })
    } catch (error) {
        console.error('Failed to get daily challenge:', error)
        return NextResponse.json(
            { error: 'Failed to fetch daily challenge' },
            { status: 500 }
        )
    }
}

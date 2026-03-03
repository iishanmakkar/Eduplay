import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'
import { createCronLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createCronLogger('daily-challenge')
    log.start()

    try {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        const existing = await prisma.dailyChallenge.findUnique({ where: { date: today } })
        if (existing) {
            log.success({ skipped: true, reason: 'challenge_already_exists' })
            return NextResponse.json({ message: 'Challenge already exists for today', challenge: existing })
        }

        const gameTypes: GameType[] = ['SPEED_MATH', 'SCIENCE_QUIZ', 'WORLD_FLAGS', 'MEMORY_MATCH']
        const difficulties = ['EASY', 'MEDIUM', 'HARD']
        const bonusXPByDifficulty = { EASY: 50, MEDIUM: 100, HARD: 200 }
        const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
        )
        const gameType = gameTypes[dayOfYear % gameTypes.length]
        const difficulty = difficulties[dayOfYear % difficulties.length]
        const descriptions: Record<string, string> = {
            SPEED_MATH: `Solve 10 math problems in under 2 minutes!`,
            SCIENCE_QUIZ: `Answer 10 science questions with 80%+ accuracy`,
            WORLD_FLAGS: `Identify 10 country flags correctly`,
            MEMORY_MATCH: `Complete memory match in under 90 seconds`,
        }

        const challenge = await prisma.dailyChallenge.create({
            data: {
                date: today,
                gameType,
                difficulty,
                bonusXP: bonusXPByDifficulty[difficulty as keyof typeof bonusXPByDifficulty],
                description: descriptions[gameType],
            },
        })

        log.success({ challengeId: challenge.id, gameType, difficulty })
        return NextResponse.json({ message: 'Daily challenge generated', challenge })
    } catch (error) {
        log.error(error)
        return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 })
    }
}

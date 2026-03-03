import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GamificationEngine } from '@/lib/gamification/engine'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { id, gameType, mode, participants, duration } = body

        const session = await getServerSession(authOptions)
        const region = req.headers.get('x-region') || 'GLOBAL'

        // SECURITY: Require authentication — unauthenticated users cannot earn XP
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // SECURITY: Only STUDENT and INDEPENDENT can play games
        const allowedRoles = ['STUDENT', 'INDEPENDENT']
        if (!allowedRoles.includes(session.user.role as string)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (id) {
            const existing = await prisma.multiplayerMatch.findUnique({
                where: { id }
            })
            if (existing) {
                return NextResponse.json({ success: true, matchId: existing.id, idempotent: true })
            }
        }

        // 2. Data Validation
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return NextResponse.json({ success: false, error: 'Invalid participants' }, { status: 400 })
        }

        // 3. Security Limits & Logic Validation
        const MAX_SCORE = 200000
        const MAX_PPS = 500 // Points Per Second
        const cleanDuration = Math.max(1, duration || 60)

        const sanitizedParticipants = participants.map((p: any) => {
            let score = Math.max(0, parseInt(p.score) || 0)
            let accuracy = Math.min(1, Math.max(0, parseFloat(p.accuracy) || 0))
            if (score > MAX_SCORE) score = MAX_SCORE
            if (score / cleanDuration > MAX_PPS) score = Math.floor(cleanDuration * MAX_PPS)

            return {
                name: p.name || 'Unknown',
                avatar: p.avatar,
                side: p.side,
                score,
                accuracy,
                teamName: p.teamName,
                isWinner: false
            }
        })

        // 4. Validate Winner Logic (Server Authority)
        const maxScore = Math.max(...sanitizedParticipants.map(p => p.score))
        sanitizedParticipants.forEach(p => {
            p.isWinner = p.score === maxScore && p.score > 0
        })

        // 5. Gamification (XP/Levels)
        let gamificationResult = null
        if (session?.user?.id) {
            // Find which participant is the logged-in user
            // In local multiplayer, we assume the first participant matching the session name (or just the first if single-device)
            // But usually, only the account holder gets XP. 
            // For now, let's look for a participant with the same name as the session user or fallback to participant[0]
            const userParticipant = sanitizedParticipants.find(p => p.name === session.user.name) || sanitizedParticipants[0]

            if (userParticipant && session.user.id) {
                gamificationResult = await GamificationEngine.processResult(session.user.id, {
                    gameType,
                    score: userParticipant.score,
                    accuracy: userParticipant.accuracy,
                    timeSpent: cleanDuration
                })
            }
        }

        // Create the match
        const match = await prisma.multiplayerMatch.create({
            data: {
                id: id || undefined,
                gameType,
                mode,
                duration: duration || null,
                schoolRegion: region,
                participants: {
                    create: sanitizedParticipants.map(p => ({
                        name: p.name,
                        avatar: p.avatar,
                        side: p.side,
                        score: p.score,
                        accuracy: p.accuracy,
                        isWinner: p.isWinner,
                        teamName: p.teamName
                    }))
                }
            }
        })

        return NextResponse.json({
            success: true,
            matchId: match.id,
            gamification: gamificationResult
        })
    } catch (error) {
        console.error('Failed to save multiplayer match:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

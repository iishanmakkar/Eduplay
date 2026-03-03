import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, apiResponse, apiError, parsePagination } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/analytics/overview
 * Get overview analytics for the teacher
 */
export async function GET(request: NextRequest) {
    const auth = await verifyApiKey(request)
    if (!auth.valid || !auth.userId) {
        return apiError('Invalid API key', 401, 'UNAUTHORIZED')
    }

    try {
        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate')
            ? new Date(url.searchParams.get('startDate')!)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        const endDate = url.searchParams.get('endDate')
            ? new Date(url.searchParams.get('endDate')!)
            : new Date()

        // Get teacher's classes
        const classes = await prisma.class.findMany({
            where: {
                teacherId: auth.userId
            },
            include: {
                students: {
                    include: {
                        student: true
                    }
                }
            }
        })

        const studentIds = classes.flatMap(c => c.students.map(s => s.studentId))

        // Get game results in date range
        const gameResults = await prisma.gameResult.findMany({
            where: {
                studentId: { in: studentIds },
                completedAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        // Calculate metrics
        const totalStudents = studentIds.length
        const activeStudents = new Set(gameResults.map(r => r.studentId)).size
        const totalGamesPlayed = gameResults.length
        const totalXPEarned = gameResults.reduce((sum, r) => sum + r.xpEarned, 0)
        const avgAccuracy = gameResults.length > 0
            ? (gameResults.reduce((sum, r) => sum + r.accuracy, 0) / gameResults.length) * 100
            : 0

        // Games by type
        const gamesByType = gameResults.reduce((acc: any, result) => {
            acc[result.gameType] = (acc[result.gameType] || 0) + 1
            return acc
        }, {})

        // Daily activity
        const dailyActivity = gameResults.reduce((acc: any, result) => {
            const date = result.completedAt.toISOString().split('T')[0]
            if (!acc[date]) {
                acc[date] = { date, games: 0, students: new Set() }
            }
            acc[date].games++
            acc[date].students.add(result.studentId)
            return acc
        }, {})

        const dailyActivityArray = Object.values(dailyActivity).map((day: any) => ({
            date: day.date,
            games: day.games,
            activeStudents: day.students.size
        }))

        return apiResponse({
            data: {
                overview: {
                    totalStudents,
                    activeStudents,
                    engagementRate: totalStudents > 0
                        ? Math.round((activeStudents / totalStudents) * 100)
                        : 0,
                    totalGamesPlayed,
                    totalXPEarned,
                    avgAccuracy: Math.round(avgAccuracy * 100) / 100
                },
                gamesByType,
                dailyActivity: dailyActivityArray.sort((a, b) => a.date.localeCompare(b.date)),
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            }
        })

    } catch (error: any) {
        console.error('API error:', error)
        return apiError('Internal server error', 500, 'INTERNAL_ERROR')
    }
}

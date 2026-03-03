import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock GamificationEngine and getServerSession
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(() => Promise.resolve({
        user: { id: 'test-user-id', role: 'STUDENT', name: 'Test User' }
    }))
}))

jest.mock('@/lib/gamification/engine', () => ({
    GamificationEngine: {
        processResult: jest.fn(() => Promise.resolve({ xpEarned: 150, currentStreak: 1, levelUp: false }))
    }
}))

// Mock Next.js Request and Response
jest.mock('next/server', () => {
    return {
        NextResponse: {
            json: jest.fn((body, init) => ({
                status: init?.status || 200,
                json: () => Promise.resolve(body)
            }))
        }
    }
})

// Mock Prisma
jest.mock('@/lib/prisma', () => {
    let mockMatches: any[] = []

    return {
        prisma: {
            multiplayerMatch: {
                findUnique: jest.fn(({ where }) => {
                    const found = mockMatches.find(m => m.id === where.id)
                    return Promise.resolve(found || null)
                }),
                create: jest.fn((args) => {
                    const newMatch = {
                        id: args.data.id || `match-${Date.now()}`,
                        ...args.data
                    }
                    mockMatches.push(newMatch)
                    return Promise.resolve(newMatch)
                })
            },
            // Reset helper for tests
            _reset: () => { mockMatches = [] }
        }
    }
})

// Import the route handler after mocks
import { POST } from '@/app/api/multiplayer/match/route'

describe('Multiplayer Dedup Validation', () => {
    beforeEach(() => {
        (prisma as any)._reset()
        jest.clearAllMocks()
    })

    const createMockRequest = (body: any) => {
        return {
            json: () => Promise.resolve(body),
            headers: {
                get: (key: string) => key === 'x-region' ? 'GLOBAL' : null
            }
        } as unknown as Request
    }

    it('should generate a new match ID on first request and save participants', async () => {
        const payload = {
            id: 'match-1234',
            gameType: 'SPEED_MATH',
            mode: '1v1',
            duration: 60,
            participants: [
                { name: 'Test User', score: 1000, accuracy: 0.9, side: 'left' },
                { name: 'Opponent', score: 500, accuracy: 0.5, side: 'right' }
            ]
        }

        const req = createMockRequest(payload)
        const res = await POST(req)
        const data = await res.json()

        expect(data.success).toBe(true)
        expect(data.matchId).toBe('match-1234')
        expect(prisma.multiplayerMatch.create).toHaveBeenCalledTimes(1)
    })

    it('should act idempotently when the same match ID is submitted twice', async () => {
        const payload = {
            id: 'match-duplicate',
            gameType: 'WORLD_FLAGS',
            mode: '1v1',
            duration: 60,
            participants: [
                { name: 'Test User', score: 2000, accuracy: 1.0, side: 'left' },
                { name: 'Opponent', score: 1500, accuracy: 0.8, side: 'right' }
            ]
        }

        // 1. First submission
        const req1 = createMockRequest(payload)
        const res1 = await POST(req1)
        const data1 = await res1.json()

        expect(data1.success).toBe(true)
        expect(prisma.multiplayerMatch.create).toHaveBeenCalledTimes(1)

        // 2. Duplicate submission
        const req2 = createMockRequest(payload)
        const res2 = await POST(req2)
        const data2 = await res2.json()

        // 3. Validation: The second request should return the idempotent flag and NOT call create again
        expect(data2.success).toBe(true)
        expect(data2.idempotent).toBe(true)
        expect(data2.matchId).toBe('match-duplicate')
        expect(prisma.multiplayerMatch.create).toHaveBeenCalledTimes(1) // Still 1! Deduplicated.
    })
})

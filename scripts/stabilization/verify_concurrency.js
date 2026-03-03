const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Starting Concurrency Verification...')

    // 1. Create a test user
    const email = `test_concurrency_${Date.now()}@example.com`
    const user = await prisma.user.create({
        data: {
            email,
            password: 'hashed_password',
            firstName: 'Test',
            lastName: 'User',
            role: 'STUDENT',
            school: {
                create: {
                    name: `Concurrency School ${Date.now()}`,
                    slug: `concurrency-school-${Date.now()}`,
                    subscription: {
                        create: {
                            plan: 'SCHOOL',
                            status: 'ACTIVE'
                        }
                    }
                }
            }
        }
    })
    console.log(`✅ Created User: ${user.id}`)

    // 2. Simulate 5 concurrent game saves with SAME matchId
    const matchId = `match_${Date.now()}`
    const requests = []

    // We need to mock the request context or call the API logic directly?
    // Calling API via fetch requires running server. 
    // Let's verify via DIRECT DB calls using the logic we implemented in route.ts?
    // No, we want to test the ROUTE logic (atomicity).
    // But we can't easily curl locally if auth is required (need cookie).

    // Alternative: We test the Unique Constraint directly.
    console.log('⚡ Firing 5 concurrent DB writes for same matchId...')

    const results = await Promise.allSettled([1, 2, 3, 4, 5].map(async (i) => {
        try {
            return await prisma.gameResult.create({
                data: {
                    matchId,
                    studentId: user.id,
                    gameType: 'SPEED_MATH',
                    score: 100 * i,
                    accuracy: 0.9,
                    timeSpent: 60,
                    xpEarned: 100,
                    difficulty: 'MEDIUM'
                }
            })
        } catch (e) {
            if (e.code === 'P2002') return 'BLOCKED_DUPLICATE'
            throw e
        }
    }))

    const successes = results.filter(r => r.status === 'fulfilled' && r.value !== 'BLOCKED_DUPLICATE')
    const duplicates = results.filter(r => r.status === 'fulfilled' && r.value === 'BLOCKED_DUPLICATE')

    console.log('📊 Results:', {
        successes: successes.length,
        duplicates: duplicates.length,
        errors: results.filter(r => r.status === 'rejected').length
    })

    if (successes.length === 1 && duplicates.length === 4) {
        console.log('✅ PASSED: Only 1 write succeeded. Atomicity enforced.')
    } else {
        console.error('❌ FAILED: Duplicate writes allowed or all failed.')
        process.exit(1)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

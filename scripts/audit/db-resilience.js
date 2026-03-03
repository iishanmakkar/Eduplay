const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDBStressTest() {
    console.log('🐘 Starting Database Resilience Test...');

    const CONCURRENCY = 20;
    const OPERATIONS = 100;
    let errors = 0;

    // 1. Connection Pool Stress
    console.log(`--- Spawning ${CONCURRENCY} simultaneous read queries ---`);
    try {
        const promises = Array(CONCURRENCY).fill(0).map(() =>
            prisma.school.findFirst({ select: { id: true } })
        );
        await Promise.all(promises);
        console.log('✅ Connection pool handled concurrent reads.');
    } catch (e) {
        console.error('❌ Connection pool fail:', e.message);
        errors++;
    }

    // 2. Transaction Integrity (Simulate Gameplay XP update)
    console.log(`--- Simulating ${OPERATIONS} atomic XP updates ---`);
    const mockUserId = 'audit-test-user-' + Math.random().toString(36).substring(7);

    try {
        // Setup mock user
        const school = await prisma.school.findFirst();
        if (!school) {
            console.log('⚠️ No school found, skipping user write test.');
            return;
        }

        const user = await prisma.user.create({
            data: {
                email: `${mockUserId}@test.com`,
                password: 'hashed-password',
                firstName: 'Test',
                lastName: 'User',
                role: 'STUDENT',
                schoolId: school.id
            }
        });

        // Hammer updates
        const updatePromises = Array(OPERATIONS).fill(0).map((_, i) =>
            prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: { xp: { increment: 10 } }
                }),
                prisma.gameResult.create({
                    data: {
                        studentId: user.id,
                        gameType: 'SPEED_MATH',
                        score: 100,
                        accuracy: 1.0,
                        timeSpent: 10,
                        xpEarned: 10
                    }
                })
            ])
        );

        await Promise.all(updatePromises);

        // Verify Result
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        const expectedXP = OPERATIONS * 10;

        if (updatedUser.xp === expectedXP) {
            console.log(`✅ Atomic updates verified. XP: ${updatedUser.xp} matches expected.`);
        } else {
            console.error(`❌ Race condition detected! Expected ${expectedXP}, got ${updatedUser.xp}`);
            errors += 5;
        }

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });

    } catch (e) {
        console.error('❌ Transaction test failed:', e.message);
        errors++;
    }

    const score = Math.max(0, 100 - (errors * 20));
    console.log(`Database Stability Score: ${score}`);
}

runDBStressTest()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

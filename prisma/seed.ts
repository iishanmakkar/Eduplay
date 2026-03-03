import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
    console.log('🌱 Starting database seed...')

    // Create demo school
    const school = await prisma.school.upsert({
        where: { id: 'demo-school-1' },
        update: {},
        create: {
            id: 'demo-school-1',
            name: 'Riverside Primary School',
            domain: 'riverside.edu',
            slug: 'riverside-primary',
        },
    })

    console.log('✅ Created school:', school.name)

    // Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@riverside.edu' },
        update: {},
        create: {
            email: 'admin@riverside.edu',
            password: hashedPassword,
            firstName: 'Laura',
            lastName: 'Patel',
            role: 'SCHOOL',
            schoolId: school.id,
        },
    })

    console.log('✅ Created admin:', admin.email)

    // Create teacher user
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@riverside.edu' },
        update: {},
        create: {
            email: 'teacher@riverside.edu',
            password: hashedPassword,
            firstName: 'Sarah',
            lastName: 'Johnson',
            role: 'TEACHER',
            schoolId: school.id,
        },
    })

    console.log('✅ Created teacher:', teacher.email)

    // Create student user
    const student = await prisma.user.upsert({
        where: { email: 'student@riverside.edu' },
        update: {},
        create: {
            email: 'student@riverside.edu',
            password: hashedPassword,
            firstName: 'Alex',
            lastName: 'Kim',
            role: 'STUDENT',
            schoolId: school.id,
        },
    })

    console.log('✅ Created student:', student.email)

    // Create demo class
    const demoClass = await prisma.class.upsert({
        where: { classCode: 'DEMO4B' },
        update: {},
        create: {
            name: 'Class 4B',
            grade: '4',
            subject: 'MATH',
            emoji: '📐',
            classCode: 'DEMO4B',
            schoolId: school.id,
            teacherId: teacher.id,
        },
    })

    console.log('✅ Created class:', demoClass.name)

    // Enroll student in class
    await prisma.classStudent.upsert({
        where: {
            classId_studentId: {
                classId: demoClass.id,
                studentId: student.id,
            },
        },
        update: {},
        create: {
            classId: demoClass.id,
            studentId: student.id,
        },
    })

    console.log('✅ Enrolled student in class')

    // Create subscription
    await prisma.subscription.upsert({
        where: { schoolId: school.id },
        update: {},
        create: {
            schoolId: school.id,
            plan: 'SCHOOL',
            status: 'ACTIVE',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
    })

    console.log('✅ Created subscription')

    // Create demo assignment
    const assignment = await prisma.assignment.create({
        data: {
            title: 'Speed Math Practice',
            description: 'Complete 10 rounds of speed math',
            gameType: 'SPEED_MATH',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            classId: demoClass.id,
            teacherId: teacher.id,
        },
    })

    console.log('✅ Created assignment:', assignment.title)

    // Create demo game results
    await prisma.gameResult.create({
        data: {
            gameType: 'SPEED_MATH',
            score: 850,
            accuracy: 0.85,
            timeSpent: 120,
            xpEarned: 95,
            studentId: student.id,
            assignmentId: assignment.id,
        },
    })

    console.log('✅ Created game result')

    // Create streak data
    await prisma.streak.create({
        data: {
            studentId: student.id,
            currentStreak: 12,
            longestStreak: 15,
            lastPlayedAt: new Date(),
        },
    })

    console.log('✅ Created streak data')

    // Create badges
    const badges = [
        { name: 'First Win', description: 'Complete your first game', icon: '🏆' },
        { name: 'Speed Demon', description: 'Complete a game in under 60 seconds', icon: '⚡' },
        { name: 'Perfect Score', description: 'Get 100% accuracy', icon: '💯' },
    ]

    for (const badge of badges) {
        await prisma.badge.create({
            data: {
                ...badge,
                studentId: student.id,
            },
        })
    }

    console.log('✅ Created badges')

    // Create achievements for the system
    const achievements = [
        {
            name: 'WEEK_WARRIOR',
            description: 'Complete 7 daily challenges',
            icon: '🔥',
            xpReward: 100,
            rarity: 'RARE',
            category: 'STREAK',
            condition: { type: 'daily_challenges', value: 7 },
        },
        {
            name: 'MONTH_MASTER',
            description: 'Complete 30 daily challenges',
            icon: '👑',
            xpReward: 500,
            rarity: 'EPIC',
            category: 'STREAK',
            condition: { type: 'daily_challenges', value: 30 },
        },
        {
            name: 'CENTURY_CHAMPION',
            description: 'Complete 100 daily challenges',
            icon: '💎',
            xpReward: 2000,
            rarity: 'LEGENDARY',
            category: 'STREAK',
            condition: { type: 'daily_challenges', value: 100 },
        },
        {
            name: 'PERFECT_SCORE',
            description: 'Get 100% accuracy in any game',
            icon: '💯',
            xpReward: 50,
            rarity: 'COMMON',
            category: 'PERFORMANCE',
            condition: { type: 'accuracy', value: 100 },
        },
        {
            name: 'SPEED_DEMON',
            description: 'Complete a game in under 30 seconds',
            icon: '⚡',
            xpReward: 150,
            rarity: 'RARE',
            category: 'PERFORMANCE',
            condition: { type: 'time', value: 30 },
        },
    ]

    for (const achievement of achievements) {
        await prisma.achievement.upsert({
            where: { name: achievement.name },
            update: {},
            create: achievement,
        })
    }

    console.log('✅ Created achievements')

    console.log('🎉 Seed completed successfully!')
    console.log('\n📝 Demo credentials:')
    console.log('Admin: admin@riverside.edu / password123')
    console.log('Teacher: teacher@riverside.edu / password123')
    console.log('Student: student@riverside.edu / password123')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })

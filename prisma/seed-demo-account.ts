import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
    console.log('🎭 Creating demo account with sample data...\n')

    // Create demo school first (required for users)
    const demoSchool = await prisma.school.upsert({
        where: { domain: 'demo.eduplay.com' },
        update: {},
        create: {
            name: 'EduPlay Demo School',
            domain: 'demo.eduplay.com',
            slug: 'eduplay-demo',
        }
    })
    console.log('✅ Created/Found demo school:', demoSchool.name)

    // Create demo teacher
    const demoTeacher = await prisma.user.upsert({
        where: { email: 'demo@eduplay.com' },
        update: {},
        create: {
            email: 'demo@eduplay.com',
            firstName: 'Demo',
            lastName: 'Teacher',
            password: '$2a$10$YourHashedPasswordHere', // hashed 'password'
            role: 'TEACHER',
            schoolId: demoSchool.id
        }
    })
    console.log('✅ Created demo teacher:', demoTeacher.email)

    // Create demo class
    const demoClass = await prisma.class.upsert({
        where: { id: 'demo-class-001' },
        update: {},
        create: {
            id: 'demo-class-001',
            name: 'Grade 5A - Demo Class',
            teacherId: demoTeacher.id,
            grade: '5',
            subject: 'MATH',
            schoolId: demoSchool.id,
            classCode: 'DEMO123'
        }
    })
    console.log('✅ Created demo class:', demoClass.name)

    // Create 10 demo students
    const studentNames = [
        ['Alice', 'Johnson'], ['Bob', 'Smith'], ['Charlie', 'Brown'], ['Diana', 'Prince'],
        ['Ethan', 'Hunt'], ['Fiona', 'Green'], ['George', 'Wilson'], ['Hannah', 'Lee'],
        ['Isaac', 'Newton'], ['Julia', 'Roberts']
    ]

    const demoStudents = []
    for (let i = 0; i < studentNames.length; i++) {
        const email = `student${i + 1}@demo.eduplay.com`
        const [firstName, lastName] = studentNames[i]
        const student = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                firstName,
                lastName,
                password: '$2a$10$YourHashedPasswordHere',
                role: 'STUDENT',
                schoolId: demoSchool.id
            }
        })

        // Add student to class
        await prisma.classStudent.upsert({
            where: {
                classId_studentId: {
                    classId: demoClass.id,
                    studentId: student.id
                }
            },
            update: {},
            create: {
                classId: demoClass.id,
                studentId: student.id
            }
        })

        demoStudents.push(student)
    }
    console.log(`✅ Created ${demoStudents.length} demo students`)

    // Create sample game results for each student
    const gameTypes = [
        'SPEED_MATH', 'SCIENCE_QUIZ', 'WORLD_FLAGS', 'MEMORY_MATCH',
        'CODE_BREAKER', 'MATH_GRID', 'VISUAL_ROTATION', 'LOGIC_PUZZLE'
    ]

    let totalResults = 0
    for (const student of demoStudents) {
        const numGames = Math.floor(Math.random() * 20) + 10 // 10-30 games per student

        for (let i = 0; i < numGames; i++) {
            const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)]
            const accuracy = 0.5 + Math.random() * 0.5 // 50-100% accuracy
            const score = Math.floor(accuracy * 1000)
            const xpEarned = Math.floor(score / 10)

            await prisma.gameResult.create({
                data: {
                    studentId: student.id,
                    gameType: gameType as any,
                    score,
                    accuracy,
                    timeSpent: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
                    xpEarned,
                    difficulty: ['EASY', 'MEDIUM', 'HARD'][Math.floor(Math.random() * 3)] as any,
                    completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            })
            totalResults++
        }
    }
    console.log(`✅ Created ${totalResults} game results`)

    // Create sample achievements
    const achievements = [
        {
            name: 'First Steps',
            description: 'Complete your first game',
            icon: '🎯',
            xpReward: 100,
            rarity: 'COMMON' as any,
            category: 'GENERAL' as any,
            condition: { type: 'GAMES_PLAYED', value: 1 }
        },
        {
            name: 'Math Wizard',
            description: 'Score 90%+ on 10 math games',
            icon: '🧙‍♂️',
            xpReward: 500,
            rarity: 'RARE' as any,
            category: 'SKILL' as any,
            condition: { type: 'GAME_ACCURACY', gameType: 'SPEED_MATH', value: 0.9, count: 10 }
        },
        {
            name: 'Brain Champion',
            description: 'Complete all brain games',
            icon: '🧠',
            xpReward: 1000,
            rarity: 'LEGENDARY' as any,
            category: 'COMPLETION' as any,
            condition: { type: 'ALL_GAMES_PLAYED' }
        }
    ]

    for (const ach of achievements) {
        await prisma.achievement.upsert({
            where: { name: ach.name },
            update: {},
            create: ach
        })
    }
    console.log(`✅ Created ${achievements.length} achievements`)

    // Award some achievements to students
    const firstStepsAch = await prisma.achievement.findUnique({
        where: { name: 'First Steps' }
    })

    if (firstStepsAch) {
        for (const student of demoStudents.slice(0, 5)) {
            await prisma.userAchievement.upsert({
                where: {
                    userId_achievementId: {
                        userId: student.id,
                        achievementId: firstStepsAch.id
                    }
                },
                update: {},
                create: {
                    userId: student.id,
                    achievementId: firstStepsAch.id
                }
            })
        }
        console.log('✅ Awarded achievements to demo students')
    }

    // Create sample assignment
    const assignment = await prisma.assignment.create({
        data: {
            title: 'Weekly Math Challenge',
            description: 'Complete 5 Speed Math games with 80%+ accuracy',
            classId: demoClass.id,
            teacherId: demoTeacher.id,
            gameType: 'SPEED_MATH',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }
    })
    console.log('✅ Created sample assignment:', assignment.title)

    console.log('\n🎉 Demo account setup complete!')
    console.log('\n📧 Login credentials:')
    console.log('   Email: demo@eduplay.com')
    console.log('   Password: (use magic link or set up password)')
    console.log('\n🎓 Demo class has 10 students with realistic game data')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })

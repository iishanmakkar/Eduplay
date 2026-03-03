const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Curriculum Standards...')

    // 1. Math Standards
    const mathStandard3 = await prisma.standard.upsert({
        where: { code: 'CCSS.MATH.CONTENT.3.OA.A.1' },
        update: {},
        create: {
            code: 'CCSS.MATH.CONTENT.3.OA.A.1',
            description: 'Interpret products of whole numbers, e.g., interpret 5 × 7 as the total number of objects in 5 groups of 7 objects each.',
            subject: 'MATH',
            grade: '3',
            country: 'US'
        }
    })

    const mathStandard6 = await prisma.standard.upsert({
        where: { code: 'CCSS.MATH.CONTENT.6.NS.B.2' },
        update: {},
        create: {
            code: 'CCSS.MATH.CONTENT.6.NS.B.2',
            description: 'Fluently divide multi-digit numbers using the standard algorithm.',
            subject: 'MATH',
            grade: '6',
            country: 'US'
        }
    })

    const mathStandardCBSE = await prisma.standard.upsert({
        where: { code: 'CBSE.MATH.CLASS3.1.2' },
        update: {},
        create: {
            code: 'CBSE.MATH.CLASS3.1.2',
            description: 'Multiplication by 1-digit and 2-digit numbers',
            subject: 'MATH',
            grade: '3',
            country: 'IN'
        }
    })

    // 2. Science Standards
    const sciStandard4 = await prisma.standard.upsert({
        where: { code: 'NGSS.4-ESS1-1' },
        update: {},
        create: {
            code: 'NGSS.4-ESS1-1',
            description: 'Identify evidence from patterns in rock formations and fossils in rock layers to support an explanation for changes in a landscape over time.',
            subject: 'SCIENCE',
            grade: '4',
            country: 'US'
        }
    })

    // 3. Question Templates mapped to standards
    console.log('Seeding Question Templates...')

    await prisma.questionTemplate.create({
        data: {
            gameType: 'SPEED_MATH',
            difficulty: 'MEDIUM',
            parameters: {
                operation: '×',
                rangeA: [2, 9],
                rangeB: [2, 9],
                templateStr: '{a} × {b} = ?'
            },
            standardId: mathStandard3.id
        }
    })

    await prisma.questionTemplate.create({
        data: {
            gameType: 'SPEED_MATH',
            difficulty: 'HARD',
            parameters: {
                operation: '÷',
                rangeA: [100, 999],
                rangeB: [2, 9],
                templateStr: '{a} ÷ {b} = ?'
            },
            standardId: mathStandard6.id
        }
    })

    await prisma.questionTemplate.create({
        data: {
            gameType: 'SCIENCE_QUIZ',
            difficulty: 'MEDIUM',
            parameters: {
                topic: 'Earth Science',
                subtopic: 'Fossils and Rock Layers'
            },
            standardId: sciStandard4.id
        }
    })

    console.log('Finished seeding curriculum data.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

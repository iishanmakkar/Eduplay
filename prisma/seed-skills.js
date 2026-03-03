const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding AI Micro-Skills...')

    // 1. Math Skills
    const add1 = await prisma.skillNode.upsert({
        where: { code: 'MATH.ADD.1DIGIT' },
        update: {},
        create: {
            code: 'MATH.ADD.1DIGIT',
            name: 'Single Digit Addition',
            description: 'Add two single digit numbers',
            subject: 'MATH',
            grade: 'K2'
        }
    })

    const sub1 = await prisma.skillNode.upsert({
        where: { code: 'MATH.SUB.1DIGIT' },
        update: {},
        create: {
            code: 'MATH.SUB.1DIGIT',
            name: 'Single Digit Subtraction',
            description: 'Subtract two single digit numbers',
            subject: 'MATH',
            grade: 'K2'
        }
    })

    const mult1 = await prisma.skillNode.upsert({
        where: { code: 'MATH.MULT.1DIGIT' },
        update: {},
        create: {
            code: 'MATH.MULT.1DIGIT',
            name: 'Single Digit Multiplication',
            description: 'Multiply two single digit numbers',
            subject: 'MATH',
            grade: '35',
            prerequisites: {
                connect: [{ id: add1.id }]
            }
        }
    })

    // 2. Science Skills
    const sci1 = await prisma.skillNode.upsert({
        where: { code: 'SCI.ROCK.FOSSILS' },
        update: {},
        create: {
            code: 'SCI.ROCK.FOSSILS',
            name: 'Rock Fossils',
            description: 'Identify patterns in rock formations and fossils',
            subject: 'SCIENCE',
            grade: '35'
        }
    })

    console.log('Finished seeding skill nodes.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const users = await p.user.findMany({
    where: { email: 'ishanmakkar651@gmail.com' },
    select: { id: true, email: true, role: true, schoolId: true, password: true }
})
console.log(JSON.stringify(users, null, 2))
await p.$disconnect()

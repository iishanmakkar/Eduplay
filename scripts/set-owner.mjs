import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const updated = await p.user.update({
    where: { email: 'ishanmakkar651@gmail.com' },
    data: { role: 'OWNER' },
    select: { id: true, email: true, role: true }
})
console.log('Updated:', JSON.stringify(updated, null, 2))
await p.$disconnect()

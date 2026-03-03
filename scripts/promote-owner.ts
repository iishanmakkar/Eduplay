import { UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'

async function main() {
    const email = 'ishanmakkar651@gmail.com'
    console.log(`Promoting ${email} to OWNER...`)

    const user = await prisma.user.update({
        where: { email },
        data: { role: UserRole.OWNER }
    })

    console.log('Success:', user)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })

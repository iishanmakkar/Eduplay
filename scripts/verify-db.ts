import { prisma } from '../lib/prisma'

async function main() {
    try {
        console.log('🔄 Attempting to connect to the database...')
        console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? '***' : 'NOT SET')

        // Simple query to wake up the connection and verify access
        const userCount = await prisma.user.count()
        console.log(`✅ Connection Successful! Found ${userCount} users.`)

        // Also check school count just to be sure
        const schoolCount = await prisma.school.count()
        console.log(`✅ Schema Access Verified! Found ${schoolCount} schools.`)

    } catch (error) {
        console.error('❌ Connection Failed:', error)
        console.log('\nSuggested Fixes:')
        console.log('1. Ensure your .env file has DATABASE_URL set.')
        console.log('2. Ensure "npx prisma migrate deploy" has been run.')
        console.log('3. Ensure your IP is allowed in Neon dashboard.')
    }
}

main()

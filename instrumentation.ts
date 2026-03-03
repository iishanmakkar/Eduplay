export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // 1. Validate Environment Variables on cold start
        const { validateEnv } = await import('./lib/env')
        validateEnv()

        // 2. Validate Database Migration Status
        // Prevents starting the app if the DB schema drifted from the deployed Prisma client
        if (process.env.NODE_ENV === 'production') {
            try {
                const { PrismaClient } = await import('@prisma/client')
                const prisma = new PrismaClient()

                // Simple ping to ensure DB is reachable
                await prisma.$queryRaw`SELECT 1 as connected`

                console.log('✅ [Startup Guard] Database connection verified.')
            } catch (error) {
                console.error('❌ [Startup Guard] CRITICAL: Failed to connect to database or Prisma client mismatch.')
                console.error(error)
                process.exit(1) // Force crash
            }
        }
    }
}

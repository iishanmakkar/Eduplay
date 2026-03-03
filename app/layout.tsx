import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-dm-sans',
    display: 'swap',
})

const syne = Syne({
    subsets: ['latin'],
    variable: '--font-syne',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'EduPlay - Gamified Learning Platform for Schools',
    description: 'Transform your classroom with competitive, collaborative educational games. Make students genuinely excited to learn.',
    keywords: ['education', 'edtech', 'gamification', 'learning', 'schools', 'teachers', 'students'],
}

import TrialBanner from '@/components/TrialBanner'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ThemeProvider } from '@/lib/theme-provider'
import { getMaintenanceMode } from '@/lib/system-settings'
import MaintenanceGuard from '@/components/MaintenanceGuard'
import { Providers } from '@/components/Providers'
import { ErrorBoundary } from '@/components/error-boundary'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'

// ... existing imports

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const locale = await getLocale()
    const messages = await getMessages()

    const session = await getServerSession(authOptions)
    let trialEndsAt = null
    let plan = null

    if (session?.user?.schoolId) {
        try {
            const school = await prisma.school.findUnique({
                where: { id: session.user.schoolId },
                include: { subscription: true }
            })
            if (school?.subscription) {
                if (school.subscription.trialStartedAt) {
                    const startDate = new Date(school.subscription.trialStartedAt)
                    trialEndsAt = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000)
                }
                plan = school.subscription.plan
            }
        } catch (err) {
            console.warn('[layout] DB unavailable — skipping trial banner:', (err as Error).message?.slice(0, 100))
            // Page still renders — just without trial banner
        }
    }


    // Check Maintenance Mode
    const isMaintenanceStart = await getMaintenanceMode()

    return (
        <html lang={locale} className={`${dmSans.variable} ${syne.variable}`} suppressHydrationWarning>
            <body>
                <NextIntlClientProvider messages={messages} locale={locale}>
                    <Providers>
                        <ThemeProvider defaultTheme="system">
                            <TrialBanner trialEndsAt={trialEndsAt?.toISOString() || undefined} plan={plan || undefined} />
                            <MaintenanceGuard active={isMaintenanceStart} userRole={session?.user?.role}>
                                <ErrorBoundary>
                                    {children}
                                </ErrorBoundary>
                            </MaintenanceGuard>
                            <Toaster
                                position="bottom-right"
                                toastOptions={{
                                    duration: 3000,
                                    style: {
                                        background: '#0D1117',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        padding: '12px 20px',
                                    },
                                }}
                            />
                        </ThemeProvider>
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}

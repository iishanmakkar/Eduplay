import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { theme } from '@/lib/theme'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { TwoFactorSettings } from '@/components/auth/TwoFactorSettings'

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/auth/signin')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            school: true
        }
    }) as any

    return (
        <div className={theme.page}>
            <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className={`text-sm font-bold ${theme.textSecondary} hover:${theme.textPrimary} transition`}
                    >
                        ← Back to Dashboard
                    </Link>
                    <div className={`font-display text-2xl font-bold ${theme.textPrimary}`}>
                        Settings
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className={theme.container + " max-w-4xl"}>
                <div className={theme.card + " p-8"}>
                    <h2 className={`text-xl font-display font-bold ${theme.textPrimary} mb-8`}>Profile Settings</h2>

                    <div className="space-y-6">
                        <div>
                            <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Full Name</label>
                            <div className={`text-lg font-bold ${theme.textPrimary}`}>
                                {user?.firstName} {user?.lastName}
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Email Address</label>
                            <div className={`text-lg font-bold ${theme.textPrimary}`}>
                                {user?.email}
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Role</label>
                            <div className="inline-block px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-black uppercase tracking-widest">
                                {user?.role}
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>School</label>
                            <div className={`text-lg font-bold ${theme.textPrimary}`}>
                                {user?.school?.name || 'No school assigned'}
                            </div>
                        </div>

                        <TwoFactorSettings enabled={user?.twoFactorEnabled || false} />

                        <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                            <p className={`text-sm ${theme.textSecondary} mb-8`}>
                                To update your profile or change your password, please contact your school administrator.
                            </p>
                            <Link
                                href="/api/auth/signout"
                                className="inline-block px-6 py-2 bg-rose-50 text-rose-600 font-semibold rounded-lg hover:bg-rose-100 transition"
                            >
                                Sign Out
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

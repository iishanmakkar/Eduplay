import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { theme } from '@/lib/theme'

export default async function OwnerSchoolsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'OWNER') {
        redirect('/auth/signin')
    }

    const schools = await prisma.school.findMany({
        where: { deletedAt: null },
        include: {
            subscription: true,
            _count: {
                select: {
                    users: true,
                    classes: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    })

    const statusColors: Record<string, string> = {
        ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        TRIALING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        PAST_DUE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        CANCELED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    }

    return (
        <div className={theme.page}>
            <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/owner" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                            ← Dashboard
                        </Link>
                        <div>
                            <h1 className={`text-2xl font-display font-bold ${theme.textPrimary}`}>
                                School Management
                            </h1>
                            <p className={theme.textSecondary}>{schools.length} schools provisioned</p>
                        </div>
                    </div>
                    {/* Provision new school form would be a modal/drawer in production */}
                    <Link href="/dashboard/owner/mrr" className={theme.buttonSecondary + ' px-4 py-2 text-sm'}>
                        MRR Analytics →
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Provision School CTA */}
                <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white">
                    <h2 className="text-xl font-bold mb-1">Provision a New School</h2>
                    <p className="text-emerald-50 text-sm mb-4">
                        Schools can only be created by the EduPlay team. Use the API to provision a new school with admin credentials.
                    </p>
                    <code className="block bg-black/20 rounded-lg p-3 text-sm font-mono text-emerald-100">
                        POST /api/school/provision
                    </code>
                </div>

                {/* Schools Table */}
                <div className={theme.card + ' p-6'}>
                    <h2 className={`text-xl font-display font-bold ${theme.textPrimary} mb-6`}>All Schools</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    {['School', 'Plan', 'Status', 'Users', 'Classes', 'Joined'].map(h => (
                                        <th key={h} className={`pb-4 font-bold ${theme.textSecondary} text-xs uppercase tracking-wider`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {schools.map((school) => (
                                    <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors">
                                        <td className="py-4">
                                            <div className={`font-bold ${theme.textPrimary}`}>{school.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{school.slug}</div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {school.subscription?.plan || 'NONE'}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusColors[school.subscription?.status || ''] || 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {school.subscription?.status || 'NO SUB'}
                                            </span>
                                        </td>
                                        <td className={`py-4 ${theme.textPrimary} font-medium`}>{school._count.users}</td>
                                        <td className={`py-4 ${theme.textPrimary} font-medium`}>{school._count.classes}</td>
                                        <td className={`py-4 ${theme.textSecondary} text-sm`}>
                                            {new Date(school.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {schools.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={`py-12 text-center ${theme.textSecondary}`}>
                                            No schools provisioned yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}

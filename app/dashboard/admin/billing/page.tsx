import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default async function BillingPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin')
    }

    const school = await prisma.school.findUnique({
        where: { id: session.user.schoolId },
        include: { subscription: true },
    })

    if (!school) {
        redirect('/auth/signin')
    }

    const plans = [
        {
            name: 'Starter',
            price: '$49',
            priceValue: 3999,
            period: '/month',
            features: [
                '2 classes',
                '60 students',
                'Core games',
                'Basic analytics',
                'Email support',
            ],
            plan: 'STARTER',
        },
        {
            name: 'School',
            price: '$199',
            priceValue: 15999,
            period: '/month',
            popular: true,
            features: [
                'Unlimited classes',
                'Unlimited students',
                'All games',
                'Advanced analytics',
                'PDF/CSV exports',
                'Teacher collaboration',
                'Priority support',
            ],
            plan: 'SCHOOL',
        },
        {
            name: 'District',
            price: '$599',
            priceValue: 47999,
            period: '/month',
            features: [
                'Everything in School',
                'Up to 10 schools',
                'District analytics',
                'Custom branding',
                'White-label option',
                'Dedicated support',
                'Early access to features',
            ],
            plan: 'DISTRICT',
        },
    ]

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/admin" className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition group flex items-center gap-2">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Dashboard
                        </Link>
                        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Subscription & Billing</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-sky-500/10 blur-3xl opacity-50 -z-10" />
                    <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white mb-4">
                        School Management & Billing
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                        Manage your school&apos;s growth and subscription status
                    </p>
                </div>

                {/* Current Subscription Card */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-10 mb-12 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Active Subscription</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">School Plan</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="text-emerald-500">✦</span> {school.subscription?.plan}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Status</div>
                            <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full animate-pulse ${school.subscription?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-2xl font-black text-slate-900 dark:text-white capitalize">{school.subscription?.status.toLowerCase()}</span>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Renewal Date</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">
                                {school.subscription?.currentPeriodEnd
                                    ? new Date(school.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border-2 transition-all duration-300 hover:shadow-2xl ${plan.popular
                                ? 'border-emerald-500 shadow-xl scale-105 z-10'
                                : 'border-slate-100 dark:border-slate-700 hover:border-emerald-500/50'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">
                                    Recommended
                                </div>
                            )}
                            <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-4">
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline gap-1 mb-10">
                                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{plan.price}</span>
                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{plan.period}</span>
                            </div>
                            <ul className="space-y-4 mb-12">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex font-bold text-sm text-slate-600 dark:text-slate-300">
                                        <span className="text-emerald-500 mr-3">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            {school.subscription?.plan === plan.plan ? (
                                <button
                                    disabled
                                    className="w-full py-5 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-sm uppercase tracking-widest cursor-not-allowed border border-slate-200 dark:border-slate-700"
                                >
                                    Current Tier
                                </button>
                            ) : (
                                <button className="w-full py-5 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-emerald-600 transition shadow-xl active:scale-95">
                                    Upgrade School
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Razorpay Managed Methods CTA */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 flex flex-col md:flex-row items-center justify-between gap-8 transition-colors">
                    <div>
                        <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-2">Payment Systems</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Manage invoices, tax details, and corporate cards securely via Razorpay.
                        </p>
                    </div>
                    <button className="w-full md:w-auto px-10 py-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:border-emerald-500 transition shadow-sm active:scale-95">
                        Open Billing Portal
                    </button>
                </div>
            </main>
        </div>
    )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { CheckIcon, CreditCard, History, Zap } from 'lucide-react'
import { theme } from '@/lib/theme'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface Subscription {
    id: string
    plan: 'STARTER' | 'SCHOOL' | 'DISTRICT'
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    transactions: Array<{
        id: string
        amount: number
        currency: string
        status: string
        createdAt: Date
        description: string | null
    }>
}

interface BillingClientProps {
    subscription: Subscription | null
    user: {
        firstName: string
    }
}

export default function BillingClient({ subscription, user }: BillingClientProps) {
    const [isCancelling, setIsCancelling] = useState(false)

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel? You will lose access to premium features at the end of your billing cycle.')) return

        setIsCancelling(true)
        try {
            const res = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
            })
            if (res.ok) {
                toast.success('Subscription cancelled successfully')
                window.location.reload()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to cancel subscription')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setIsCancelling(false)
        }
    }

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'STARTER': return 'bg-blue-100 text-blue-700'
            case 'SCHOOL': return 'bg-purple-100 text-purple-700'
            case 'DISTRICT': return 'bg-amber-100 text-amber-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition group flex items-center gap-2">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Dashboard
                        </Link>
                        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Billing & Subscription</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Plan Card */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />

                            <div className="flex items-start justify-between mb-10">
                                <div>
                                    <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Current Plan</h2>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${getPlanBadgeColor(subscription?.plan || 'Free')}`}>
                                            {subscription?.plan || 'FREE TRIAL'}
                                        </div>
                                        <span className="text-3xl font-display font-black text-slate-900 dark:text-white">
                                            {subscription?.status === 'ACTIVE' ? 'Active Subscription' : 'Trial Period'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                    {subscription?.plan === 'STARTER' ? '🌱' : subscription?.plan === 'SCHOOL' ? '🏫' : '🏛️'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Billing Period</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">
                                        {subscription?.currentPeriodEnd
                                            ? `Ends on ${format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Account Status</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white capitalize">
                                        {subscription?.status.toLowerCase().replace('_', ' ') || 'Inactive'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-100 dark:border-slate-700">
                                <Link
                                    href="/pricing"
                                    className="px-8 py-4 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-emerald-600 transition shadow-lg shadow-slate-900/10 dark:shadow-emerald-500/20 active:scale-95 transform"
                                >
                                    Change Plan
                                </Link>
                                {subscription?.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
                                    <button
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="px-8 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50 active:scale-95"
                                    >
                                        {isCancelling ? 'Processing...' : 'Cancel Subscription'}
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* Payment Method */}
                        <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
                                <CreditCard className="w-6 h-6 text-emerald-500" />
                                Payment Information
                            </h3>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between border-2 border-slate-100 dark:border-slate-700 gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-10 bg-slate-900 rounded-lg flex items-center justify-center font-black text-[10px] text-white tracking-widest shadow-lg">
                                        CARD
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="font-black text-slate-900 dark:text-white">Primary Payment Method</p>
                                        <p className="text-xs text-slate-500 font-medium">Secured by Razorpay Encryption</p>
                                    </div>
                                </div>
                                <a
                                    href="https://dashboard.razorpay.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 transition shadow-sm"
                                >
                                    Manage Methods →
                                </a>
                            </div>
                        </section>
                    </div>

                    {/* Transaction History Sidebar */}
                    <div className="lg:col-span-1">
                        <section className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm h-full">
                            <h3 className="text-xl font-display font-bold mb-8 flex items-center gap-3 text-slate-900 dark:text-white">
                                <History className="w-6 h-6 text-sky-500" />
                                Recent Activity
                            </h3>
                            <div className="space-y-8">
                                {subscription?.transactions.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="text-4xl mb-4 opacity-20">🧾</div>
                                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest italic">No history yet</p>
                                    </div>
                                ) : (
                                    subscription?.transactions.map((tx) => (
                                        <div key={tx.id} className="pb-8 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-black text-lg text-slate-900 dark:text-white">
                                                    {tx.amount / 100} {tx.currency}
                                                </span>
                                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{format(new Date(tx.createdAt), 'MMM dd, yyyy')}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-500 font-medium leading-tight">{tx.description || 'Monthly Subscription'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { title: 'Unlimited Students', icon: '👥', color: 'bg-emerald-500/10 text-emerald-600' },
                        { title: '8 Curriculum Games', icon: '🎮', color: 'bg-indigo-500/10 text-indigo-600' },
                        { title: 'Classroom Mode', icon: '🏫', color: 'bg-purple-500/10 text-purple-600' },
                        { title: 'Advanced Reports', icon: '📊', color: 'bg-sky-500/10 text-sky-600' },
                    ].map((benefit) => (
                        <div key={benefit.title} className="bg-white dark:bg-slate-800 rounded-2xl p-5 flex items-center gap-4 border border-slate-100 dark:border-slate-700 shadow-sm group hover:scale-105 transition-transform cursor-default">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${benefit.color}`}>{benefit.icon}</div>
                            <span className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight leading-tight">{benefit.title}</span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}

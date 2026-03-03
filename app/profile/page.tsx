'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function ProfilePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
    })

    useEffect(() => {
        if (session?.user) {
            setFormData({
                firstName: session.user.firstName || '',
                lastName: session.user.lastName || '',
                email: session.user.email || '',
            })
        }
    }, [session])

    if (status === 'loading') {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Establishing Connection...</div>
            </div>
        </div>
    }

    if (!session) {
        router.push('/auth/signin')
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/user/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                throw new Error('Failed to update profile')
            }

            toast.success('Settings synchronized!')
        } catch (error) {
            toast.error('Sync failed. Please retry.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition group flex items-center gap-2"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Return home
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-16">
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-3xl -mr-20 -mt-20" />

                    <div className="mb-12 relative z-10">
                        <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white mb-2">Account Identity</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Control how you appear across the EduPlay multiverse</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                        {/* Profile Picture */}
                        <div className="flex items-center gap-8 pb-10 border-b border-slate-100 dark:border-slate-700">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-emerald-500/20 transform group-hover:rotate-6 transition-transform">
                                {formData.firstName[0]}{formData.lastName[0]}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Personal Avatar</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custom skins coming in V2</p>
                            </div>
                        </div>

                        {/* Name Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    Legal First Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white font-bold transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white font-bold transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Immutable Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    Email Address (Locked)
                                </label>
                                <div className="px-6 py-4 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-bold">
                                    {formData.email}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">
                                    Current Rank
                                </label>
                                <div className="px-6 py-4 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 text-emerald-500 font-black uppercase tracking-widest flex items-center gap-2">
                                    <span>🛡️</span> {session.user.role}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 dark:bg-emerald-500 text-white font-black rounded-2xl hover:bg-slate-800 dark:hover:bg-emerald-600 transition shadow-xl shadow-emerald-500/10 active:scale-95 text-sm uppercase tracking-widest"
                            >
                                {loading ? 'Synchronizing...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="mt-12 pt-10 border-t border-red-100 dark:border-red-900/30">
                        <h3 className="text-xl font-display font-black text-red-500 mb-6 flex items-center gap-2">
                            <span>⚠️</span> Danger Zone
                        </h3>
                        <button className="px-8 py-4 border-2 border-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition active:scale-95">
                            Purge System Identity
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}

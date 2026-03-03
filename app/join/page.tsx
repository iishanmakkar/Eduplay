'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function JoinPage() {
    const router = useRouter()
    const { update } = useSession()
    const [classCode, setClassCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/classes/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classCode }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to join class')
            }

            // Update session with new schoolId from joined class
            await update({ schoolId: data.class.schoolId })

            toast.success('Successfully joined class!')
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12 transition-colors">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 transition-colors text-center">
                    <div className="mb-8">
                        <div className="text-6xl mb-4">🎒</div>
                        <div className="font-display text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                            Join a <span className="text-emerald-500">Class</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Enter your class code to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-center text-4xl font-mono tracking-widest uppercase"
                                placeholder="******"
                                required
                                maxLength={6}
                                minLength={6}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? 'Joining class...' : 'Join Class →'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Don&apos;t have a code? Ask your teacher for the 6-digit class code to join your classroom.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <Link href="/api/auth/signout" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition font-medium">
                        Log in with a different account
                    </Link>
                </div>
            </div>
        </div>
    )
}

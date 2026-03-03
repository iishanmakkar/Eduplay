'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SetupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { update } = useSession()
    const [schoolName, setSchoolName] = useState('')
    const [loading, setLoading] = useState(false)
    const refCode = searchParams.get('ref')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schoolName, referralCode: refCode }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Setup failed')
            }

            // Update session with new schoolId
            await update({ schoolId: data.schoolId })

            toast.success('School created! Welcome aboard.')
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
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-8 transition-colors">
                    <div className="text-center mb-8">
                        <div className="font-display text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                            Setup your <span className="text-emerald-500">Workspace</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Create your school environment to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                School Name
                            </label>
                            <input
                                type="text"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                                placeholder="Riverside Primary School"
                                required
                                minLength={2}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                        >
                            {loading ? 'Creating workspace...' : 'Create Workspace →'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                            Creating a workspace will set up your trial period and give you access to all teacher and admin features.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

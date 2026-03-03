'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface InviteTeacherModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function InviteTeacherModal({ isOpen, onClose }: InviteTeacherModalProps) {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/invites/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Failed to send invite')
                return
            }

            toast.success(`Invitation sent to ${email}!`)
            setEmail('')
            onClose()
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-700 transition-all scale-100">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Invite Teacher</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="text-7xl mb-6 transform hover:scale-110 transition-transform cursor-default">👨‍🏫</div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            Invite a teacher to join your school and start collaborating.
                        </p>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Teacher Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                            placeholder="teacher@school.edu"
                            required
                        />
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <span className="text-emerald-500 text-xl">✨</span>
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                <strong className="text-emerald-600 dark:text-emerald-400">Bonus:</strong> Get +1 day trial extension for each teacher invite (max 7 days)
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            {loading ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

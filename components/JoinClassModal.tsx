'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface JoinClassModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function JoinClassModal({ isOpen, onClose }: JoinClassModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [classCode, setClassCode] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/classes/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classCode: classCode.toUpperCase() }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Failed to join class')
                return
            }

            toast.success(`Joined ${data.class.name}!`)
            setClassCode('')
            onClose()
            router.refresh()
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
                    <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Join a Class</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="text-7xl mb-6 transform hover:scale-110 transition-transform cursor-default">🎓</div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium px-4">
                            Enter the 6-character class code provided by your teacher.
                        </p>
                    </div>

                    {/* Class Code Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            Class Code *
                        </label>
                        <input
                            type="text"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                            className="w-full px-5 py-5 text-center text-4xl font-mono font-black border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all tracking-[0.2em] placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
                            placeholder="ABC123"
                            maxLength={6}
                            required
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center font-medium">
                            Cannot find your code? Ask your teacher for help.
                        </p>
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
                            disabled={loading || classCode.length !== 6}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                        >
                            {loading ? 'Joining...' : 'Join Class →'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

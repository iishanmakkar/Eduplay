'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface CreateAssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    classId: string
}

const GAME_TYPES = [
    { value: 'SPEED_MATH', label: '🔢 Speed Math', description: 'Solve math problems quickly' },
    { value: 'SCIENCE_QUIZ', label: '🔬 Science Quiz', description: 'Test science knowledge' },
    { value: 'WORLD_FLAGS', label: '🌍 World Flags', description: 'Identify country flags' },
    { value: 'MEMORY_MATCH', label: '🧠 Memory Match', description: 'Match pairs of cards' },
]

export default function CreateAssignmentModal({ isOpen, onClose, classId }: CreateAssignmentModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        gameType: 'SPEED_MATH',
        dueDate: '',
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/assignments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, classId }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Failed to create assignment')
                return
            }

            toast.success('Assignment created successfully!')
            setFormData({ title: '', description: '', gameType: 'SPEED_MATH', dueDate: '' })
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
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-200 dark:border-slate-700 transition-all scale-100">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Create Assignment</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Assignment Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                            placeholder="e.g. Week 5 Math Challenge"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                            placeholder="Add instructions or notes for students..."
                            rows={3}
                        />
                    </div>

                    {/* Game Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            Game Type *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {GAME_TYPES.map((game) => (
                                <label
                                    key={game.value}
                                    className={`flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.gameType === game.value
                                        ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500 shadow-sm'
                                        : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="gameType"
                                        value={game.value}
                                        checked={formData.gameType === game.value}
                                        onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
                                        className="mt-1 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <div className={`font-bold text-sm ${formData.gameType === game.value ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>{game.label}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">{game.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Due Date *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all appearance-none"
                            required
                        />
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
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

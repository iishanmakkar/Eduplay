'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface CancelSubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
    currentPlan: string
    periodEnd?: Date
}

export default function CancelSubscriptionModal({
    isOpen,
    onClose,
    currentPlan,
    periodEnd,
}: CancelSubscriptionModalProps) {
    const router = useRouter()
    const [reason, setReason] = useState('')
    const [feedback, setFeedback] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [cancelImmediate, setCancelImmediate] = useState(false)

    const handleCancel = async () => {
        if (!reason) {
            toast.error('Please select a reason')
            return
        }

        setIsProcessing(true)

        try {
            const res = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    immediate: cancelImmediate,
                    reason,
                    feedback,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to cancel subscription')
            }

            const data = await res.json()

            toast.success(data.message)
            onClose()
            router.refresh()
        } catch (error: any) {
            console.error('Cancel error:', error)
            toast.error(error.message || 'Failed to cancel subscription')
        } finally {
            setIsProcessing(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 transition-all scale-100">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                        Cancel Subscription
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 mb-8">
                        <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                            <span className="text-lg mr-2">⚠️</span>
                            Are you sure? You&apos;re about to cancel your{' '}
                            <span className="font-black underline">{currentPlan}</span> subscription.
                        </p>
                    </div>

                    {/* Cancellation Options */}
                    <div className="mb-8">
                        <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                            When should we cancel?
                        </label>
                        <div className="space-y-4">
                            <label className={`flex items-start p-5 border-2 rounded-2xl cursor-pointer transition-all ${!cancelImmediate
                                ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500 shadow-sm'
                                : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="cancelType"
                                    checked={!cancelImmediate}
                                    onChange={() => setCancelImmediate(false)}
                                    className="mt-1.5 mr-4 text-emerald-500 focus:ring-emerald-500"
                                />
                                <div>
                                    <div className={`font-bold text-lg ${!cancelImmediate ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                        At period end
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                        Keep access until{' '}
                                        <span className="font-bold">
                                            {periodEnd
                                                ? new Date(periodEnd).toLocaleDateString()
                                                : 'end of billing period'}
                                        </span>
                                    </div>
                                </div>
                            </label>

                            <label className={`flex items-start p-5 border-2 rounded-2xl cursor-pointer transition-all ${cancelImmediate
                                ? 'border-coral-500 bg-coral-500/5 ring-1 ring-coral-500 shadow-sm'
                                : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="cancelType"
                                    checked={cancelImmediate}
                                    onChange={() => setCancelImmediate(true)}
                                    className="mt-1.5 mr-4 text-coral-500 focus:ring-coral-500"
                                />
                                <div>
                                    <div className={`font-bold text-lg ${cancelImmediate ? 'text-coral-700 dark:text-coral-400' : 'text-slate-900 dark:text-white'}`}>
                                        Cancel immediately
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                        Lose access right away <span className="text-coral-500 font-bold">(no refund)</span>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="mb-8">
                        <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                            Why are you cancelling? *
                        </label>
                        <div className="relative">
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all appearance-none font-medium cursor-pointer"
                            >
                                <option value="">Select a reason...</option>
                                <option value="too_expensive">Too expensive</option>
                                <option value="not_using">Not using it enough</option>
                                <option value="missing_features">Missing features</option>
                                <option value="technical_issues">Technical issues</option>
                                <option value="switching_competitor">Switching to competitor</option>
                                <option value="other">Other</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                ▼
                            </div>
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="mb-8">
                        <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                            Any additional feedback?
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Help us improve EduPlay..."
                            rows={4}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all resize-none font-medium"
                        />
                    </div>

                    {/* What You'll Lose */}
                    <div className="bg-coral-50/50 dark:bg-coral-900/10 border border-coral-100 dark:border-coral-500/20 rounded-2xl p-6 mb-10">
                        <h3 className="font-display font-bold text-coral-600 dark:text-coral-400 mb-4 flex items-center gap-2">
                            <span>🚫</span> What you&apos;ll lose:
                        </h3>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3 font-medium">
                            <li className="flex items-center gap-3">
                                <span className="text-coral-500 font-black">✗</span> Access to all premium games and assignments
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-coral-500 font-black">✗</span> Student detailed progress tracking
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-coral-500 font-black">✗</span> Advanced analytics and PDF reports
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-coral-500 font-black">✗</span> School-wide priority support
                            </li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 px-6 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                        >
                            Keep Subscription
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isProcessing || !reason}
                            className="flex-1 py-4 px-6 bg-coral-500 text-white font-bold rounded-2xl hover:bg-coral-600 transition-all shadow-lg shadow-coral-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

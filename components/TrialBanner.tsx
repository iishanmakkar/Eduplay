'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface TrialBannerProps {
    trialEndsAt?: string | Date
    plan?: string
    daysLeft?: number
}

export default function TrialBanner({ trialEndsAt, plan, daysLeft: initialDaysLeft }: TrialBannerProps) {
    const t = useTranslations('TrialBanner')
    const [daysLeft, setDaysLeft] = useState<number | null>(initialDaysLeft ?? null)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (trialEndsAt && initialDaysLeft === undefined) {
            const end = new Date(trialEndsAt)
            const now = new Date()
            const diff = end.getTime() - now.getTime()
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
            setDaysLeft(days)
        }
    }, [trialEndsAt, initialDaysLeft])

    if (daysLeft === null || daysLeft < 0 || !isVisible || plan !== 'TRIAL') return null

    const isUrgent = daysLeft <= 3

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`relative z-50 px-4 py-3 ${isUrgent ? 'bg-coral text-white' : 'bg-indigo-600 text-white'
                    }`}
            >
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{isUrgent ? '⏳' : '🎁'}</span>
                        <p>
                            <strong>{t('endsIn', { daysLeft })}</strong>
                            {isUrgent && t('urgentWarning')}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/billing"
                            className={`px-4 py-2 rounded-lg transition shadow-sm ${isUrgent
                                ? 'bg-white dark:bg-fixed-dark text-coral hover:bg-coral-50'
                                : 'bg-white dark:bg-emerald text-indigo-600 dark:text-white hover:bg-indigo-50'
                                }`}
                        >
                            {t('upgradeNow')}
                        </Link>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="opacity-60 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

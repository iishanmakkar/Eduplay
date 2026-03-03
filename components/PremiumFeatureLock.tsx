'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'

interface PremiumFeatureLockProps {
    children: ReactNode
    isLocked: boolean
    plan?: string
}

export default function PremiumFeatureLock({ children, isLocked, plan }: PremiumFeatureLockProps) {
    if (!isLocked) return <>{children}</>

    return (
        <div className="relative group">
            <div className="filter blur-sm pointer-events-none select-none opacity-50 transition duration-300">
                {children}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                <div className="bg-white/90 dark:bg-background/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 dark:border-border max-w-sm transform transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-display">
                        Premium Feature
                    </h3>
                    <p className="text-gray-600 dark:text-mist mb-6 text-sm">
                        Upgrade to <strong>School</strong> or <strong>District</strong> plan to unlock advanced analytics and insights.
                    </p>
                    <Link
                        href="/dashboard/billing"
                        className="inline-flex px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition"
                    >
                        Upgrade to Unlock
                    </Link>
                </div>
            </div>
        </div>
    )
}

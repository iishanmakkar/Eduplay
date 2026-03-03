'use client'

import Link from 'next/link'
import { SubscriptionPlan } from '@prisma/client'

interface UpgradePromptProps {
    feature: string
    currentPlan: SubscriptionPlan
    requiredPlan: SubscriptionPlan
    urgency?: 'low' | 'medium' | 'high' | 'urgent'
    daysLeftInTrial?: number
}

export default function UpgradePrompt({
    feature,
    currentPlan,
    requiredPlan,
    urgency = 'medium',
    daysLeftInTrial,
}: UpgradePromptProps) {
    const urgencyStyles = {
        low: 'bg-gray-50 border-gray-200',
        medium: 'bg-blue-50 border-blue-200',
        high: 'bg-yellow-50 border-yellow-200',
        urgent: 'bg-red-50 border-red-200 animate-pulse',
    }

    const urgencyIcons = {
        low: '💡',
        medium: '🔒',
        high: '⏰',
        urgent: '🚨',
    }

    return (
        <div
            className={`${urgencyStyles[urgency]} border-2 rounded-xl p-6 text-center`}
        >
            <div className="text-4xl mb-3">{urgencyIcons[urgency]}</div>
            <h3 className="font-display text-xl font-bold mb-2">
                {feature} is a {requiredPlan} feature
            </h3>
            <p className="text-mist mb-4">
                Upgrade from {currentPlan} to unlock this powerful feature
            </p>

            {daysLeftInTrial !== undefined && daysLeftInTrial > 0 && (
                <p className="text-sm font-semibold mb-4 text-orange-600">
                    ⏰ {daysLeftInTrial} day{daysLeftInTrial > 1 ? 's' : ''} left in trial
                </p>
            )}

            <Link
                href="/dashboard/admin/billing"
                className="inline-block px-6 py-3 bg-emerald text-white rounded-full font-semibold hover:bg-emerald-dark transition shadow-md"
            >
                Upgrade to {requiredPlan} →
            </Link>

            <p className="text-xs text-mist mt-4">
                Join 1,200+ schools already using {requiredPlan} plan
            </p>
        </div>
    )
}

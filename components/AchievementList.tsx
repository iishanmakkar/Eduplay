'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    earnedAt?: string // If earned
}

// New interfaces and constants based on the provided code snippet
interface Badge {
    id: string
    name: string
    description: string
    type: string // Used for BADGE_EMOJIS
    earnedAt: string // Used for format
}

interface AchievementListProps {
    badges: Badge[]
}

const BADGE_EMOJIS: { [key: string]: string } = {
    'first_login': '👋',
    'first_post': '✍️',
    '10_posts': '📝',
    'first_like': '👍',
    '5_likes': '❤️',
    'early_bird': '🐦',
    'night_owl': '🦉',
    'explorer': '🗺️',
    'socialite': '🥂',
    'master_commenter': '💬',
    // Add more badge types and their emojis as needed
}

export default function AchievementList({ badges }: AchievementListProps) {
    if (badges.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/50">
                <div className="text-4xl mb-3 opacity-20">🏅</div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No badges earned yet</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
                <div
                    key={badge.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500/30 transition-all group flex flex-col items-center text-center"
                    title={badge.description}
                >
                    <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 drop-shadow-sm">
                        {BADGE_EMOJIS[badge.type] || '🏅'}
                    </div>
                    <div className="font-black text-[10px] text-slate-900 dark:text-white uppercase tracking-tighter leading-tight mb-1">
                        {badge.name}
                    </div>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        {format(new Date(badge.earnedAt), 'MMM dd')}
                    </div>
                </div>
            ))}
        </div>
    )
}

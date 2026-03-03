'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { theme } from '@/lib/theme'

interface DailyChallenge {
    id: string
    title: string
    description: string
    gameType: string
    targetScore: number
    xpReward: number
}

interface CompletionDetails {
    completedAt: string
    score: number
}

export default function DailyChallengeCard() {
    const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
    const [isCompleted, setIsCompleted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchChallenge()
    }, [])

    const fetchChallenge = async () => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
            const res = await fetch('/api/challenges/daily', {
                headers: {
                    'x-timezone': tz
                }
            })
            if (res.ok) {
                const data = await res.json()
                setChallenge(data.challenge)
                setIsCompleted(data.isCompleted)
            }
        } catch (error) {
            console.error('Failed to fetch challenge:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="animate-pulse flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!challenge) return null

    return (
        <div className={`relative overflow-hidden rounded-3xl shadow-lg border-2 p-8 transition-all duration-300 ${isCompleted
            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20'
            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-500/30'
            }`}>
            {/* Background decorations */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full opacity-50 blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm ${isCompleted
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20'
                            }`}>
                            <span className="text-2xl">{isCompleted ? '✓' : '🔥'}</span>
                        </div>
                        <div>
                            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Daily Challenge</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
                            <span>⚡ {challenge.xpReward} XP</span>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className={`text-2xl font-display font-black mb-2 tracking-tight ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {challenge.gameType.replace('_', ' ')}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{challenge.description}</p>
                </div>

                {isCompleted ? (
                    <div className="w-full py-4 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-2xl text-center font-black text-sm border border-emerald-500/20">
                        ✨ CHALLENGE COMPLETED
                    </div>
                ) : (
                    <Link
                        href={`/games/play?game=${challenge.gameType}`}
                        className="block w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-center font-bold text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98]"
                    >
                        Play Now & Win →
                    </Link>
                )}
            </div>
        </div>
    )
}

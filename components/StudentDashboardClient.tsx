'use client'

import { useState } from 'react'
import Link from 'next/link'
import JoinClassModal from '@/components/JoinClassModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface StudentDashboardClientProps {
    user: {
        firstName: string
    }
    student: any
    xp: number
    level: number
    xpToNextLevel: number
    dailyChallenge: any
    challengeCompleted: any
}

export default function StudentDashboardClient(props: StudentDashboardClientProps) {
    const [showJoinModal, setShowJoinModal] = useState(false)
    const { user, student, xp, level, xpToNextLevel, dailyChallenge, challengeCompleted } = props

    return (
        <>
            <div className="min-h-screen bg-surface dark:bg-background transition-colors duration-300">
                {/* Header */}
                <header className="bg-gradient-to-r from-emerald to-sky text-white">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-display font-bold">
                                    Hey {user.firstName}! 🎮
                                </h1>
                                <p className="text-emerald-light">Ready to learn and play?</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                <button
                                    onClick={() => setShowJoinModal(true)}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full font-semibold transition"
                                >
                                    + Join Class
                                </button>
                                <Link
                                    href="/api/auth/signout"
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full font-semibold transition"
                                >
                                    Sign Out
                                </Link>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">⭐</div>
                                    <div>
                                        <div className="text-2xl font-bold">Level {level}</div>
                                        <div className="text-sm text-emerald-light">{xp.toLocaleString()} XP</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-emerald-light">Next Level</div>
                                    <div className="font-semibold">{xpToNextLevel} XP to go</div>
                                </div>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3">
                                <div
                                    className="bg-white rounded-full h-3 transition-all"
                                    style={{ width: `${((xp % 1000) / 1000) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Rest of the dashboard content would go here - keeping it simple for now */}
                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-xl border border-border p-6 text-center">
                        <p className="text-mist">Student dashboard content...</p>
                    </div>
                </main>
            </div>

            {/* Modal */}
            <JoinClassModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
        </>
    )
}

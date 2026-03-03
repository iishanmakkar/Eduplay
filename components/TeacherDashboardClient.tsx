'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import CreateClassModal from '@/components/CreateClassModal'
import UpgradePromptModal from '@/components/UpgradePromptModal'
import LimitReachedModal from '@/components/LimitReachedModal'
import { theme } from '@/lib/theme'

interface TeacherDashboardClientProps {
    user: {
        firstName: string
    }
    classes: Array<{
        id: string
        name: string
        grade: string
        emoji: string
        classCode: string
        _count: {
            students: number
            assignments: number
        }
    }>
}

export default function TeacherDashboardClient({ user, classes }: TeacherDashboardClientProps) {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [showLimitModal, setShowLimitModal] = useState(false)
    const [limitStatus, setLimitStatus] = useState<{ allowed: boolean; limit: number; current: number } | null>(null)

    useEffect(() => {
        // optimistically check limit on load
        fetch('/api/limits/check?type=classes')
            .then(res => res.json())
            .then(data => setLimitStatus(data))
            .catch(err => console.error(err))
    }, [classes.length])

    const handleCreateClass = () => {
        if (limitStatus && !limitStatus.allowed) {
            setShowLimitModal(true)
        } else {
            setShowCreateModal(true)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                            Welcome back, {user.firstName}! 👋
                        </h1>
                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Teacher Dashboard</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="hidden sm:flex items-center gap-3">
                            <Link
                                href="/dashboard/billing"
                                className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-2xl text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                            >
                                💳 Billing
                            </Link>
                            <Link
                                href="/profile"
                                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-sm"
                            >
                                ⚙️ Profile
                            </Link>
                            <Link
                                href="/api/auth/signout"
                                className="px-5 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm active:scale-95"
                            >
                                Leave Session
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { icon: '📚', label: 'Active Classes', value: classes.length, color: 'emerald' },
                        { icon: '👥', label: 'Total Students', value: classes.reduce((acc, c) => acc + c._count.students, 0), color: 'sky' },
                        { icon: '📝', label: 'Assignments', value: classes.reduce((acc, c) => acc + c._count.assignments, 0), color: 'purple' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">{stat.icon}</div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:bg-${stat.color}-500/10 transition-all`} />
                        </div>
                    ))}
                </div>

                {/* Classes Section */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                        <div>
                            <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white">Your Classes</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage and track progress for all your students</p>
                        </div>
                        <button
                            onClick={handleCreateClass}
                            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span className="text-xl">+</span> New Class
                        </button>
                    </div>

                    {classes.length === 0 ? (
                        <div className="text-center py-24 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div className="text-8xl mb-8 animate-bounce-slow">📚</div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No classes found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium mb-10 leading-relaxed">Create your first class to start assigning games and tracking progress!</p>
                            <button
                                onClick={handleCreateClass}
                                className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition shadow-xl shadow-emerald-500/20 active:scale-95"
                            >
                                Create First Class
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {classes.map((classItem) => (
                                <Link
                                    key={classItem.id}
                                    href={`/dashboard/teacher/class/${classItem.id}`}
                                    className="group relative bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
                                >
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="text-5xl transform group-hover:scale-125 transition-transform duration-300">{classItem.emoji}</div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                                                {classItem.name}
                                            </h3>
                                            <div className="inline-block px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                Grade {classItem.grade}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/50 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-lg">👥</span>
                                            <span>{classItem._count.students} Students</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/50 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-lg">📝</span>
                                            <span>{classItem._count.assignments} Assignments</span>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invite Code</span>
                                            <span className="font-mono font-black text-emerald-500 text-lg tracking-wider group-hover:scale-110 transition-transform origin-left">{classItem.classCode}</span>
                                        </div>
                                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-lg shadow-emerald-500/30">
                                            →
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <CreateClassModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
            <UpgradePromptModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
            <LimitReachedModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                resource="Classes"
                limit={limitStatus?.limit || 0}
            />
        </div >
    )
}

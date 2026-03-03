'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import InviteTeacherModal from '@/components/InviteTeacherModal'

interface AdminDashboardClientProps {
    school: any
    trialStatus: any
    totalTeachers: number
    totalStudents: number
    totalClasses: number
    recentGamesCount: number
}

export default function AdminDashboardClient(props: AdminDashboardClientProps) {
    const [showInviteModal, setShowInviteModal] = useState(false)
    const { school, trialStatus, totalTeachers, totalStudents, totalClasses, recentGamesCount } = props

    return (
        <>
            <div className="min-h-screen bg-surface dark:bg-background transition-colors duration-300">
                {/* Header */}
                <header className="bg-white dark:bg-background border-b border-border transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-display font-bold dark:text-white">
                                {school.name} - Admin Dashboard
                            </h1>
                            <p className="text-sm text-mist dark:text-fog transition-colors">
                                {school.subscription?.plan} Plan • {school.subscription?.status}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Link
                                href="/dashboard/admin/billing"
                                className="px-4 py-2 bg-emerald text-white rounded-lg font-semibold hover:bg-emerald-dark transition"
                            >
                                Manage Billing
                            </Link>
                            <Link
                                href="/api/auth/signout"
                                className="px-4 py-2 text-sm font-semibold text-mist hover:text-ink dark:text-mist dark:hover:text-white transition"
                            >
                                Sign Out
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-6 py-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-fixed-medium rounded-xl p-6 border border-border transition-colors duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-3xl">👥</div>
                                <div className="text-xs font-semibold text-emerald bg-emerald-light px-2 py-1 rounded-full">
                                    Active
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink dark:text-white mb-1">{totalStudents}</div>
                            <div className="text-sm text-mist">Total Students</div>
                        </div>

                        <div className="bg-white dark:bg-fixed-medium rounded-xl p-6 border border-border transition-colors duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-3xl">👨‍🏫</div>
                            </div>
                            <div className="text-3xl font-bold text-ink dark:text-white mb-1">{totalTeachers}</div>
                            <div className="text-sm text-mist">Teachers</div>
                        </div>

                        <div className="bg-white dark:bg-fixed-medium rounded-xl p-6 border border-border transition-colors duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-3xl">📚</div>
                            </div>
                            <div className="text-3xl font-bold text-ink dark:text-white mb-1">{totalClasses}</div>
                            <div className="text-sm text-mist">Active Classes</div>
                        </div>

                        <div className="bg-white dark:bg-fixed-medium rounded-xl p-6 border border-border transition-colors duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-3xl">🎮</div>
                                <div className="text-xs font-semibold text-sky bg-sky-light px-2 py-1 rounded-full">
                                    7 days
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-ink dark:text-white mb-1">{recentGamesCount}</div>
                            <div className="text-sm text-mist">Games Played</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-fixed-medium rounded-xl border border-border p-6 mb-8 transition-colors duration-300">
                        <h2 className="text-xl font-display font-bold mb-4 dark:text-white">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg hover:border-emerald hover:bg-emerald/5 transition"
                            >
                                <div className="text-3xl">👨‍🏫</div>
                                <div className="text-left">
                                    <div className="font-semibold text-ink dark:text-white">Invite Teachers</div>
                                    <div className="text-sm text-mist">Add more educators</div>
                                </div>
                            </button>

                            <Link
                                href="/dashboard/admin/billing"
                                className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg hover:border-emerald hover:bg-emerald/5 transition"
                            >
                                <div className="text-3xl">💳</div>
                                <div className="text-left">
                                    <div className="font-semibold text-ink dark:text-white">Upgrade Plan</div>
                                    <div className="text-sm text-mist">Unlock more features</div>
                                </div>
                            </Link>

                            <button className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg hover:border-emerald hover:bg-emerald/5 transition">
                                <div className="text-3xl">📊</div>
                                <div className="text-left">
                                    <div className="font-semibold text-ink dark:text-white">View Reports</div>
                                    <div className="text-sm text-mist">School analytics</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Classes Overview */}
                    <div className="bg-white dark:bg-fixed-medium rounded-xl border border-border p-6 transition-colors duration-300">
                        <h2 className="text-xl font-display font-bold mb-4 dark:text-white">Classes Overview</h2>
                        {totalClasses === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📚</div>
                                <h3 className="text-lg font-semibold text-ink dark:text-white mb-2">No classes yet</h3>
                                <p className="text-mist mb-4">Teachers will create classes to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {school.classes.map((classItem: any) => (
                                    <div
                                        key={classItem.id}
                                        className="flex items-center justify-between p-4 border border-border rounded-lg overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl">{classItem.emoji}</div>
                                            <div>
                                                <h3 className="font-semibold text-ink dark:text-white">{classItem.name}</h3>
                                                <p className="text-sm text-mist">Grade {classItem.grade}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-mist">
                                            <span>👥 {classItem._count.students} students</span>
                                            <span className="font-mono text-xs">{classItem.classCode}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal */}
            <InviteTeacherModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
        </>
    )
}

'use client'

import { useState } from 'react'
import DAUChart from '@/components/analytics/DAUChart'
import RevenueChart from '@/components/analytics/RevenueChart'
import GameActivityChart from '@/components/analytics/GameActivityChart'
import ConversionFunnel from '@/components/analytics/ConversionFunnel'

export default function AdminReportsPage() {
    const [timeRange, setTimeRange] = useState(30)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background p-6 transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        📊 Analytics Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-mist">
                        Track platform performance, revenue, and user engagement
                    </p>
                </div>

                {/* Time Range Selector */}
                <div className="bg-white dark:bg-fixed-medium rounded-xl shadow-sm p-4 mb-6 transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time Range:</span>
                        <div className="flex gap-2">
                            {[7, 14, 30, 60, 90].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setTimeRange(days)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${timeRange === days
                                        ? 'bg-emerald text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {days} days
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="space-y-6">
                    {/* Row 1: DAU and Revenue */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DAUChart days={timeRange} />
                        <RevenueChart days={timeRange} />
                    </div>

                    {/* Row 2: Game Activity */}
                    <div className="grid grid-cols-1 gap-6">
                        <GameActivityChart days={timeRange} />
                    </div>

                    {/* Row 3: Coming Soon Placeholders */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-fixed-medium rounded-xl shadow-sm p-6 transition-colors">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Conversion Funnel
                            </h3>
                            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📈</div>
                                    <p className="text-gray-600 dark:text-mist">Coming soon</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-fixed-medium rounded-xl shadow-sm p-6 transition-colors">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Student Engagement
                            </h3>
                            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🎯</div>
                                    <p className="text-gray-600 dark:text-mist">Coming soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-8 bg-gradient-to-r from-emerald to-emerald-dark rounded-xl shadow-lg p-6 text-white">
                    <h3 className="text-xl font-bold mb-4">Platform Health</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm opacity-90">Uptime</div>
                            <div className="text-2xl font-bold">99.9%</div>
                        </div>
                        <div>
                            <div className="text-sm opacity-90">Avg Response Time</div>
                            <div className="text-2xl font-bold">&lt;200ms</div>
                        </div>
                        <div>
                            <div className="text-sm opacity-90">Active Schools</div>
                            <div className="text-2xl font-bold">--</div>
                        </div>
                        <div>
                            <div className="text-sm opacity-90">Total Students</div>
                            <div className="text-2xl font-bold">--</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

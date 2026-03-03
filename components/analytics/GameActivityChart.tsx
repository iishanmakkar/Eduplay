'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface GameActivityData {
    gameType: string
    plays: number
}

interface GameActivitySummary {
    totalPlays: number
    avgScore: number
    totalXP: number
    uniqueGameTypes: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function GameActivityChart({ days = 30 }: { days?: number }) {
    const [data, setData] = useState<GameActivityData[]>([])
    const [summary, setSummary] = useState<GameActivitySummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [days])

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/analytics/game-activity?days=${days}`)
            if (res.ok) {
                const json = await res.json()
                setData(json.chartData)
                setSummary(json.summary)
            }
        } catch (error) {
            console.error('Failed to fetch game activity:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-100 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Game Activity
                </h3>

                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm text-blue-600 font-semibold">Total Plays</div>
                            <div className="text-2xl font-bold text-blue-900">
                                {summary.totalPlays.toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-600">Last {days} days</div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-sm text-green-600 font-semibold">Avg Score</div>
                            <div className="text-2xl font-bold text-green-900">
                                {summary.avgScore}
                            </div>
                            <div className="text-xs text-green-600">Per game</div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm text-purple-600 font-semibold">Total XP</div>
                            <div className="text-2xl font-bold text-purple-900">
                                {summary.totalXP.toLocaleString()}
                            </div>
                            <div className="text-xs text-purple-600">Earned</div>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="text-sm text-orange-600 font-semibold">Game Types</div>
                            <div className="text-2xl font-bold text-orange-900">
                                {summary.uniqueGameTypes}
                            </div>
                            <div className="text-xs text-orange-600">Active games</div>
                        </div>
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="gameType"
                        stroke="#9ca3af"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Bar dataKey="plays" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

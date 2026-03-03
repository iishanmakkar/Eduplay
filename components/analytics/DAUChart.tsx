'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface DAUData {
    date: string
    activeUsers: number
}

interface DAUSummary {
    dau: number
    wau: number
    avgDau: number
}

export default function DAUChart({ days = 30 }: { days?: number }) {
    const [data, setData] = useState<DAUData[]>([])
    const [summary, setSummary] = useState<DAUSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [days])

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/analytics/dau-wau?days=${days}`)
            if (res.ok) {
                const json = await res.json()
                setData(json.chartData)
                setSummary(json.summary)
            }
        } catch (error) {
            console.error('Failed to fetch DAU data:', error)
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
                    Daily & Weekly Active Users
                </h3>

                {summary && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm text-blue-600 font-semibold">DAU</div>
                            <div className="text-2xl font-bold text-blue-900">
                                {summary.dau}
                            </div>
                            <div className="text-xs text-blue-600">Today</div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm text-purple-600 font-semibold">WAU</div>
                            <div className="text-2xl font-bold text-purple-900">
                                {summary.wau}
                            </div>
                            <div className="text-xs text-purple-600">Last 7 days</div>
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-4">
                            <div className="text-sm text-emerald-600 font-semibold">Avg DAU</div>
                            <div className="text-2xl font-bold text-emerald-900">
                                {Math.round(summary.avgDau)}
                            </div>
                            <div className="text-xs text-emerald-600">Last {days} days</div>
                        </div>
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                        stroke="#9ca3af"
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="activeUsers"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        name="Active Users"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

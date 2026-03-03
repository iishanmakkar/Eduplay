'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface RevenueData {
    date: string
    revenue: number
}

interface RevenueSummary {
    totalRevenue: number
    mrr: number
    arr: number
    avgTransactionValue: number
    transactionCount: number
}

export default function RevenueChart({ days = 30 }: { days?: number }) {
    const [data, setData] = useState<RevenueData[]>([])
    const [summary, setSummary] = useState<RevenueSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [days])

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/analytics/revenue?days=${days}`)
            if (res.ok) {
                const json = await res.json()
                setData(json.chartData)
                setSummary(json.summary)
            }
        } catch (error) {
            console.error('Failed to fetch revenue data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value)
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
                    Revenue Analytics
                </h3>

                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-sm text-green-600 font-semibold">Total Revenue</div>
                            <div className="text-2xl font-bold text-green-900">
                                {formatCurrency(summary.totalRevenue)}
                            </div>
                            <div className="text-xs text-green-600">Last {days} days</div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm text-blue-600 font-semibold">MRR</div>
                            <div className="text-2xl font-bold text-blue-900">
                                {formatCurrency(summary.mrr)}
                            </div>
                            <div className="text-xs text-blue-600">Monthly Recurring</div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm text-purple-600 font-semibold">ARR</div>
                            <div className="text-2xl font-bold text-purple-900">
                                {formatCurrency(summary.arr)}
                            </div>
                            <div className="text-xs text-purple-600">Annual Recurring</div>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="text-sm text-orange-600 font-semibold">Avg Transaction</div>
                            <div className="text-2xl font-bold text-orange-900">
                                {formatCurrency(summary.avgTransactionValue)}
                            </div>
                            <div className="text-xs text-orange-600">{summary.transactionCount} transactions</div>
                        </div>
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        tickFormatter={(value) => `${value / 1000}k`}
                        stroke="#9ca3af"
                    />
                    <Tooltip
                        labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

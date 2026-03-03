'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

interface FunnelData {
    stage: string
    count: number
    percentage: number
}

interface FunnelSummary {
    totalSignups: number
    totalConversions: number
    conversionRate: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function ConversionFunnel({ days = 30 }: { days?: number }) {
    const [data, setData] = useState<FunnelData[]>([])
    const [summary, setSummary] = useState<FunnelSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [days])

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/analytics/conversion?days=${days}`)
            if (res.ok) {
                const json = await res.json()
                setData(json.funnelData)
                setSummary(json.summary)
            }
        } catch (error) {
            console.error('Failed to fetch conversion funnel:', error)
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
                    Conversion Funnel
                </h3>

                {summary && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm text-blue-600 font-semibold">Total Signups</div>
                            <div className="text-2xl font-bold text-blue-900">
                                {summary.totalSignups}
                            </div>
                            <div className="text-xs text-blue-600">Last {days} days</div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-sm text-green-600 font-semibold">Conversions</div>
                            <div className="text-2xl font-bold text-green-900">
                                {summary.totalConversions}
                            </div>
                            <div className="text-xs text-green-600">Paid subscriptions</div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm text-purple-600 font-semibold">Conversion Rate</div>
                            <div className="text-2xl font-bold text-purple-900">
                                {summary.conversionRate}%
                            </div>
                            <div className="text-xs text-purple-600">Trial → Paid</div>
                        </div>
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="stage" type="category" stroke="#9ca3af" width={120} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string, props: any) => [
                            `${value} (${props.payload.percentage}%)`,
                            'Count',
                        ]}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <LabelList
                            dataKey="percentage"
                            position="right"
                            formatter={(value: number) => `${value}%`}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-center">
                    {data.map((stage, index) => (
                        <div key={index}>
                            <div className="text-xs text-gray-600 mb-1">{stage.stage}</div>
                            <div className="text-lg font-bold text-gray-900">{stage.count}</div>
                            <div className="text-xs text-gray-500">{stage.percentage}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

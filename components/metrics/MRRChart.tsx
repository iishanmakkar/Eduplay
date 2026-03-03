'use client'

import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface MRRChartProps {
    value?: number
    history?: { month: string; value: number }[]
}

const defaultData = [
    { month: 'Jan', value: 0 },
    { month: 'Feb', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Apr', value: 0 },
    { month: 'May', value: 0 },
    { month: 'Jun', value: 0 },
]

export default function MRRChart({ value = 0, history = defaultData }: MRRChartProps) {
    // Calculate growth (mock comparison with first data point for now)
    const startValue = history.length > 0 ? history[0].value : 0
    const endValue = history.length > 0 ? history[history.length - 1].value : 0
    const growth = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Monthly Recurring Revenue (MRR)</h3>
            <div className="text-3xl font-bold text-emerald-600 mb-6">${value.toLocaleString()}</div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `${val}k`} />
                        <Tooltip
                            formatter={(val: number) => [`${val}k`, 'MRR']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#059669"
                            strokeWidth={3}
                            dot={{ fill: '#059669', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-green-600 mt-4 flex items-center">
                <span className="font-bold mr-1">
                    {growth > 0 ? '↑' : growth < 0 ? '↓' : '-'} {Math.abs(growth).toFixed(0)}%
                </span> vs 6 months ago
            </p>
        </Card>
    )
}

'use client'

import { Card } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ARRProjectionProps {
    value?: number
}

const getProjectionData = (current: number) => [
    { year: 'Current', value: current / 100000 },
    { year: 'Y1', value: (current * 4) / 100000 },
    { year: 'Y2', value: (current * 10) / 100000 },
]

export default function ARRProjection({ value = 0 }: ARRProjectionProps) {
    const data = getProjectionData(value)

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">ARR Projection</h3>
            <div className="text-3xl font-bold text-indigo-600 mb-6">${value.toLocaleString()}</div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorARR" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `${val}L`} />
                        <Tooltip
                            formatter={(val: number) => [`${val} Lakhs`, 'ARR']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#4f46e5"
                            fillOpacity={1}
                            fill="url(#colorARR)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">Targeting 400% YoY growth</p>
        </Card>
    )
}

'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface CACChartProps {
    // Placeholder for future real data
    data?: any[]
}

const defaultData = [
    { channel: 'Direct', cac: 15 },
    { channel: 'Referral', cac: 5 },
    { channel: 'Social', cac: 25 },
    { channel: 'Ads', cac: 45 },
]

export default function CACChart({ data = defaultData }: CACChartProps) {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Customer Acquisition Cost (CAC)</h3>
            <div className="text-3xl font-bold text-amber-600 mb-6">$22.5</div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="channel" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            formatter={(value: number) => [`${value}`, 'CAC']}
                        />
                        <Bar dataKey="cac" fill="#d97706" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-4">
                Blended CAC across all channels
            </p>
        </Card>
    )
}

'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface ChurnRateProps {
    churnRate?: number
}

const COLORS = ['#f43f5e', '#e2e8f0']

export default function ChurnRate({ churnRate = 0 }: ChurnRateProps) {
    const data = [
        { name: 'Churned', value: churnRate },
        { name: 'Retained', value: 100 - churnRate },
    ]

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Churn Rate</h3>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-3xl font-bold text-rose-500 mb-1">{churnRate}%</div>
                    <p className="text-sm text-gray-500">Monthly Churn</p>
                </div>
                <div className="h-24 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
                Target: &lt; 2%
            </p>
        </Card>
    )
}

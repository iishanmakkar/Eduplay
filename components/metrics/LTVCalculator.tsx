'use client'

import { Card } from '@/components/ui/card'
import { useState, useEffect } from 'react'

interface LTVCalculatorProps {
    initialArpu?: number
    initialChurn?: number
}

export default function LTVCalculator({ initialArpu = 4999, initialChurn = 5 }: LTVCalculatorProps) {
    const [arpu, setArpu] = useState(initialArpu)
    const [churn, setChurn] = useState(initialChurn || 5)

    useEffect(() => {
        if (initialArpu) setArpu(initialArpu)
        if (initialChurn) setChurn(initialChurn)
    }, [initialArpu, initialChurn])

    const lifespan = churn > 0 ? (100 / churn) : 0
    const ltv = arpu * lifespan

    return (
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <h3 className="text-lg font-semibold text-slate-300 mb-6">LTV Calculator</h3>

            <div className="space-y-6">
                <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">ARPU ($)</label>
                    <input
                        type="range"
                        min="1000"
                        max="20000"
                        step="100"
                        value={arpu}
                        onChange={(e) => setArpu(Number(e.target.value))}
                        className="w-full mt-2 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="text-xl font-mono mt-1">${arpu.toLocaleString()}</div>
                </div>

                <div>
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Churn Rate (%)</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={churn}
                        onChange={(e) => setChurn(Number(e.target.value))}
                        className="w-full mt-2 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <div className="text-xl font-mono mt-1">{churn}%</div>
                </div>

                <div className="pt-6 border-t border-slate-700">
                    <label className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Customer Lifetime Value</label>
                    <div className="text-4xl font-bold text-white mt-1">
                        ${Math.round(ltv).toLocaleString()}
                    </div>
                </div>
            </div>
        </Card>
    )
}

'use client'

import { useState, useEffect } from 'react'
import MRRChart from '@/components/metrics/MRRChart'
import ARRProjection from '@/components/metrics/ARRProjection'
import LTVCalculator from '@/components/metrics/LTVCalculator'
import CACChart from '@/components/metrics/CACChart'
import ChurnRate from '@/components/metrics/ChurnRate'
import { toast } from 'react-hot-toast'

interface MetricsData {
    metrics: {
        mrr: number
        arr: number
        arpu: number
        churnRate: number
        activeSubscriptions: number
        totalUsers: number
        totalSchools: number
        growthRate: number
    }
    history: { month: string; value: number }[]
}

export default function SaaSMetricsPage() {
    const [data, setData] = useState<MetricsData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchMetrics = async () => {
        try {
            const res = await fetch('/api/admin/metrics')
            if (!res.ok) throw new Error('Failed to fetch')
            const json = await res.json()
            setData(json)
        } catch (error) {
            console.error('Metrics fetch error:', error)
            toast.error('Failed to load metrics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics()
    }, [])

    if (loading) {
        return <div className="p-8 text-center">Loading Metrics...</div>
    }

    const { metrics, history } = data || {}

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background p-6 transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            🚀 Investor Metrics
                        </h1>
                        <p className="text-gray-600 dark:text-mist">
                            Key performance indicators for Series A tracking.
                        </p>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchMetrics(); }}
                        className="px-4 py-2 bg-white dark:bg-fixed-medium dark:text-white border dark:border-slate-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        ↻ Refresh
                    </button>
                </div>

                {/* Top Row: Revenue */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <MRRChart value={metrics?.mrr} history={history} />
                    <ARRProjection value={metrics?.arr} />
                </div>

                {/* Middle Row: Unit Economics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-1">
                        <LTVCalculator initialArpu={metrics?.arpu} initialChurn={metrics?.churnRate} />
                    </div>
                    <div className="lg:col-span-2">
                        <CACChart />
                    </div>
                </div>

                {/* Bottom Row: Retention */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChurnRate churnRate={metrics?.churnRate} />

                    {/* Net Revenue Retention Placeholder */}
                    <div className="bg-white dark:bg-fixed-medium rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700 flex flex-col justify-center items-center transition-colors">
                        <div className="text-5xl mb-4">💎</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">120% NRR</div>
                        <p className="text-gray-500 dark:text-mist mt-2 text-center">
                            Net Revenue Retention via upsells to<br />District plans.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

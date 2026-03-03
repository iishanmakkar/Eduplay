'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function SystemSettingsCard() {
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/system/settings')
            if (res.ok) {
                const data = await res.json()
                setMaintenanceMode(data.maintenance_mode === 'true')
            }
        } catch (error) {
            console.error('Failed to fetch settings')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMaintenance = async () => {
        const newValue = !maintenanceMode
        try {
            const res = await fetch('/api/system/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'maintenance_mode', value: String(newValue) })
            })
            if (res.ok) {
                setMaintenanceMode(newValue)
                toast.success(`Maintenance Mode ${newValue ? 'Enabled' : 'Disabled'}`)
            } else {
                toast.error('Failed to update setting')
            }
        } catch (error) {
            toast.error('Error updating setting')
        }
    }

    if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl"></div>

    return (
        <div className="bg-white dark:bg-fixed-medium p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
                ⚙️ System Settings
            </h3>

            <div className="flex items-center justify-between p-4 bg-background dark:bg-fixed-dark rounded-lg border border-border">
                <div>
                    <div className="font-semibold text-ink dark:text-white">Maintenance Mode</div>
                    <div className="text-sm text-mist">Restrict access to owners only</div>
                </div>
                <button
                    onClick={toggleMaintenance}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 ${maintenanceMode ? 'bg-emerald' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                >
                    <span
                        className={`${maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                </button>
            </div>
        </div>
    )
}

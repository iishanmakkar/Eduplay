'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface TwoFactorSettingsProps {
    enabled: boolean
}

export function TwoFactorSettings({ enabled: initialEnabled }: TwoFactorSettingsProps) {
    const [enabled, setEnabled] = useState(initialEnabled)
    const [step, setStep] = useState<'IDLE' | 'QR' | 'VERIFY'>('IDLE')
    const [qrCode, setQrCode] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const startSetup = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/2fa/generate', { method: 'POST' })
            if (!res.ok) throw new Error('Failed to generate secret')
            const data = await res.json()
            setQrCode(data.qrCode)
            setStep('QR')
        } catch (error) {
            toast.error('Failed to start 2FA setup')
        } finally {
            setLoading(false)
        }
    }

    const verifyAndEnable = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || 'Verification failed')
            }

            toast.success('2FA Enabled Successfully')
            setEnabled(true)
            setStep('IDLE')
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    const disable2FA = async () => {
        if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return

        setLoading(true)
        try {
            const res = await fetch('/api/auth/2fa/disable', { method: 'POST' })
            if (!res.ok) throw new Error('Failed to disable 2FA')

            toast.success('2FA Disabled')
            setEnabled(false)
            router.refresh()
        } catch (error) {
            toast.error('Failed to disable 2FA')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Add an extra layer of security to your account.
                    </p>
                </div>
                <div>
                    {enabled ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Enabled
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                            Disabled
                        </span>
                    )}
                </div>
            </div>

            {!enabled && step === 'IDLE' && (
                <button
                    onClick={startSetup}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-900 dark:bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Enable 2FA'}
                </button>
            )}

            {!enabled && step === 'QR' && (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg inline-block border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt="2FA QR Code" width={200} height={200} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold mb-2">Scan this QR code with your authenticator app</p>
                        <p className="text-xs text-slate-500 mb-4">Google Authenticator, Authy, etc.</p>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className="px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                            />
                            <button
                                onClick={verifyAndEnable}
                                disabled={loading || code.length < 6}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
                            >
                                Verify & Enable
                            </button>
                            <button
                                onClick={() => setStep('IDLE')}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {enabled && (
                <button
                    onClick={disable2FA}
                    disabled={loading}
                    className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Disable 2FA'}
                </button>
            )}
        </div>
    )
}

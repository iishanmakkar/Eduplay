'use client'

import { useState, useEffect } from 'react'
import { theme } from '@/lib/theme'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Copy, Key } from 'lucide-react'

interface ApiKey {
    id: string
    key: string
    name: string
    createdAt: string
    lastUsedAt: string | null
    isActive: boolean
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newKeyName, setNewKeyName] = useState('')

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/school/api-keys')
            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            }
        } catch (error) {
            toast.error('Failed to load API keys')
        } finally {
            setIsLoading(false)
        }
    }

    const createKey = async () => {
        if (!newKeyName.trim()) return

        try {
            const res = await fetch('/api/school/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            })

            if (res.ok) {
                const newKey = await res.json()
                setKeys([newKey, ...keys])
                setNewKeyName('')
                toast.success('API Key generated successfully')
            }
        } catch (error) {
            toast.error('Failed to create API key')
        }
    }

    const revokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return

        try {
            const res = await fetch(`/api/school/api-keys/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== id))
                toast.success('API Key revoked')
            }
        } catch (error) {
            toast.error('Failed to revoke key')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    return (
        <div className={theme.page + " p-8"}>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className={`text-3xl font-display font-bold ${theme.textPrimary} mb-2`}>
                        API Access Control
                    </h1>
                    <p className={theme.textSecondary}>
                        Manage keys for external integrations and data exports.
                    </p>
                </div>

                <div className={theme.card + " p-6 mb-8"}>
                    <h2 className={`text-xl font-bold mb-4 ${theme.textPrimary}`}>Generate New Key</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Key Name (e.g., Parent Portal Integration)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <button
                            onClick={createKey}
                            disabled={!newKeyName.trim()}
                            className={theme.buttonPrimary + " px-6 py-2 flex items-center gap-2 disabled:opacity-50"}
                        >
                            <Plus size={20} />
                            Generate Key
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-400">Loading keys...</div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Key className="mx-auto mb-4 opacity-20" size={48} />
                            <p className="text-slate-400">No API keys generated yet.</p>
                        </div>
                    ) : (
                        keys.map(key => (
                            <div key={key.id} className={theme.card + " p-6 flex items-center justify-between"}>
                                <div>
                                    <h3 className={`font-bold ${theme.textPrimary} mb-1`}>{key.name}</h3>
                                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                                        <span className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                                            {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                                        </span>
                                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                                        {key.lastUsedAt && (
                                            <span>Last Used: {new Date(key.lastUsedAt).toLocaleString()}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(key.key)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition"
                                        title="Copy Full Key"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => revokeKey(key.id)}
                                        className="p-2 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg text-rose-500 transition"
                                        title="Revoke Key"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

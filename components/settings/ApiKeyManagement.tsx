'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface ApiKey {
    id: string
    name: string
    permissions: string[]
    rateLimit: number
    isActive: boolean
    lastUsedAt: string | null
    expiresAt: string | null
    createdAt: string
}

export default function ApiKeyManagement() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [newKeyPermissions, setNewKeyPermissions] = useState(['read'])
    const [generatedKey, setGeneratedKey] = useState<string | null>(null)

    useEffect(() => {
        fetchApiKeys()
    }, [])

    const fetchApiKeys = async () => {
        try {
            const response = await fetch('/api/settings/api-keys')
            const data = await response.json()
            setApiKeys(data.apiKeys || [])
        } catch (error) {
            toast.error('Failed to load API keys')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            toast.error('Please enter a name for the API key')
            return
        }

        try {
            const response = await fetch('/api/settings/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newKeyName,
                    permissions: newKeyPermissions
                })
            })

            const data = await response.json()

            if (data.success) {
                setGeneratedKey(data.apiKey)
                setNewKeyName('')
                setNewKeyPermissions(['read'])
                fetchApiKeys()
                toast.success('API key generated successfully!')
            } else {
                toast.error(data.error || 'Failed to generate API key')
            }
        } catch (error) {
            toast.error('Failed to generate API key')
        }
    }

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/settings/api-keys/${keyId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('API key revoked successfully')
                fetchApiKeys()
            } else {
                toast.error('Failed to revoke API key')
            }
        } catch (error) {
            toast.error('Failed to revoke API key')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard!')
    }

    if (loading) {
        return <div className="text-center py-12">Loading...</div>
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Keys</h1>
                    <p className="text-gray-600 dark:text-mist mt-2">Manage API keys for integrating with EduPlay Pro</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                    + Generate New Key
                </button>
            </div>

            {/* API Keys List */}
            <div className="space-y-4">
                {apiKeys.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-ink-2 rounded-xl p-12 text-center border dark:border-border">
                        <div className="text-6xl mb-4">🔑</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No API Keys Yet</h3>
                        <p className="text-gray-600 dark:text-mist mb-6">Generate your first API key to start integrating with EduPlay Pro</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                        >
                            Generate API Key
                        </button>
                    </div>
                ) : (
                    apiKeys.map(key => (
                        <div key={key.id} className="bg-white dark:bg-fixed-medium border-2 border-gray-200 dark:border-border rounded-xl p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{key.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${key.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {key.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-mist space-y-1">
                                        <p><strong>Permissions:</strong> {key.permissions.join(', ')}</p>
                                        <p><strong>Rate Limit:</strong> {key.rateLimit} requests/hour</p>
                                        <p><strong>Created:</strong> {new Date(key.createdAt).toLocaleDateString()}</p>
                                        {key.lastUsedAt && (
                                            <p><strong>Last Used:</strong> {new Date(key.lastUsedAt).toLocaleDateString()}</p>
                                        )}
                                        {key.expiresAt && (
                                            <p><strong>Expires:</strong> {new Date(key.expiresAt).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteKey(key.id)}
                                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                >
                                    Revoke
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => !generatedKey && setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white dark:bg-background border dark:border-border rounded-2xl p-8 max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            {!generatedKey ? (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Generate API Key</h2>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Key Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newKeyName}
                                            onChange={e => setNewKeyName(e.target.value)}
                                            placeholder="e.g., Production API Key"
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-border dark:bg-fixed-dark dark:text-white rounded-lg focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Permissions
                                        </label>
                                        <div className="space-y-2">
                                            {['read', 'write', 'admin'].map(perm => (
                                                <label key={perm} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={newKeyPermissions.includes(perm)}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setNewKeyPermissions([...newKeyPermissions, perm])
                                                            } else {
                                                                setNewKeyPermissions(newKeyPermissions.filter(p => p !== perm))
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-300 capitalize">{perm}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-fixed-medium text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-fixed-dark transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateKey}
                                            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">API Key Generated!</h2>

                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">⚠️ Important</p>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            This is the only time you&apos;ll see this key. Copy it now and store it securely.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-fixed-medium rounded-lg p-4 mb-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{generatedKey}</code>
                                            <button
                                                onClick={() => copyToClipboard(generatedKey)}
                                                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition whitespace-nowrap"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setGeneratedKey(null)
                                            setShowCreateModal(false)
                                        }}
                                        className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                                    >
                                        Done
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Documentation Link */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">📚 API Documentation</h3>
                <p className="text-blue-800 dark:text-blue-300 mb-4">
                    Learn how to use the EduPlay Pro API to integrate with your applications.
                </p>
                <a
                    href="/docs/api"
                    target="_blank"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    View API Docs →
                </a>
            </div>
        </div>
    )
}

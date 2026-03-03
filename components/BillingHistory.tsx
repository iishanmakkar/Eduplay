'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Transaction {
    id: string
    razorpayPaymentId: string
    amount: number
    currency: string
    status: string
    plan: string
    description: string | null
    createdAt: string
}

export default function BillingHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/subscriptions/history')
            if (res.ok) {
                const data = await res.json()
                setTransactions(data.transactions)
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
        }).format(amount / 100) // Convert paise to rupees
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            success: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
        }

        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
                    }`}
            >
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Billing History
                </h2>
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">💳</div>
                    <p className="text-gray-600">No transactions yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Your payment history will appear here
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
                <button className="text-sm text-emerald hover:text-emerald-dark font-semibold">
                    Download All →
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Date
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Description
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Amount
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Status
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Invoice
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition"
                            >
                                <td className="py-4 px-4 text-sm text-gray-900">
                                    {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-4 px-4">
                                    <div className="text-sm font-medium text-gray-900">
                                        {transaction.description || `${transaction.plan} Plan`}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        ID: {transaction.razorpayPaymentId.slice(0, 20)}...
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                                    {formatAmount(transaction.amount, transaction.currency)}
                                </td>
                                <td className="py-4 px-4">
                                    {getStatusBadge(transaction.status)}
                                </td>
                                <td className="py-4 px-4">
                                    {transaction.status === 'success' && (
                                        <button className="text-sm text-emerald hover:text-emerald-dark font-semibold">
                                            Download
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                        Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">Powered by</span>
                        <span className="font-semibold text-gray-900">Razorpay</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

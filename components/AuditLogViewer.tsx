'use client'

import { useState } from 'react'

interface AuditLog {
    id: string
    action: string
    resource: string
    resourceId: string | null
    details: any
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
    user: {
        firstName: string
        email: string
    }
}

interface AuditLogViewerProps {
    logs: AuditLog[]
}

export default function AuditLogViewer({ logs }: AuditLogViewerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterAction, setFilterAction] = useState('')

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.resourceId && log.resourceId.includes(searchTerm))

        const matchesAction = filterAction ? log.action === filterAction : true

        return matchesSearch && matchesAction
    })

    return (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                <input
                    type="text"
                    placeholder="Search by user, resource..."
                    className="px-4 py-2 border border-border rounded-lg text-sm w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="px-4 py-2 border border-border rounded-lg text-sm w-full sm:w-48"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-surface text-mist font-medium border-b border-border">
                        <tr>
                            <th className="px-4 py-3">Timestamp</th>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">Resource</th>
                            <th className="px-4 py-3">Details</th>
                            <th className="px-4 py-3">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-mist">
                                    No audit logs found
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-surface transition">
                                    <td className="px-4 py-3 whitespace-nowrap text-mist">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-ink">{log.user.firstName}</div>
                                        <div className="text-xs text-mist">{log.user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                                                log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                    log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-xs text-ink">{log.resource}</div>
                                        {log.resourceId && <div className="text-xs text-mist font-mono truncate max-w-[100px]">{log.resourceId}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <details className="cursor-pointer">
                                            <summary className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View</summary>
                                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto max-w-xs">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </details>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-mist">
                                        {log.ipAddress || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

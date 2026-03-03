'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface BulkImportProps {
    classId: string
    onComplete?: () => void
}

export default function BulkStudentImport({ classId, onComplete }: BulkImportProps) {
    const [file, setFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [results, setResults] = useState<any>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResults(null)
        }
    }

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a CSV file')
            return
        }

        setImporting(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('classId', classId)

        try {
            const response = await fetch('/api/admin/bulk-import/students', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                setResults(data.results)
                toast.success(`Successfully imported ${data.results.successful} students!`)
                if (onComplete) onComplete()
            } else {
                toast.error(data.error || 'Import failed')
            }
        } catch (error) {
            toast.error('Import failed. Please try again.')
            console.error('Import error:', error)
        } finally {
            setImporting(false)
        }
    }

    const downloadTemplate = () => {
        window.open('/api/admin/bulk-import/template', '_blank')
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Bulk Import Students</h3>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">📋 Instructions:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Download the CSV template below</li>
                    <li>Fill in student information (email and name are required)</li>
                    <li>Upload the completed CSV file</li>
                    <li>Review the import results</li>
                </ol>
            </div>

            {/* Download Template */}
            <button
                onClick={downloadTemplate}
                className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
                📥 Download CSV Template
            </button>

            {/* File Upload */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload CSV File
                </label>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {file && (
                    <p className="mt-2 text-sm text-gray-600">
                        Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                )}
            </div>

            {/* Import Button */}
            <button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {importing ? 'Importing...' : 'Import Students'}
            </button>

            {/* Results */}
            {results && (
                <div className="mt-6 border-t pt-6">
                    <h4 className="font-bold text-gray-900 mb-4">Import Results</h4>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">{results.total}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{results.successful}</div>
                            <div className="text-sm text-gray-600">Successful</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                            <div className="text-sm text-gray-600">Failed</div>
                        </div>
                    </div>

                    {/* Errors */}
                    {results.errors && results.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h5 className="font-semibold text-red-900 mb-2">Errors:</h5>
                            <div className="max-h-48 overflow-y-auto">
                                {results.errors.map((error: any, index: number) => (
                                    <div key={index} className="text-sm text-red-800 mb-2">
                                        <strong>Row {error.row}:</strong> {error.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

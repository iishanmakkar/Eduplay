'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy', err)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
    )
}

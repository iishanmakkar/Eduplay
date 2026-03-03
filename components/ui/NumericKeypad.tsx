import React from 'react'

interface NumericKeypadProps {
    onInput: (value: string) => void
    onDelete: () => void
    onSubmit: () => void
    onClear: () => void
    disabled?: boolean
    className?: string
}

export default function NumericKeypad({
    onInput,
    onDelete,
    onSubmit,
    onClear,
    disabled = false,
    className = ''
}: NumericKeypadProps) {
    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '-', '0', 'DEL' // 'DEL' maps to Delete/Backspace
    ]

    const handlePress = (key: string) => {
        if (disabled) return

        if (key === 'DEL') {
            onDelete()
        } else {
            onInput(key)
        }
    }

    // Keyboard support
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            if (e.key >= '0' && e.key <= '9') {
                onInput(e.key)
            } else if (e.key === '-' || e.key === 'Minus') {
                onInput('-')
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                onDelete()
            } else if (e.key === 'Enter') {
                onSubmit()
            } else if (e.key === 'Escape') {
                onClear()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onInput, onDelete, onSubmit, onClear, disabled])

    return (
        <div className={`rounded-xl ${className}`}>
            {/* Number Grid: 3 columns */}
            <div className="grid grid-cols-3 gap-2 mb-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
                    <button
                        key={key}
                        onClick={() => handlePress(key)}
                        disabled={disabled}
                        className="h-16 text-2xl font-bold bg-white dark:bg-fixed-dark text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-fixed-medium border-2 border-gray-100 dark:border-border rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {key}
                    </button>
                ))}
            </div>

            {/* Bottom Row: Negative, Zero, Backspace */}
            <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                    onClick={() => handlePress('-')}
                    disabled={disabled}
                    className="h-16 text-2xl font-bold bg-gray-50 dark:bg-fixed-dark text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-fixed-medium border-2 border-gray-200 dark:border-border rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                    ±
                </button>
                <button
                    onClick={() => handlePress('0')}
                    disabled={disabled}
                    className="h-16 text-2xl font-bold bg-white dark:bg-fixed-dark text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-fixed-medium border-2 border-gray-100 dark:border-border rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                    0
                </button>
                <button
                    onClick={onDelete}
                    disabled={disabled}
                    className="h-16 text-2xl font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-red-100 dark:border-red-800 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                    ⌫
                </button>
            </div>

            {/* Action Row: Clear & Submit */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={onClear}
                    disabled={disabled}
                    className="h-16 text-xl font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-2 border-orange-100 dark:border-orange-800 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                    C
                </button>
                <button
                    onClick={onSubmit}
                    disabled={disabled}
                    className="col-span-2 h-16 bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                    SUBMIT ✓
                </button>
            </div>
        </div>
    )
}

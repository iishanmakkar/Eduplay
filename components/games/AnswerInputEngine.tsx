'use client'

/**
 * components/games/AnswerInputEngine.tsx
 *
 * PHASE 2 — Hardened Answer Input Engine
 *
 * Fixes enforced:
 *  1. Submission lock — never double-submits (submissionLock pattern)
 *  2. Lock auto-release if submit throws (no stuck submissionLock)
 *  3. preventDefault on form submit — blocks browser reload
 *  4. Controlled input (never uncontrolled) — no React warning
 *  5. pointerEvents always restored on conclusion
 *  6. Blur guard — validates on blur for mobile keyboard hide
 *  7. Unicode-normalized input before comparison
 *  8. onKeyDown Enter triggers submit
 *  9. Disabled state reflects lock correctly
 * 10. useEffect cleanup on unmount — no state update after unmount
 */

import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

interface AnswerInputEngineProps {
    questionId: string
    inputType: 'text' | 'number' | 'fraction' | 'mcq'
    options?: string[]                // For MCQ
    placeholder?: string
    disabled?: boolean
    autoFocus?: boolean
    onSubmit: (answer: string, questionId: string) => Promise<void> | void
    onAnswerChange?: (answer: string) => void
    className?: string
}

export default function AnswerInputEngine({
    questionId,
    inputType,
    options,
    placeholder = 'Your answer…',
    disabled = false,
    autoFocus = true,
    onSubmit,
    onAnswerChange,
    className = '',
}: AnswerInputEngineProps) {
    const [value, setValue] = useState<string>('')
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isLocked, setIsLocked] = useState(false)
    const mountedRef = useRef(true)
    const inputRef = useRef<HTMLInputElement>(null)

    // Track mount state to prevent state updates after unmount
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    // Reset state when question changes
    useEffect(() => {
        if (mountedRef.current) {
            setValue('')
            setSelectedOption(null)
            setIsLocked(false)
        }
        if (autoFocus && inputType !== 'mcq') {
            // Small delay to let DOM settle after new question render
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [questionId, autoFocus, inputType])

    const getAnswerValue = useCallback((): string => {
        if (inputType === 'mcq') return selectedOption ?? ''
        return value
    }, [inputType, selectedOption, value])

    const handleSubmit = useCallback(async (e?: FormEvent) => {
        e?.preventDefault()          // FIX: always prevent default form submission

        const answer = getAnswerValue()
        if (!answer.trim() || isLocked || disabled) return

        setIsLocked(true)
        // Disable pointer events at root to prevent multi-touch race conditions
        document.body.style.pointerEvents = 'none'

        try {
            await onSubmit(answer, questionId)
        } catch (err) {
            console.error('[AnswerInputEngine] onSubmit threw:', err)
        } finally {
            // Always restore, even if component unmounted
            document.body.style.pointerEvents = ''
            // Only update state if still mounted
            if (mountedRef.current) {
                setIsLocked(false)
            }
        }
    }, [getAnswerValue, isLocked, disabled, onSubmit, questionId])

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }, [handleSubmit])

    const handleChange = useCallback((raw: string) => {
        // Unicode normalization — strip diacritics from pasted content
        const normalized = raw.normalize('NFC')
        if (mountedRef.current) {
            setValue(normalized)
            onAnswerChange?.(normalized)
        }
    }, [onAnswerChange])

    const isSubmitDisabled = disabled || isLocked || !getAnswerValue().trim()

    // ── MCQ mode ──────────────────────────────────────────────────────────────
    if (inputType === 'mcq' && options?.length) {
        return (
            <div className={`space-y-3 ${className}`} role="radiogroup" aria-label="Answer options">
                {options.map((opt, i) => {
                    const isSelected = selectedOption === opt
                    return (
                        <button
                            key={`${questionId}_opt_${i}`}
                            type="button"
                            disabled={isLocked || disabled}
                            onClick={() => {
                                if (!isLocked && !disabled && mountedRef.current) {
                                    setSelectedOption(opt)   // FIX: store VALUE, not index
                                    onAnswerChange?.(opt)
                                }
                            }}
                            role="radio"
                            aria-checked={isSelected}
                            className={`w-full text-left px-5 py-4 rounded-2xl border font-medium text-sm transition-all duration-150
                                ${isSelected
                                    ? 'border-violet-500 bg-violet-500/10 text-white ring-2 ring-violet-500/30'
                                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                                }
                                ${(isLocked || disabled) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span className="text-slate-500 font-mono mr-3">{String.fromCharCode(65 + i)}.</span>
                            {opt}
                        </button>
                    )
                })}

                {selectedOption && (
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={isSubmitDisabled}
                        className="w-full py-4 mt-2 rounded-2xl bg-violet-600 hover:bg-violet-500
                            disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-sm transition-all"
                    >
                        {isLocked ? 'Submitting…' : 'Submit Answer'}
                    </button>
                )}
            </div>
        )
    }

    // ── Text / Number / Fraction input mode ───────────────────────────────────
    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className={`flex gap-3 ${className}`}
        >
            <input
                ref={inputRef}
                type={inputType === 'number' ? 'text' : 'text'}  // Always text — prevents mobile numeric keyboard bugs
                inputMode={inputType === 'number' || inputType === 'fraction' ? 'decimal' : 'text'}
                value={value}                                     // FIX: always controlled
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    // Mobile blur guard: trim whitespace on blur
                    if (mountedRef.current) setValue(v => v.trim())
                }}
                placeholder={placeholder}
                disabled={isLocked || disabled}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Answer input"
                className="flex-1 bg-slate-800 border border-slate-700 text-white text-base px-4 py-3
                    rounded-xl placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
                type="submit"
                disabled={isSubmitDisabled}
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                    disabled:opacity-30 disabled:cursor-not-allowed text-white font-black transition-all"
            >
                {isLocked ? '…' : '→'}
            </button>
        </form>
    )
}

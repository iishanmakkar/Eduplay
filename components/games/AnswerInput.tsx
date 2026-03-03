'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { answersMatch } from '@/lib/games/validation/question-integrity'

// --- Types ------------------------------------------------------------------

export type AnswerMode =
    | 'mcq'           // Classic 4-option MCQ
    | 'text'          // Free-text input
    | 'number'        // Integer input with numpad
    | 'decimal'       // Decimal input with numpad
    | 'fraction'      // a/b fraction input
    | 'negative'      // Integer with explicit +/- toggle
    | 'multi-select'  // Checkbox MCQ (multiple correct answers)
    | 'smartboard'    // MCQ with 2x targets, 500ms debounce

export interface AnswerInputProps {
    mode: AnswerMode
    value: string
    onChange: (value: string) => void
    onSubmit: (normalisedValue: string) => void
    disabled: boolean
    options?: string[]
    correctAnswer?: string
    selectedOption?: string | null
    tolerance?: number
    allowNegative?: boolean
    accessibility?: boolean
    placeholder?: string
    autoFocus?: boolean
}

// --- Normalisation ----------------------------------------------------------

function normalise(raw: string): string {
    return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

// --- MCQ Button -------------------------------------------------------------

function MCQButton({
    option, disabled, isCorrect, isWrong, onSelect, accessibility, smartboard,
}: {
    option: string; disabled: boolean; isCorrect: boolean; isWrong: boolean
    onSelect: (o: string) => void; accessibility: boolean; smartboard?: boolean
}) {
    // Multi-touch: track active pointer IDs to prevent double-submit
    const activePointers = useRef(new Set<number>())

    let cls = 'border-2 rounded-xl font-semibold text-left transition-all transform select-none '
    if (!disabled) {
        cls += 'border-slate-600/50 bg-slate-800/60 text-white hover:border-emerald-500/60 hover:bg-slate-700/60 hover:scale-[1.02] active:scale-95 cursor-pointer '
    } else if (isCorrect) {
        cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300 '
    } else if (isWrong) {
        cls += 'border-red-500 bg-red-500/20 text-red-300 '
    } else {
        cls += 'border-slate-700/30 bg-slate-800/30 text-slate-500 cursor-not-allowed '
    }

    const padding = smartboard ? 'p-7 text-lg' : accessibility ? 'p-5 text-base' : 'p-4 text-sm'

    return (
        <button
            type="button"
            disabled={disabled && !isCorrect && !isWrong}
            className={`${cls} ${padding}`}
            onPointerDown={(e) => {
                if (disabled) return
                if (activePointers.current.size > 0) return  // multi-touch guard
                activePointers.current.add(e.pointerId)
                e.preventDefault()
                onSelect(option)
            }}
            onPointerUp={(e) => activePointers.current.delete(e.pointerId)}
            onPointerCancel={(e) => activePointers.current.delete(e.pointerId)}
            aria-pressed={isCorrect || isWrong}
            aria-label={`Answer option: ${option}`}
        >
            {option}
        </button>
    )
}

// --- Main Component ---------------------------------------------------------

export default function AnswerInput({
    mode,
    value,
    onChange,
    onSubmit,
    disabled,
    options = [],
    correctAnswer,
    selectedOption,
    tolerance = 0.001,
    allowNegative = true,
    accessibility = false,
    placeholder,
    autoFocus = true,
}: AnswerInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [fracNum, setFracNum] = useState('')
    const [fracDen, setFracDen] = useState('')
    const [isNegative, setIsNegative] = useState(false)
    const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set())

    const isSmartboard = mode === 'smartboard'
    const isMCQ = mode === 'mcq' || isSmartboard
    const isFraction = mode === 'fraction'
    const isMultiSelect = mode === 'multi-select'
    const isNegativeMode = mode === 'negative'

    useEffect(() => {
        if (autoFocus && !isMCQ && !isFraction && !isMultiSelect && !disabled) {
            const t = setTimeout(() => inputRef.current?.focus(), 80)
            return () => clearTimeout(t)
        }
    }, [autoFocus, isMCQ, isFraction, isMultiSelect, disabled])

    // MCQ submit
    const handleMCQSelect = useCallback((option: string) => {
        if (disabled) return
        onChange(option)
        onSubmit(normalise(option))
    }, [disabled, onChange, onSubmit])

    // Text/Number keyboard submit
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (!disabled && value.trim()) onSubmit(normalise(value))
        }
    }, [disabled, value, onSubmit])

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        let v = e.target.value
        if (mode === 'number' || isNegativeMode) {
            v = v.replace(allowNegative || isNegativeMode ? /[^0-9-]/g : /[^0-9]/g, '')
        }
        if (mode === 'decimal') {
            v = v.replace(allowNegative ? /[^0-9.\-]/g : /[^0-9.]/g, '')
            const parts = v.split('.')
            if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
        }
        onChange(v)
    }, [disabled, mode, allowNegative, isNegativeMode, onChange])

    const handleSubmitClick = useCallback(() => {
        if (!disabled && value.trim()) onSubmit(normalise(value))
    }, [disabled, value, onSubmit])

    const handleKeypadPress = useCallback((key: string) => {
        if (disabled) return
        if (key === 'backspace') {
            onChange(value.slice(0, -1))
        } else if (key === 'submit') {
            if (value.trim()) onSubmit(normalise(value))
        } else if (key === '-' && !allowNegative) {
            // ignore
        } else if (key === '.' && mode !== 'decimal') {
            // ignore decimal in integer mode
        } else {
            onChange(value + key)
        }
    }, [disabled, value, onChange, onSubmit, allowNegative, mode])

    // Fraction mode
    const handleFractionSubmit = useCallback(() => {
        if (!fracNum || !fracDen) return
        const frac = `${fracNum}/${fracDen}`
        onChange(frac)
        onSubmit(frac)
    }, [fracNum, fracDen, onChange, onSubmit])

    // Negative mode
    const handleNegativeSubmit = useCallback(() => {
        const v = isNegative ? `-${value}` : value
        if (v.trim()) onSubmit(normalise(v))
    }, [value, isNegative, onSubmit])

    // Multi-select mode
    const toggleMultiSelect = useCallback((opt: string) => {
        setMultiSelected(prev => {
            const next = new Set(prev)
            next.has(opt) ? next.delete(opt) : next.add(opt)
            return next
        })
    }, [])

    const handleMultiSelectSubmit = useCallback(() => {
        const joined = [...multiSelected].sort().join('|')
        if (joined) onSubmit(joined)
    }, [multiSelected, onSubmit])

    // --- MCQ + Smartboard ---------------------------------------------------
    if (isMCQ) {
        return (
            <div
                className="grid grid-cols-2 gap-3"
                role="group"
                aria-label="Answer options"
                style={{ pointerEvents: disabled ? 'none' : 'auto' }}
            >
                {options.map(opt => {
                    const correct = correctAnswer ? answersMatch(opt, correctAnswer, tolerance) : false
                    const isCorrect = disabled && correct
                    const isWrong = disabled && opt === selectedOption && !correct
                    return (
                        <MCQButton
                            key={opt}
                            option={opt}
                            disabled={disabled}
                            isCorrect={isCorrect}
                            isWrong={isWrong}
                            onSelect={handleMCQSelect}
                            accessibility={accessibility ?? false}
                            smartboard={isSmartboard}
                        />
                    )
                })}
                {accessibility && (
                    <div aria-live="polite" className="sr-only" role="status">
                        {disabled && correctAnswer
                            ? selectedOption === correctAnswer ? 'Correct!' : `Wrong. The answer was ${correctAnswer}`
                            : ''}
                    </div>
                )}
            </div>
        )
    }

    // --- Fraction mode ------------------------------------------------------
    if (isFraction) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="text" inputMode="numeric"
                    value={fracNum}
                    onChange={e => setFracNum(e.target.value.replace(/[^0-9-]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleFractionSubmit()}
                    disabled={disabled}
                    placeholder="a"
                    className="w-20 rounded-xl border-2 border-slate-600 bg-slate-800/80 px-3 py-3 text-center text-white font-mono text-base focus:border-emerald-500 outline-none"
                    aria-label="Numerator"
                />
                <span className="text-2xl text-slate-400 font-bold">/</span>
                <input
                    type="text" inputMode="numeric"
                    value={fracDen}
                    onChange={e => setFracDen(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleFractionSubmit()}
                    disabled={disabled}
                    placeholder="b"
                    className="w-20 rounded-xl border-2 border-slate-600 bg-slate-800/80 px-3 py-3 text-center text-white font-mono text-base focus:border-emerald-500 outline-none"
                    aria-label="Denominator"
                />
                <button
                    type="button"
                    disabled={disabled || !fracNum || !fracDen}
                    onPointerDown={(e) => { e.preventDefault(); handleFractionSubmit() }}
                    className="px-5 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-sm active:scale-95 disabled:opacity-40"
                >
                    OK
                </button>
            </div>
        )
    }

    // --- Multi-select mode --------------------------------------------------
    if (isMultiSelect) {
        return (
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    {options.map(opt => (
                        <label
                            key={opt}
                            className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all
                                ${multiSelected.has(opt)
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                                    : 'border-slate-600 bg-slate-800/60 text-white'}
                                ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-emerald-400'}
                            `}
                        >
                            <input
                                type="checkbox"
                                checked={multiSelected.has(opt)}
                                onChange={() => !disabled && toggleMultiSelect(opt)}
                                className="w-5 h-5 accent-emerald-500"
                                aria-label={opt}
                            />
                            <span className="text-sm font-medium">{opt}</span>
                        </label>
                    ))}
                </div>
                <button
                    type="button"
                    disabled={disabled || multiSelected.size === 0}
                    onPointerDown={(e) => { e.preventDefault(); handleMultiSelectSubmit() }}
                    className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-sm active:scale-95 disabled:opacity-40"
                >
                    Submit Selection
                </button>
            </div>
        )
    }

    // --- Text / Number / Decimal / Negative mode ----------------------------
    const numPad = mode === 'number' || mode === 'decimal' || isNegativeMode

    return (
        <div className="flex flex-col gap-3">
            {/* Negative sign toggle */}
            {isNegativeMode && (
                <div className="flex gap-2 justify-center">
                    <button
                        type="button"
                        onClick={() => setIsNegative(false)}
                        className={`px-5 py-2 rounded-lg font-bold text-sm transition-all
                            ${!isNegative ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >+</button>
                    <button
                        type="button"
                        onClick={() => setIsNegative(true)}
                        className={`px-5 py-2 rounded-lg font-bold text-sm transition-all
                            ${isNegative ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >-</button>
                </div>
            )}
            {/* Input row */}
            <div className="flex gap-2">
                {isNegativeMode && (
                    <span className="flex items-center text-xl font-bold text-white pl-1">
                        {isNegative ? '-' : '+'}
                    </span>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder ?? (mode === 'text' ? 'Type your answer...' : '0')}
                    inputMode={mode === 'decimal' ? 'decimal' : mode === 'text' ? 'text' : 'numeric'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Answer input"
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-base font-mono font-semibold bg-slate-800/80 text-white outline-none transition-all
                        ${disabled ? 'border-slate-700/30 text-slate-500 cursor-not-allowed' : 'border-slate-600 focus:border-emerald-500'}
                        ${accessibility ? 'text-xl py-4' : ''}
                    `}
                />
                <button
                    type="button"
                    disabled={disabled || !value.trim()}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        isNegativeMode ? handleNegativeSubmit() : handleSubmitClick()
                    }}
                    className={`px-5 py-3 rounded-xl font-bold text-sm transition-all
                        ${disabled || !value.trim()
                            ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'
                        }
                    `}
                    aria-label="Submit answer"
                >
                    OK
                </button>
            </div>

            {/* Touch numpad */}
            {numPad && (
                <div className="grid grid-cols-4 gap-2 mt-1">
                    {['7', '8', '9', 'DEL', '4', '5', '6', '-', '1', '2', '3', '.', '', '0', '', '', 'GO'].map((k, i) => {
                        if (!k) return <div key={i} />
                        const key = k === 'DEL' ? 'backspace' : k === 'GO' ? 'submit' : k
                        const isSubmitBtn = k === 'GO'
                        const isAction = k === 'DEL' || k === 'GO'
                        return (
                            <button
                                key={i}
                                type="button"
                                disabled={disabled}
                                onPointerDown={(e) => { e.preventDefault(); handleKeypadPress(key) }}
                                className={`rounded-lg py-3 text-sm font-bold transition-all active:scale-90 cursor-pointer select-none
                                    ${isSubmitBtn ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                        : isAction ? 'bg-slate-600/80 text-slate-200 hover:bg-slate-500'
                                            : 'bg-slate-700/80 text-white hover:bg-slate-600'}
                                    ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
                                `}
                            >
                                {k}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Accessibility: aria-live result */}
            {accessibility && (
                <div aria-live="polite" className="sr-only" role="status">
                    {disabled ? 'Answer submitted' : 'Enter your answer'}
                </div>
            )}
        </div>
    )
}

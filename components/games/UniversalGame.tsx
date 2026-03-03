'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SessionMode } from '@/lib/game-engine/content-generator'
import { GradeBand } from '@/lib/game-engine/grade-mapper'
import { getGame } from '@/lib/games/registry'
import { QUESTION_BANKS } from '@/lib/games/question-banks'
import { generateQuestion } from '@/lib/games/generators/math-generator'
import { useSubmissionLock } from '@/hooks/useSubmissionLock'
import { GameErrorBoundary } from '@/components/games/GameErrorBoundary'
import AnswerInput from '@/components/games/AnswerInput'

interface UniversalGameProps {
    gameKey: string
    onGameEnd: (score: number, correctAnswers: number, totalQuestions: number, skillAssessments?: any[]) => void
    studentId?: string
    difficulty?: 1 | 2 | 3 | 4
    mode?: SessionMode
    grade?: GradeBand
}

interface Question {
    prompt: string
    options: string[]
    answer: string
    explanation?: string
    visual?: string
}

// All games now use the procedural generator (math + knowledge).
// The `generateQuestion` dispatcher covers 152 games. For any game not yet
// in the dispatcher, we fall back to the shuffled QUESTION_BANKS cycling approach.

const ROUND_TIME = 60
const POINTS_CORRECT = 10
const POINTS_STREAK_BONUS = 5


function UniversalGameInner({
    gameKey,
    onGameEnd,
    difficulty = 2,
    grade = '35',
}: UniversalGameProps) {
    const game = getGame(gameKey)
    const { lock: submissionLock } = useSubmissionLock(200)

    // For math-gen games: generate questions on the fly
    // For bank games: pre-load shuffled bank
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [score, setScore] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [answered, setAnswered] = useState(0)
    const [streak, setStreak] = useState(0)
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
    const [started, setStarted] = useState(false)
    const [countdown, setCountdown] = useState(3)
    const [finished, setFinished] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Current question (for math gen, always fresh)
    const [currentQ, setCurrentQ] = useState<Question | null>(null)

    // Initialize: try procedural generator first; fall back to bank
    useEffect(() => {
        const q = generateQuestion(gameKey)
        if (q) {
            setCurrentQ(q)
            setQuestions([{ prompt: 'placeholder', options: [], answer: '' }])
        } else {
            const bank = QUESTION_BANKS[gameKey]
            if (bank && bank.length > 0) {
                const shuffled = [...bank].sort(() => Math.random() - 0.5)
                setQuestions(shuffled)
                setCurrentQ(shuffled[0])
            }
        }
    }, [gameKey])

    // Countdown
    useEffect(() => {
        if (questions.length === 0) return
        if (countdown <= 0) { setStarted(true); return }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [countdown, questions])

    // Timer
    useEffect(() => {
        if (!started || finished) return
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { endGame(); return 0 }
                return t - 1
            })
        }, 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [started, finished])

    const endGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        setFinished(true)
        setTimeout(() => onGameEnd(score, correct, answered || 1), 1500)
    }, [score, correct, answered, onGameEnd])

    const handleAnswer = (option: string) => {
        if (selected !== null || finished || !currentQ) return
        if (!submissionLock()) return // debounce: prevents double-tap / multi-touch
        const right = option === currentQ.answer
        setSelected(option)
        setIsCorrect(right)
        setAnswered(a => a + 1)

        if (right) {
            const newStreak = streak + 1
            const bonus = newStreak >= 3 ? POINTS_STREAK_BONUS : 0
            setScore(s => s + POINTS_CORRECT + bonus)
            setCorrect(c => c + 1)
            setStreak(newStreak)
        } else {
            setStreak(0)
        }

        setTimeout(() => {
            setSelected(null)
            setIsCorrect(null)
            // Always try generator first
            const next = generateQuestion(gameKey)
            if (next) {
                setCurrentQ(next)
            } else {
                // Fallback: cycle through bank
                const nextIdx = (currentIdx + 1) % questions.length
                setCurrentIdx(nextIdx)
                setCurrentQ(questions[nextIdx])
            }
        }, 900)
    }

    if (!game) {
        return <div className="flex items-center justify-center h-64 text-slate-400">Game not found: {gameKey}</div>
    }

    // ── Countdown ────────────────────────────────────────────────────────────
    if (!started) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center px-6">
                <div className="text-8xl animate-bounce">{game.emoji}</div>
                <h2 className="text-3xl font-black text-white">{game.name}</h2>
                <p className="text-slate-300 max-w-md text-sm">{game.description}</p>
                {questions.length === 0 ? (
                    <div className="text-slate-400 text-sm animate-pulse">Preparing questions…</div>
                ) : (
                    <div className="text-8xl font-black text-emerald-400 animate-pulse">
                        {countdown > 0 ? countdown : 'GO!'}
                    </div>
                )}
                <div className="text-xs text-emerald-400/60 flex items-center gap-1">
                    <span>♾️</span> Unlimited unique questions
                </div>
            </div>
        )
    }

    // ── Finished ─────────────────────────────────────────────────────────────
    if (finished) {
        const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-6">
                <div className="text-6xl">{pct >= 70 ? '🏆' : pct >= 40 ? '⭐' : '💪'}</div>
                <h2 className="text-3xl font-black text-white">
                    {pct >= 70 ? 'Excellent!' : pct >= 40 ? 'Good Try!' : 'Keep Practicing!'}
                </h2>
                <div className="grid grid-cols-3 gap-4 mt-2">
                    {([{ label: 'Score', value: score }, { label: 'Correct', value: `${correct}/${answered}` }, { label: 'Accuracy', value: `${pct}%` }]).map(s => (
                        <div key={s.label} className="bg-slate-800/60 rounded-xl p-4">
                            <div className="text-2xl font-black text-emerald-400">{s.value}</div>
                            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
                <p className="text-slate-400 text-sm mt-2">Saving progress…</p>
            </div>
        )
    }

    if (!currentQ) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 flex-col gap-3">
                <div className="text-4xl">📚</div>
                <div>No questions yet for this game — check back soon!</div>
            </div>
        )
    }

    const progress = ((ROUND_TIME - timeLeft) / ROUND_TIME) * 100

    // ── Game screen ──────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4 max-w-2xl mx-auto px-4 py-6 select-none">
            {/* Header */}
            <div className="flex items-center justify-between text-sm font-semibold">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{game.emoji}</span>
                    <span className="text-slate-300">{game.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    {streak >= 3 && (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            🔥 {streak}× Streak
                        </span>
                    )}
                    <span className="text-emerald-400 font-black text-lg">{score}</span>
                    <span className={`${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-slate-300'} font-mono`}>
                        ⏱ {timeLeft}s
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
            </div>

            <div className="text-xs text-slate-500 text-right">
                Q{answered + 1} • ♾️ unlimited
            </div>

            {/* Question card */}
            <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
                {currentQ.visual && <div className="text-5xl text-center mb-4">{currentQ.visual}</div>}
                <p className="text-lg font-semibold text-white text-center leading-relaxed">{currentQ.prompt}</p>
            </div>

            {/* Options — via unified AnswerInput (MCQ mode) */}
            <AnswerInput
                mode="mcq"
                value={selected ?? ''}
                onChange={() => { }}
                onSubmit={handleAnswer}
                disabled={selected !== null}
                options={currentQ.options}
                correctAnswer={currentQ.answer}
                selectedOption={selected}
            />

            {/* Feedback */}
            {isCorrect !== null && (
                <div className={`text-center font-black text-lg animate-bounce ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCorrect
                        ? `✓ Correct! +${streak >= 3 ? POINTS_CORRECT + POINTS_STREAK_BONUS : POINTS_CORRECT}`
                        : `✗ Answer: ${currentQ.answer}`}
                </div>
            )}
        </div>
    )
}

export default function UniversalGame(props: UniversalGameProps) {
    return (
        <GameErrorBoundary gameKey={props.gameKey}>
            <UniversalGameInner {...props} />
        </GameErrorBoundary>
    )
}

/**
 * Split-Screen Engine
 * Manages independent game instances for multiplayer
 */

import { ContentPool, Question } from '../game-engine/content-generator'
import { PlayerSide } from './game-modes'

export interface PlayerGameState {
    side: PlayerSide
    questions: Question[]
    currentIndex: number
    score: number
    correct: number
    incorrect: number
    streak: number
    combo: number
    timeRemaining: number
    isFinished: boolean
}

export class SplitScreenEngine {
    private playerOneState: PlayerGameState
    private playerTwoState: PlayerGameState
    private gameStartTime: number = 0
    private timerInterval: NodeJS.Timeout | null = null

    constructor() {
        this.playerOneState = this.createInitialState(PlayerSide.LEFT)
        this.playerTwoState = this.createInitialState(PlayerSide.RIGHT)
    }

    private createInitialState(side: PlayerSide): PlayerGameState {
        return {
            side,
            questions: [],
            currentIndex: 0,
            score: 0,
            correct: 0,
            incorrect: 0,
            streak: 0,
            combo: 1,
            timeRemaining: 60,
            isFinished: false
        }
    }

    /**
     * Generate independent questions for each player
     * Ensures no duplicate questions at the same time
     */
    generateIndependentQuestions(
        pool: ContentPool,
        count: number,
        seed1: number,
        seed2: number
    ): { playerOne: Question[]; playerTwo: Question[] } {
        // Get all available questions
        const allQuestions = [
            ...pool.easy,
            ...pool.medium,
            ...pool.hard,
            ...pool.challenge
        ]

        if (allQuestions.length < count * 2) {
            console.warn('Not enough questions for independent generation')
        }

        // Shuffle with different seeds
        const shuffled1 = this.seededShuffle([...allQuestions], seed1)
        const shuffled2 = this.seededShuffle([...allQuestions], seed2)

        // Take different sets
        const playerOne = shuffled1.slice(0, count)
        const playerTwo = shuffled2.slice(count, count * 2)

        return { playerOne, playerTwo }
    }

    /**
     * Seeded shuffle for reproducible randomization
     */
    private seededShuffle<T>(array: T[], seed: number): T[] {
        const shuffled = [...array]
        let currentSeed = seed

        for (let i = shuffled.length - 1; i > 0; i--) {
            // Linear congruential generator
            currentSeed = (currentSeed * 9301 + 49297) % 233280
            const j = Math.floor((currentSeed / 233280) * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        return shuffled
    }

    /**
     * Initialize game with questions
     */
    initializeGame(
        playerOneQuestions: Question[],
        playerTwoQuestions: Question[],
        timeLimit: number = 60
    ) {
        this.playerOneState = {
            ...this.createInitialState(PlayerSide.LEFT),
            questions: playerOneQuestions,
            timeRemaining: timeLimit
        }

        this.playerTwoState = {
            ...this.createInitialState(PlayerSide.RIGHT),
            questions: playerTwoQuestions,
            timeRemaining: timeLimit
        }

        this.gameStartTime = Date.now()
    }

    /**
     * Start synchronized countdown timer
     */
    startTimer(onTick: (timeLeft: number) => void, onEnd: () => void) {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000)
            const timeLeft = Math.max(0, this.playerOneState.timeRemaining - elapsed)

            onTick(timeLeft)

            if (timeLeft === 0) {
                this.stopTimer()
                onEnd()
            }
        }, 100) // Update every 100ms for smooth display
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval)
            this.timerInterval = null
        }
    }

    /**
     * Handle answer for a specific player
     */
    handleAnswer(side: PlayerSide, isCorrect: boolean, points: number = 10) {
        const state = side === PlayerSide.LEFT ? this.playerOneState : this.playerTwoState

        if (isCorrect) {
            state.correct++
            state.streak++
            state.combo = Math.min(Math.floor(state.streak / 3) + 1, 2) // Max 2x combo
            state.score += points * state.combo
        } else {
            state.incorrect++
            state.streak = 0
            state.combo = 1
        }

        state.currentIndex++

        if (state.currentIndex >= state.questions.length) {
            state.isFinished = true
        }

        // Update state
        if (side === PlayerSide.LEFT) {
            this.playerOneState = state
        } else {
            this.playerTwoState = state
        }
    }

    /**
     * Get current state for a player
     */
    getPlayerState(side: PlayerSide): PlayerGameState {
        return side === PlayerSide.LEFT ? this.playerOneState : this.playerTwoState
    }

    /**
     * Check if game is over
     */
    isGameOver(): boolean {
        return this.playerOneState.isFinished && this.playerTwoState.isFinished
    }

    /**
     * Determine winner
     */
    getWinner(): PlayerSide | 'tie' {
        if (this.playerOneState.score > this.playerTwoState.score) {
            return PlayerSide.LEFT
        } else if (this.playerTwoState.score > this.playerOneState.score) {
            return PlayerSide.RIGHT
        } else {
            return 'tie'
        }
    }

    /**
     * Get final stats for both players
     */
    getFinalStats() {
        return {
            playerOne: {
                score: this.playerOneState.score,
                correct: this.playerOneState.correct,
                incorrect: this.playerOneState.incorrect,
                accuracy: this.playerOneState.correct / (this.playerOneState.correct + this.playerOneState.incorrect) * 100,
                maxStreak: this.playerOneState.streak
            },
            playerTwo: {
                score: this.playerTwoState.score,
                correct: this.playerTwoState.correct,
                incorrect: this.playerTwoState.incorrect,
                accuracy: this.playerTwoState.correct / (this.playerTwoState.correct + this.playerTwoState.incorrect) * 100,
                maxStreak: this.playerTwoState.streak
            }
        }
    }

    /**
     * Reset for new game
     */
    reset() {
        this.stopTimer()
        this.playerOneState = this.createInitialState(PlayerSide.LEFT)
        this.playerTwoState = this.createInitialState(PlayerSide.RIGHT)
        this.gameStartTime = 0
    }
}

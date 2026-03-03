/**
 * Competition Engine
 * Handles competitive mechanics, bonuses, and momentum
 */

import { PlayerSide } from './game-modes'

export interface CompetitionState {
    playerOneScore: number
    playerTwoScore: number
    currentLeader: PlayerSide | 'tie'
    previousLeader: PlayerSide | 'tie'
    momentum: number // -100 to 100, negative = P1 winning, positive = P2 winning
    overtakeCount: number
}

export class CompetitionEngine {
    private state: CompetitionState

    constructor() {
        this.state = {
            playerOneScore: 0,
            playerTwoScore: 0,
            currentLeader: 'tie',
            previousLeader: 'tie',
            momentum: 0,
            overtakeCount: 0
        }
    }

    /**
     * Update scores and detect overtakes
     */
    updateScores(playerOneScore: number, playerTwoScore: number): boolean {
        this.state.playerOneScore = playerOneScore
        this.state.playerTwoScore = playerTwoScore

        // Update leader
        this.state.previousLeader = this.state.currentLeader

        if (playerOneScore > playerTwoScore) {
            this.state.currentLeader = PlayerSide.LEFT
        } else if (playerTwoScore > playerOneScore) {
            this.state.currentLeader = PlayerSide.RIGHT
        } else {
            this.state.currentLeader = 'tie'
        }

        // Calculate momentum (-100 to 100)
        const scoreDiff = playerTwoScore - playerOneScore
        const maxScore = Math.max(playerOneScore, playerTwoScore, 1)
        this.state.momentum = Math.max(-100, Math.min(100, (scoreDiff / maxScore) * 100))

        // Detect overtake
        const overtake = this.detectOvertake()
        if (overtake) {
            this.state.overtakeCount++
        }

        return overtake
    }

    /**
     * Detect if an overtake occurred
     */
    private detectOvertake(): boolean {
        return (
            this.state.previousLeader !== 'tie' &&
            this.state.currentLeader !== 'tie' &&
            this.state.previousLeader !== this.state.currentLeader
        )
    }

    /**
     * Calculate comeback bonus for trailing player
     */
    calculateComebackBonus(side: PlayerSide): number {
        const scoreDiff = Math.abs(this.state.playerOneScore - this.state.playerTwoScore)
        const isTrailing =
            (side === PlayerSide.LEFT && this.state.playerOneScore < this.state.playerTwoScore) ||
            (side === PlayerSide.RIGHT && this.state.playerTwoScore < this.state.playerOneScore)

        if (!isTrailing) return 1.0

        // Progressive comeback bonus
        if (scoreDiff > 100) return 1.5  // 50% bonus
        if (scoreDiff > 50) return 1.3   // 30% bonus
        if (scoreDiff > 25) return 1.2   // 20% bonus
        return 1.0
    }

    /**
     * Calculate speed bonus based on reaction time
     */
    calculateSpeedBonus(reactionTimeMs: number): number {
        if (reactionTimeMs < 1000) return 2.0   // <1s = 2x
        if (reactionTimeMs < 2000) return 1.5   // <2s = 1.5x
        if (reactionTimeMs < 3000) return 1.2   // <3s = 1.2x
        return 1.0
    }

    /**
     * Calculate accuracy bonus
     */
    calculateAccuracyBonus(accuracy: number): number {
        if (accuracy >= 95) return 1.5  // 95%+ = 1.5x
        if (accuracy >= 85) return 1.2  // 85%+ = 1.2x
        if (accuracy >= 75) return 1.1  // 75%+ = 1.1x
        return 1.0
    }

    /**
     * Get competition bar percentage (0-100)
     * 0 = Player 1 dominating, 50 = tied, 100 = Player 2 dominating
     */
    getCompetitionBarPercentage(): number {
        return ((this.state.momentum + 100) / 200) * 100
    }

    /**
     * Get momentum direction and strength
     */
    getMomentumInfo(): {
        direction: PlayerSide | 'neutral'
        strength: 'weak' | 'medium' | 'strong'
    } {
        const absMomentum = Math.abs(this.state.momentum)

        let direction: PlayerSide | 'neutral' = 'neutral'
        if (this.state.momentum < -10) direction = PlayerSide.LEFT
        else if (this.state.momentum > 10) direction = PlayerSide.RIGHT

        let strength: 'weak' | 'medium' | 'strong' = 'weak'
        if (absMomentum > 50) strength = 'strong'
        else if (absMomentum > 25) strength = 'medium'

        return { direction, strength }
    }

    /**
     * Get current state
     */
    getState(): CompetitionState {
        return { ...this.state }
    }

    /**
     * Reset competition
     */
    reset() {
        this.state = {
            playerOneScore: 0,
            playerTwoScore: 0,
            currentLeader: 'tie',
            previousLeader: 'tie',
            momentum: 0,
            overtakeCount: 0
        }
    }
}

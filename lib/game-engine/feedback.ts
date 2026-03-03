/**
 * Feedback & Animation System
 * Premium visual and audio feedback for game interactions
 */

import confetti from 'canvas-confetti'
import { soundManager } from '../multiplayer/sounds'

export class FeedbackSystem {
    private soundEnabled: boolean = true

    constructor(soundEnabled: boolean = true) {
        this.soundEnabled = soundEnabled
    }

    /**
     * Show correct answer animation
     */
    showCorrectAnimation(element?: HTMLElement) {
        if (element) {
            // Green pulse animation
            element.classList.add('animate-correct-pulse')
            setTimeout(() => element.classList.remove('animate-correct-pulse'), 600)
        }

        // Play sound via manager
        if (this.soundEnabled) {
            soundManager.playCorrect()
        }
    }

    /**
     * Show wrong answer animation
     */
    showWrongAnimation(element?: HTMLElement) {
        if (element) {
            // Red shake animation (enhanced)
            element.classList.add('animate-wrong-shake')
            // Also trigger screen shake for more impact
            document.body.classList.add('screen-shake')

            setTimeout(() => {
                element.classList.remove('animate-wrong-shake')
                document.body.classList.remove('screen-shake')
            }, 600)
        }

        // Play sound via manager
        if (this.soundEnabled) {
            soundManager.playWrong()
        }
    }

    /**
     * Show combo animation
     */
    showComboAnimation(multiplier: number, streak: number) {
        const comboElement = document.getElementById('combo-indicator')
        if (comboElement) {
            comboElement.classList.add('animate-combo-bounce')

            // Add fire effect for high streaks
            if (streak >= 5) {
                comboElement.classList.add('combo-fire')
            }

            setTimeout(() => {
                comboElement.classList.remove('animate-combo-bounce')
                comboElement.classList.remove('combo-fire')
            }, 600)
        }

        // Play sound via manager
        if (this.soundEnabled) {
            soundManager.playCombo(streak)
        }

        // Confetti for high combos
        if (streak >= 10) {
            this.triggerConfetti('legendary')
        } else if (streak >= 6) {
            this.triggerConfetti('amazing')
        }
    }

    /**
     * Show XP popup animation
     */
    showXPPopup(amount: number, element?: HTMLElement) {
        const popup = document.createElement('div')
        popup.className = 'xp-popup'
        popup.textContent = `+${amount} XP`

        if (element) {
            element.appendChild(popup)
        } else {
            document.body.appendChild(popup)
        }

        // Play sound via manager
        if (this.soundEnabled) {
            soundManager.playXP()
        }

        // Animate and remove
        setTimeout(() => {
            popup.classList.add('animate-xp-float')
        }, 10)

        setTimeout(() => {
            popup.remove()
        }, 1500)
    }

    /**
     * Trigger confetti celebration
     */
    triggerConfetti(type: 'normal' | 'amazing' | 'legendary' | 'perfect') {
        if (type === 'perfect' || type === 'legendary') {
            if (this.soundEnabled) soundManager.play('victory')
        }

        switch (type) {
            case 'legendary':
                // Gold confetti explosion
                confetti({
                    particleCount: 150,
                    spread: 180,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#FF6347']
                })
                break

            case 'amazing':
                // Purple confetti
                confetti({
                    particleCount: 100,
                    spread: 120,
                    origin: { y: 0.6 },
                    colors: ['#9333EA', '#A855F7', '#C084FC']
                })
                break

            case 'perfect':
                // Rainbow confetti
                confetti({
                    particleCount: 200,
                    spread: 360,
                    origin: { y: 0.5 },
                    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
                })
                break

            default:
                // Green confetti
                confetti({
                    particleCount: 50,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#10B981', '#34D399', '#6EE7B7']
                })
        }
    }

    /**
     * Show countdown animation (3-2-1-GO!)
     */
    static async showCountdown(): Promise<void> {
        // Prevent multiple simultaneous countdowns
        if (typeof document !== 'undefined' && document.querySelector('.countdown-overlay')) {
            return Promise.resolve()
        }

        return new Promise((resolve) => {
            const overlay = document.createElement('div')
            overlay.className = 'countdown-overlay'
            overlay.setAttribute('id', 'active-countdown-overlay')
            document.body.appendChild(overlay)

            // Play countdown sound
            soundManager.playCountdown()

            const numbers = ['3', '2', '1', 'GO!']
            let index = 0

            const cleanup = () => {
                const existing = document.getElementById('active-countdown-overlay')
                if (existing) existing.remove()
                resolve()
            }

            const showNext = () => {
                if (index >= numbers.length) {
                    cleanup()
                    return
                }

                // Clear previous number
                overlay.innerHTML = ''

                const countdownText = document.createElement('div')
                countdownText.className = 'countdown-text'
                countdownText.textContent = numbers[index]
                overlay.appendChild(countdownText)

                setTimeout(() => {
                    countdownText.classList.add('animate-countdown-zoom')
                }, 10)

                setTimeout(() => {
                    countdownText.remove()
                    index++
                    showNext()
                }, 800) // Synced with sound
            }

            showNext()

            // Safety timeout
            setTimeout(cleanup, 5000)
        })
    }

    // Removed private sound methods as they are now handled by soundManager


    /**
     * Toggle sound on/off
     */
    toggleSound(enabled: boolean) {
        this.soundEnabled = enabled
    }
}

/**
 * Encouraging messages based on performance
 */
export const EncouragingMessages = {
    perfect: [
        "PERFECT! You're unstoppable! 🌟",
        "FLAWLESS! Absolutely amazing! ⭐",
        "LEGENDARY! Keep it up! 🏆",
        "INCREDIBLE! You're on fire! 🔥"
    ],
    excellent: [
        "EXCELLENT! Great job! 🎉",
        "OUTSTANDING! Well done! 💪",
        "AMAZING! You're crushing it! 🚀",
        "SUPERB! Keep going! ✨"
    ],
    good: [
        "GREAT WORK! 👍",
        "NICE JOB! Keep it up! 🎯",
        "WELL DONE! You're improving! 📈",
        "GOOD EFFORT! 💫"
    ],
    tryAgain: [
        "KEEP TRYING! You've got this! 💪",
        "PRACTICE MAKES PERFECT! 📚",
        "DON'T GIVE UP! You're learning! 🌱",
        "TRY AGAIN! You can do it! 🎯"
    ],
    combo: {
        3: "NICE COMBO! 🔥",
        5: "GREAT STREAK! ⚡",
        7: "AMAZING COMBO! 🌟",
        10: "LEGENDARY STREAK! 👑"
    },
    lightning: [
        "LIGHTNING FAST! ⚡",
        "SPEED DEMON! 🏎️",
        "TOO FAST! 🚀",
        "INSTANT! ✨"
    ]
}

/**
 * Get random encouraging message
 */
export function getEncouragingMessage(type: 'perfect' | 'excellent' | 'good' | 'tryAgain' | 'lightning'): string {
    const messages = EncouragingMessages[type]
    if (!messages || !messages.length) return "Great job! 🎯"
    return messages[Math.floor(Math.random() * messages.length)]
}

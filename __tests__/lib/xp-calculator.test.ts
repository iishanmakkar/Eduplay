import {
    calculateBaseXP,
    calculateStreakMultiplier,
    calculateFinalXP,
    calculateLevel,
    calculateXPToNextLevel,
    calculateLevelProgress,
} from '@/lib/xp-calculator'

describe('XP Calculator', () => {
    describe('calculateBaseXP', () => {
        it('should calculate base XP correctly for perfect score', () => {
            const score = 1000
            const accuracy = 1.0
            const expectedXP = Math.floor(1000 * 0.1 + 1.0 * 100) // 100 + 100 = 200
            expect(calculateBaseXP(score, accuracy)).toBe(expectedXP)
        })

        it('should calculate base XP correctly for partial accuracy', () => {
            const score = 500
            const accuracy = 0.75
            const expectedXP = Math.floor(500 * 0.1 + 0.75 * 100) // 50 + 75 = 125
            expect(calculateBaseXP(score, accuracy)).toBe(expectedXP)
        })

        it('should return 0 for zero score and accuracy', () => {
            expect(calculateBaseXP(0, 0)).toBe(0)
        })

        it('should handle high scores correctly', () => {
            const score = 10000
            const accuracy = 1.0
            const expectedXP = Math.floor(10000 * 0.1 + 1.0 * 100) // 1000 + 100 = 1100
            expect(calculateBaseXP(score, accuracy)).toBe(expectedXP)
        })
    })

    describe('calculateStreakMultiplier', () => {
        it('should return 1.0 for no streak', () => {
            expect(calculateStreakMultiplier(0)).toBe(1.0)
        })

        it('should return 1.5 for 5-day streak', () => {
            expect(calculateStreakMultiplier(5)).toBe(1.5)
        })

        it('should return 2.0 for 10-day streak', () => {
            expect(calculateStreakMultiplier(10)).toBe(2.0)
        })

        it('should cap at 2.5x for 15+ day streak', () => {
            expect(calculateStreakMultiplier(15)).toBe(2.5)
            expect(calculateStreakMultiplier(20)).toBe(2.5)
            expect(calculateStreakMultiplier(100)).toBe(2.5)
        })
    })

    describe('calculateFinalXP', () => {
        it('should calculate final XP with no streak', () => {
            const result = {
                score: 1000,
                accuracy: 1.0,
                timeSpent: 60,
                currentStreak: 0,
            }
            const baseXP = 200 // (1000 * 0.1) + (1.0 * 100)
            const finalXP = Math.floor(baseXP * 1.0)
            expect(calculateFinalXP(result)).toBe(finalXP)
        })

        it('should calculate final XP with 5-day streak', () => {
            const result = {
                score: 1000,
                accuracy: 1.0,
                timeSpent: 60,
                currentStreak: 5,
            }
            const baseXP = 200
            const finalXP = Math.floor(baseXP * 1.5) // 300
            expect(calculateFinalXP(result)).toBe(finalXP)
        })

        it('should calculate final XP with max streak', () => {
            const result = {
                score: 1000,
                accuracy: 1.0,
                timeSpent: 60,
                currentStreak: 15,
            }
            const baseXP = 200
            const finalXP = Math.floor(baseXP * 2.5) // 500
            expect(calculateFinalXP(result)).toBe(finalXP)
        })

        it('should handle undefined streak as 0', () => {
            const result = {
                score: 1000,
                accuracy: 1.0,
                timeSpent: 60,
            }
            const baseXP = 200
            expect(calculateFinalXP(result)).toBe(baseXP)
        })
    })

    describe('calculateLevel', () => {
        it('should return level 1 for 0 XP', () => {
            expect(calculateLevel(0)).toBe(1)
        })

        it('should return level 1 for 999 XP', () => {
            expect(calculateLevel(999)).toBe(1)
        })

        it('should return level 2 for 1000 XP', () => {
            expect(calculateLevel(1000)).toBe(2)
        })

        it('should return level 5 for 4500 XP', () => {
            expect(calculateLevel(4500)).toBe(5)
        })

        it('should return level 10 for 9999 XP', () => {
            expect(calculateLevel(9999)).toBe(10)
        })

        it('should return level 11 for 10000 XP', () => {
            expect(calculateLevel(10000)).toBe(11)
        })
    })

    describe('calculateXPToNextLevel', () => {
        it('should return 1000 for 0 XP', () => {
            expect(calculateXPToNextLevel(0)).toBe(1000)
        })

        it('should return 1 for 999 XP', () => {
            expect(calculateXPToNextLevel(999)).toBe(1)
        })

        it('should return 1000 for 1000 XP', () => {
            expect(calculateXPToNextLevel(1000)).toBe(1000)
        })

        it('should return 500 for 1500 XP', () => {
            expect(calculateXPToNextLevel(1500)).toBe(500)
        })
    })

    describe('calculateLevelProgress', () => {
        it('should return 0% for 0 XP', () => {
            expect(calculateLevelProgress(0)).toBe(0)
        })

        it('should return 50% for 500 XP', () => {
            expect(calculateLevelProgress(500)).toBe(50)
        })

        it('should return 99% for 999 XP', () => {
            expect(calculateLevelProgress(999)).toBe(99)
        })

        it('should return 0% for 1000 XP (new level)', () => {
            expect(calculateLevelProgress(1000)).toBe(0)
        })

        it('should return 75% for 1750 XP', () => {
            expect(calculateLevelProgress(1750)).toBe(75)
        })
    })
})

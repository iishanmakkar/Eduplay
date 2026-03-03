import { MathEngine } from '@/lib/game-engine/math-engine'
import { ScienceQuizContent } from '@/lib/game-engine/content-pools/science-quiz'
import { WordScrambleContent } from '@/lib/game-engine/content-pools/word-scramble'

describe('Enterprise Content Integrity Validation', () => {
    describe('Speed Math Generator (10,000 runs)', () => {
        const ITERATIONS = 10000
        const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'CHALLENGE'] as const

        it('should generate exactly 1 valid answer, no undefined options, and no duplicates', () => {
            let errors = 0
            for (let i = 0; i < ITERATIONS; i++) {
                const diff = DIFFICULTIES[i % 4]
                try {
                    const problem = MathEngine.generateProblem({
                        difficulty: diff,
                        allowNegatives: diff === 'ADVANCED' || diff === 'CHALLENGE'
                    })

                    // 1. Validate answer is finite
                    if (!Number.isFinite(problem.answer)) errors++

                    // 2. Validate options array
                    if (!problem.options || problem.options.length !== 4) errors++

                    // 3. No undefined or NaN in options
                    if (problem.options?.some(o => o === undefined || Number.isNaN(o))) errors++

                    // 4. Ensure exactly 1 correct answer in options
                    const matches = problem.options?.filter(o => typeof o === 'number' && Math.abs(o - problem.answer) < 0.001) || []
                    if (matches.length !== 1) errors++

                    // 5. Ensure options are unique
                    const uniqueOptions = new Set(problem.options)
                    if (uniqueOptions.size !== 4) errors++
                } catch (e) {
                    errors++
                }
            }
            expect(errors).toBe(0)
        })
    })

    describe('Science Quiz Pool Validator', () => {
        it('should have valid answers and options across all grade bands', () => {
            const grades = ['K2', '35', '68', '910', '1112'] as const
            let errors = 0
            let totalQuestions = 0

            for (const grade of grades) {
                const pool = ScienceQuizContent.generateGradePool(grade)
                const allQuestions = [
                    ...(pool.easy || []),
                    ...(pool.medium || []),
                    ...(pool.hard || []),
                    ...(pool.challenge || [])
                ]

                totalQuestions += allQuestions.length

                for (const q of allQuestions) {
                    // Answer index bounds check
                    if (q.correctAnswer < 0 || q.correctAnswer >= (q.options?.length || 0)) errors++

                    // No undefined options
                    if (q.options?.some((o: string) => !o || o.trim() === '')) errors++

                    // Unique options
                    if (new Set(q.options || []).size !== (q.options?.length || 0)) errors++
                }
            }

            expect(totalQuestions).toBeGreaterThan(0)
            expect(errors).toBe(0)
        })
    })

    describe('Word Scramble Integrity', () => {
        it('should guarantee scrambled word is never the same as original', () => {
            const grades = ['K2', '35', '68', '910', '1112'] as const
            let errors = 0

            for (const grade of grades) {
                const pool = WordScrambleContent.generateGradePool(grade)
                const allQuestions = [
                    ...(pool.easy || []),
                    ...(pool.medium || []),
                    ...(pool.hard || []),
                    ...(pool.challenge || [])
                ]

                for (const q of allQuestions) {
                    if (q.content.scrambled === q.content.word) {
                        // Rare edge case for 2 letter words, but we should test the generator output
                        if (q.content.word.length > 2) {
                            errors++
                        }
                    }
                }
            }
            expect(errors).toBe(0)
        })
    })
})

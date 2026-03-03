/**
 * Content Generation Engine
 * Generates dynamic, unique content for every game session
 */

export interface Question {
    id: string
    type: string
    difficulty: string
    content: any
    correctAnswer: any
    options?: any[]
    timeLimit?: number
    points: number
}

export interface ContentPool {
    easy: Question[]
    medium: Question[]
    hard: Question[]
    challenge: Question[]
}

export class SeededRandom {
    private seed: number

    constructor(seed: number = Date.now()) {
        this.seed = seed
    }

    // Linear congruential generator
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
    }

    // Random integer between min and max (inclusive)
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min
    }

    // Shuffle array using Fisher-Yates
    shuffle<T>(array: T[]): T[] {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i)
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    // Pick random element
    pick<T>(array: T[]): T {
        return array[this.nextInt(0, array.length - 1)]
    }

    // Pick N random elements
    pickN<T>(array: T[], n: number): T[] {
        const shuffled = this.shuffle(array)
        return shuffled.slice(0, Math.min(n, shuffled.length))
    }
}

export class ContentGenerator {
    private random: SeededRandom

    constructor(seed?: number) {
        this.random = new SeededRandom(seed)
    }

    /**
     * Generate a game session with mixed difficulty
     */
    generateSession(
        pool: ContentPool,
        count: number,
        difficultyMix: {
            easy: number    // percentage
            medium: number  // percentage
            hard: number    // percentage
            challenge?: number // percentage
        } = { easy: 40, medium: 40, hard: 20 }
    ): Question[] {
        const questions: Question[] = []

        // Calculate counts for each difficulty
        const easyCount = Math.floor((count * difficultyMix.easy) / 100)
        const mediumCount = Math.floor((count * difficultyMix.medium) / 100)
        const hardCount = Math.floor((count * difficultyMix.hard) / 100)
        const challengeCount = difficultyMix.challenge
            ? Math.floor((count * difficultyMix.challenge) / 100)
            : 0

        // Adjust to reach exact count
        let remaining = count - (easyCount + mediumCount + hardCount + challengeCount)

        // Select questions from each pool
        if (pool.easy.length > 0) {
            questions.push(...this.random.pickN(pool.easy, easyCount))
        }
        if (pool.medium.length > 0) {
            questions.push(...this.random.pickN(pool.medium, mediumCount))
        }
        if (pool.hard.length > 0) {
            questions.push(...this.random.pickN(pool.hard, hardCount))
        }
        if (pool.challenge && pool.challenge.length > 0) {
            questions.push(...this.random.pickN(pool.challenge, challengeCount))
        }

        // Fill remaining with medium difficulty
        while (remaining > 0 && pool.medium.length > 0) {
            questions.push(this.random.pick(pool.medium))
            remaining--
        }

        // Shuffle final question order
        const shuffled = this.random.shuffle(questions)

        // Randomize answer positions for each question
        return shuffled.map(q => this.randomizeAnswers(q))
    }

    /**
     * Randomize answer positions for multiple choice
     */
    private randomizeAnswers(question: Question): Question {
        if (!question.options || question.options.length === 0) {
            return question
        }

        // If correctAnswer is an index, get the actual value first
        let correctValue = question.correctAnswer
        if (typeof question.correctAnswer === 'number' && question.type === 'multiple-choice') {
            correctValue = question.options[question.correctAnswer]
        }

        const shuffledOptions = this.random.shuffle(question.options)

        return {
            ...question,
            options: shuffledOptions,
            // Update correct answer index if needed
            correctAnswer: question.type === 'multiple-choice'
                ? shuffledOptions.indexOf(correctValue)
                : question.correctAnswer
        }
    }

    /**
     * Get difficulty mix based on student level
     */
    static getDifficultyMix(level: 1 | 2 | 3 | 4): {
        easy: number
        medium: number
        hard: number
        challenge?: number
    } {
        switch (level) {
            case 1: // Beginner
                return { easy: 60, medium: 30, hard: 10 }
            case 2: // Intermediate
                return { easy: 30, medium: 50, hard: 20 }
            case 3: // Advanced
                return { easy: 10, medium: 40, hard: 40, challenge: 10 }
            case 4: // Challenge Mode
                return { easy: 0, medium: 20, hard: 50, challenge: 30 }
            default:
                return { easy: 40, medium: 40, hard: 20 }
        }
    }

    /**
     * Generate seed from student ID and date
     * Ensures same student gets same content on same day
     */
    static generateSeed(studentId: string, date: Date = new Date()): number {
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
        const combined = `${studentId}-${dateStr}`

        // Simple hash function
        let hash = 0
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
        }

        return Math.abs(hash)
    }
}

/**
 * Session Mode Configuration
 */
export enum SessionMode {
    QUICK = 'QUICK',
    STANDARD = 'STANDARD',
    CHALLENGE = 'CHALLENGE',
    PRACTICE = 'PRACTICE'
}

export interface SessionConfig {
    mode: SessionMode
    questionCount: number
    timeLimit?: number // seconds
    earnXP: boolean
    difficulty: 1 | 2 | 3 | 4
    showExplanations: boolean
}

export class SessionManager {
    static getConfig(mode: SessionMode, difficulty: 1 | 2 | 3 | 4 = 2): SessionConfig {
        switch (mode) {
            case SessionMode.QUICK:
                return {
                    mode,
                    questionCount: 10,
                    timeLimit: 300, // 5 minutes
                    earnXP: true,
                    difficulty,
                    showExplanations: false
                }

            case SessionMode.STANDARD:
                return {
                    mode,
                    questionCount: 20,
                    timeLimit: 600, // 10 minutes
                    earnXP: true,
                    difficulty,
                    showExplanations: true
                }

            case SessionMode.CHALLENGE:
                return {
                    mode,
                    questionCount: 15,
                    timeLimit: 300, // 5 minutes (harder + faster)
                    earnXP: true,
                    difficulty: 4, // Always challenge difficulty
                    showExplanations: true
                }

            case SessionMode.PRACTICE:
                return {
                    mode,
                    questionCount: 999, // Unlimited
                    timeLimit: undefined,
                    earnXP: false,
                    difficulty,
                    showExplanations: true
                }

            default:
                return this.getConfig(SessionMode.STANDARD, difficulty)
        }
    }
}

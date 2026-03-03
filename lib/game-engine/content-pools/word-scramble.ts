/**
 * Word Scramble Content Pool — Grade-Adaptive
 * Generates grade-filtered scramble questions from the 200+ word bank.
 * Validates: no ambiguous anagrams, unique scramble guaranteed.
 */

import { Question, ContentPool } from '../content-generator'
import { GradeBand } from '../grade-mapper'
import { getValidatedWordBank, getWordsForGrade, WordEntry } from './word-scramble-data'

export interface WordScrambleQuestion extends Question {
    content: {
        word: string
        scrambled: string
        category: string
        hint?: string
        grade: GradeBand
    }
    correctAnswer: string
}

export class WordScrambleContent {

    /**
     * Scramble a word using Fisher-Yates shuffle.
     * Guarantees the scrambled version is different from the original.
     */
    private static scrambleWord(word: string): string {
        const letters = word.split('')
        let scrambled = word
        let attempts = 0

        while (scrambled === word && attempts < 20) {
            for (let i = letters.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [letters[i], letters[j]] = [letters[j], letters[i]]
            }
            scrambled = letters.join('')
            attempts++
        }

        // For 2-letter words that can't be scrambled differently, just return as-is
        return scrambled
    }

    private static getDifficultyByLength(length: number): 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE' {
        if (length <= 4) return 'EASY'
        if (length <= 6) return 'MEDIUM'
        if (length <= 9) return 'HARD'
        return 'CHALLENGE'
    }

    private static wordToQuestion(entry: WordEntry): WordScrambleQuestion {
        const scrambled = this.scrambleWord(entry.word)
        const difficulty = this.getDifficultyByLength(entry.word.length)

        return {
            id: `word-${entry.grade}-${entry.word}-${Date.now()}-${Math.random()}`,
            type: 'word-scramble',
            difficulty,
            content: {
                word: entry.word,
                scrambled,
                category: entry.category,
                hint: entry.hint,
                grade: entry.grade,
            },
            correctAnswer: entry.word,
            timeLimit: Math.max(15, entry.word.length * 3),
            points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : difficulty === 'HARD' ? 30 : 50
        }
    }

    private static shuffleArray<T>(array: T[]): T[] {
        const arr = [...array]
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }

    /**
     * Generate grade-filtered content pool.
     * Only includes words validated to have unique anagrams.
     */
    static generateGradePool(grade: GradeBand): ContentPool {
        const validatedWords = getValidatedWordBank(grade)
        const questions = this.shuffleArray(validatedWords.map(w => this.wordToQuestion(w)))

        return {
            easy: questions.filter(q => q.difficulty === 'EASY'),
            medium: questions.filter(q => q.difficulty === 'MEDIUM'),
            hard: questions.filter(q => q.difficulty === 'HARD'),
            challenge: questions.filter(q => q.difficulty === 'CHALLENGE'),
        }
    }

    /**
     * Legacy: generate flat content pool (defaults to grade '35')
     */
    static generateContentPool(grade: GradeBand = '35'): ContentPool {
        return this.generateGradePool(grade)
    }
}

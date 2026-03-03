/**
 * Science Quiz Content Pool — Grade-Adaptive
 * Filters the large science-data.ts pool by grade band.
 * Each grade band gets 300+ questions across 4 difficulty tiers.
 */

import { Question, ContentPool } from '../content-generator'
import { GradeBand, GradeMapper } from '../grade-mapper'

export interface ScienceQuestion extends Question {
    content: {
        question: string
        topic: 'biology' | 'chemistry' | 'physics' | 'earth-science' | 'astronomy' | 'environment'
        imageUrl?: string
        explanation?: string
        grade?: GradeBand
    }
    correctAnswer: number
    options: string[]
}

export class ScienceQuizContent {

    /**
     * Generate grade-filtered content pool.
     * Questions in science-data.ts should have a 'grade' field.
     * Falls back to difficulty-only filtering for backward compatibility.
     */
    static generateGradePool(grade: GradeBand): ContentPool {
        const { SCIENCE_QUESTIONS_POOL } = require('./science-data')

        // Filter by grade band if grade field exists, otherwise use all
        const gradeOrder: GradeBand[] = ['K2', '35', '68', '910', '1112']
        const gradeIdx = gradeOrder.indexOf(grade)

        const filtered = SCIENCE_QUESTIONS_POOL.filter((q: any) => {
            if (!q.grade) return true // backward compat: include all ungrouped questions
            const qIdx = gradeOrder.indexOf(q.grade as GradeBand)
            // Include questions at this grade level or easier
            return qIdx <= gradeIdx
        })

        const mapQuestion = (q: any, diff: string, index: number): ScienceQuestion => ({
            id: `sci-${grade}-${diff.toLowerCase()}-${index}-${Date.now()}`,
            type: 'multiple-choice',
            difficulty: diff as any,
            content: {
                question: q.content.question,
                topic: q.content.topic,
                explanation: q.content.explanation || `The correct answer is ${q.options[q.correctAnswer]}.`,
                grade: q.grade || grade,
            },
            correctAnswer: q.correctAnswer,
            options: q.options,
            timeLimit: GradeMapper.scaleTime(
                diff === 'EASY' ? 15 : diff === 'MEDIUM' ? 20 : diff === 'HARD' ? 25 : 30,
                grade
            ),
            points: diff === 'EASY' ? 10 : diff === 'MEDIUM' ? 20 : diff === 'HARD' ? 30 : 50
        })

        const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

        return {
            easy: shuffle(filtered.filter((q: any) => q.difficulty === 'EASY')).map((q: any, i: number) => mapQuestion(q, 'EASY', i)),
            medium: shuffle(filtered.filter((q: any) => q.difficulty === 'MEDIUM')).map((q: any, i: number) => mapQuestion(q, 'MEDIUM', i)),
            hard: shuffle(filtered.filter((q: any) => q.difficulty === 'HARD')).map((q: any, i: number) => mapQuestion(q, 'HARD', i)),
            challenge: shuffle(filtered.filter((q: any) => q.difficulty === 'CHALLENGE')).map((q: any, i: number) => mapQuestion(q, 'CHALLENGE', i)),
        }
    }

    /**
     * Legacy: generate flat content pool (defaults to grade '35')
     */
    static generateContentPool(grade: GradeBand = '35'): ContentPool {
        return this.generateGradePool(grade)
    }
}

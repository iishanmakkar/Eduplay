/**
 * Color Match Content Pool
 * Color recognition and reaction time challenges
 */

import { Question, ContentPool } from '../content-generator'

export interface ColorMatchQuestion extends Question {
    content: {
        displayColor: string
        displayText: string
        colorName: string
        isMatch: boolean
        gameMode: 'text-color' | 'color-name' | 'mixed'
    }
    correctAnswer: boolean
}

export class ColorMatchContent {
    private static colors = [
        { name: 'red', hex: '#EF4444', textColor: '#FEE2E2' },
        { name: 'blue', hex: '#3B82F6', textColor: '#DBEAFE' },
        { name: 'green', hex: '#10B981', textColor: '#D1FAE5' },
        { name: 'yellow', hex: '#F59E0B', textColor: '#FEF3C7' },
        { name: 'purple', hex: '#8B5CF6', textColor: '#EDE9FE' },
        { name: 'orange', hex: '#F97316', textColor: '#FFEDD5' },
        { name: 'pink', hex: '#EC4899', textColor: '#FCE7F3' },
        { name: 'cyan', hex: '#06B6D4', textColor: '#CFFAFE' },
    ]

    static generateContentPool(): ContentPool {
        return {
            easy: this.generateQuestions(20, 'text-color', 0.7), // 70% match rate
            medium: this.generateQuestions(20, 'color-name', 0.5), // 50% match rate
            hard: this.generateQuestions(20, 'mixed', 0.4), // 40% match rate
            challenge: this.generateQuestions(20, 'mixed', 0.3) // 30% match rate
        }
    }

    private static generateQuestions(
        count: number,
        mode: 'text-color' | 'color-name' | 'mixed',
        matchRate: number
    ): ColorMatchQuestion[] {
        const questions: ColorMatchQuestion[] = []

        for (let i = 0; i < count; i++) {
            const isMatch = Math.random() < matchRate
            const color1 = this.colors[Math.floor(Math.random() * this.colors.length)]
            const color2 = isMatch ? color1 : this.colors.filter(c => c.name !== color1.name)[Math.floor(Math.random() * (this.colors.length - 1))]

            let displayColor: string
            let displayText: string
            let colorName: string

            const gameMode = mode === 'mixed' ? (Math.random() > 0.5 ? 'text-color' : 'color-name') : mode

            if (gameMode === 'text-color') {
                // Text says one color, displayed in another color
                displayColor = color1.hex
                displayText = color2.name.toUpperCase()
                colorName = color1.name
            } else {
                // Color name vs actual color
                displayColor = color1.hex
                displayText = color1.name.toUpperCase()
                colorName = color2.name
            }

            const difficulty = mode === 'text-color' ? 'EASY' : mode === 'color-name' ? 'MEDIUM' : matchRate <= 0.3 ? 'CHALLENGE' : 'HARD'
            const points = difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : difficulty === 'HARD' ? 30 : 50

            questions.push({
                id: `color-${mode}-${i}`,
                type: 'color-match',
                difficulty: difficulty as any,
                content: {
                    displayColor,
                    displayText,
                    colorName,
                    isMatch,
                    gameMode
                },
                correctAnswer: isMatch,
                timeLimit: 3, // 3 seconds per question
                points
            })
        }

        return questions
    }
}

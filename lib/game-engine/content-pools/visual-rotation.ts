/**
 * Visual Rotation - Spatial reasoning with CSS transforms
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class VisualRotationGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(Number(seed))
    }

    private shapes = ['⬆️', '✈️', '🚀', '🚗', '🚙', '🦊', '🐸', '👆', '✏️', '🗡️', '🔫', '🔑']

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []

        for (let i = 0; i < count; i++) {
            const shape = this.shapes[Math.floor(this.rng.next() * this.shapes.length)]
            const initialRotation = difficulty === 'EASY' ? 0 : Math.floor(this.rng.next() * 8) * 45

            // Limit target rotations to clean increments based on difficulty
            // EASY: 90, 180, 270 (cw/ccw)
            // MEDIUM: 45, 135...
            const increments = difficulty === 'EASY' ? [90, 180, 270, -90] : [45, 90, 135, 180, -45, -90]
            const rotationInstruction = increments[Math.floor(this.rng.next() * increments.length)]

            const correctRotation = (initialRotation + rotationInstruction + 360) % 360

            // Generate distractors
            const options: number[] = [correctRotation]
            while (options.length < 4) {
                // Distractors are other valid angles (0, 90, 180, 270) or 45 increments
                const step = difficulty === 'EASY' ? 90 : 45
                const distractor = (Math.floor(this.rng.next() * (360 / step)) * step) % 360

                if (!options.includes(distractor)) {
                    options.push(distractor)
                }
            }

            // Shuffle options
            for (let j = options.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [options[j], options[k]] = [options[k], options[j]]
            }

            questions.push({
                id: `rotation-${Date.now()}-${i}`,
                type: 'visual-rotation',
                difficulty,
                content: {
                    shape,
                    rotation: rotationInstruction, // The instruction (e.g., +90)
                    initialRotation
                },
                options, // Angles
                correctAnswer: options.indexOf(correctRotation),
                timeLimit: 15, // Fast paced
                points: 20
            })
        }
        return questions
    }
}

export class VisualRotationContent {
    static generateContentPool(): ContentPool {
        const generator = new VisualRotationGenerator(Date.now())

        return {
            easy: generator.generate(20, 'EASY'),
            medium: generator.generate(20, 'MEDIUM'),
            hard: generator.generate(20, 'HARD'),
            challenge: generator.generate(20, 'HARD') // Reuse hard for challenge
        }
    }
}

/**
 * Shape Constructor - Abstract reasoning (Color mixing & Sequences)
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class ShapeConstructorGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(seed)
    }

    private colorMixes = [
        { pieces: ['🟥', '🟦'], target: '🟪', instruction: 'Combine Red and Blue' },
        { pieces: ['🟥', '🟨'], target: '🟧', instruction: 'Combine Red and Yellow' },
        { pieces: ['🟦', '🟨'], target: '🟩', instruction: 'Combine Blue and Yellow' },
        { pieces: ['⬜', '⚫'], target: 'Mz', instruction: 'Combine White and Black' }, // Mz is Grey? No emoji for grey square suitable. Using 🔘
    ]

    // Better Color Mixes using standard hearts/circles which have more colors
    private heartMixes = [
        { pieces: ['❤️', '💙'], target: '💜', instruction: 'Mix Red and Blue' },
        { pieces: ['❤️', '💛'], target: '🧡', instruction: 'Mix Red and Yellow' },
        { pieces: ['💙', '💛'], target: '💚', instruction: 'Mix Blue and Yellow' },
        { pieces: ['🖤', '🤍'], target: '🩶', instruction: 'Mix Black and White' },
    ]

    private sequences = [
        { seq: ['🕐', '🕑', '🕒'], next: '🕓', instruction: 'Complete the sequence' },
        { seq: ['🌑', '🌒', '🌓'], next: '🌔', instruction: 'Complete the moon phase' },
        { seq: ['🌱', '🌿', '🌳'], next: '🍎', instruction: 'Grow the tree' }, // Creative
        { seq: ['🥚', '🐣', '🐥'], next: '🐔', instruction: 'Complete the lifecycle' },
        { seq: ['🔴', '🟠', '🟡'], next: '🟢', instruction: 'Complete the rainbow' },
    ]

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []

        for (let i = 0; i < count; i++) {
            // 50% Color Mix, 50% Sequence
            const type = this.rng.next() > 0.5 ? 'MIX' : 'SEQ'

            let content, correctAnswer, options

            if (type === 'MIX') {
                const mix = this.heartMixes[Math.floor(this.rng.next() * this.heartMixes.length)]
                content = {
                    pieces: mix.pieces,
                    target: mix.target, // Actually hidden from user in prompt? No, user needs to select it.
                    instruction: mix.instruction
                }
                correctAnswer = mix.target

                // Distractors: Other heart colors
                const allHearts = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎']
                options = [correctAnswer]
                while (options.length < 4) {
                    const d = allHearts[Math.floor(this.rng.next() * allHearts.length)]
                    if (!options.includes(d)) options.push(d)
                }
            } else {
                const seq = this.sequences[Math.floor(this.rng.next() * this.sequences.length)]
                content = {
                    pieces: seq.seq,
                    target: seq.next,
                    instruction: seq.instruction
                }
                correctAnswer = seq.next

                // Distractors need to be relevant to the sequence type
                // Simplified: just pick random emojis from other sequences or a generated set
                const allSeqItems = this.sequences.map(s => s.next).concat(['🎱', '🏐', '🥎', '🌚', '🌵', '🥥'])
                options = [correctAnswer]
                while (options.length < 4) {
                    const d = allSeqItems[Math.floor(this.rng.next() * allSeqItems.length)]
                    if (!options.includes(d)) options.push(d)
                }
            }

            // Shuffle options
            for (let j = options.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [options[j], options[k]] = [options[k], options[j]]
            }

            questions.push({
                id: `shape-${Date.now()}-${i}`,
                type: 'shape-constructor',
                difficulty,
                content,
                options,
                correctAnswer: options.indexOf(correctAnswer),
                timeLimit: 20,
                points: 15
            })
        }
        return questions
    }
}

export class ShapeConstructorContent {
    static generateContentPool(): ContentPool {
        const generator = new ShapeConstructorGenerator(Date.now())
        return {
            easy: generator.generate(10, 'EASY'),
            medium: generator.generate(10, 'MEDIUM'),
            hard: generator.generate(10, 'HARD'),
            challenge: generator.generate(10, 'HARD')
        }
    }
}

/**
 * Mini Strategy - Quick strategic decisions
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class MiniStrategyGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(seed)
    }

    private scenarios = [
        // Ethical / Social
        {
            s: 'You found a lost wallet on the playground.',
            g: 'Civic Duty',
            o: ['Turn it in', 'Keep it', 'Hide it', 'Ignore it'],
            a: 0
        },
        {
            s: 'Your friend broke a toy and blamed you. What do you do?',
            g: 'Honesty',
            o: ['Tell the truth calmly', 'Yell at them', 'Break another toy', 'Cry'],
            a: 0
        },
        {
            s: 'You see someone sitting alone at lunch.',
            g: 'Kindness',
            o: ['Invite them to sit', 'Laugh at them', 'Ignore them', 'Throw food'],
            a: 0
        },
        // Time Management
        {
            s: 'You have a big test tomorrow morning.',
            g: 'Time Management',
            o: ['Study then sleep', 'Play games all night', 'Watch TV', 'Skip the test'],
            a: 0
        },
        {
            s: 'You want to buy a toy but don\'t have money.',
            g: 'Financial Responsibility',
            o: ['Save up allowance', 'Steal it', 'Beg parents', 'Cry'],
            a: 0
        },
        {
            s: 'You have homework and chores to do.',
            g: 'Responsibility',
            o: ['Do them before playing', 'Play first', 'Hide homework', 'Pay a friend'],
            a: 0
        },
        // Safety
        {
            s: 'A stranger offers you candy to get in their car.',
            g: 'Safety',
            o: ['Run and tell an adult', 'Get in the car', 'Take the candy', 'Talk to them'],
            a: 0
        },
        {
            s: 'You smell smoke in the house.',
            g: 'Emergency Safety',
            o: ['Get out and call 911', 'Hide under bed', 'Look for the fire', 'Fan it'],
            a: 0
        },
        // Environment
        {
            s: 'You finished a juice box at the park.',
            g: 'Environment',
            o: ['Recycle it', 'Throw on grass', 'Leave on bench', 'Bury it'],
            a: 0
        },
        {
            s: 'You see water running in the bathroom.',
            g: 'Conservation',
            o: ['Turn it off', 'Let it run', 'Play with it', 'Call a plumber'],
            a: 0
        }
    ]

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []
        // Simple shuffle of scenarios for now, could be dynamic templates later
        const shuffled = [...this.scenarios].sort(() => this.rng.next() - 0.5)

        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            const scen = shuffled[i]

            // Randomize options order
            const options = [...scen.o]
            const correctText = options[scen.a]

            for (let j = options.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [options[j], options[k]] = [options[k], options[j]]
            }

            questions.push({
                id: `mini-${Date.now()}-${i}`,
                type: 'mini-strategy',
                difficulty,
                content: {
                    scenario: scen.s,
                    goal: scen.g
                },
                options,
                correctAnswer: options.indexOf(correctText),
                timeLimit: 20,
                points: 10
            })
        }
        return questions
    }
}

export class MiniStrategyContent {
    static generateContentPool(): ContentPool {
        const generator = new MiniStrategyGenerator(Date.now())
        return {
            easy: generator.generate(10, 'EASY'),
            medium: generator.generate(10, 'MEDIUM'),
            hard: generator.generate(10, 'HARD'),
            challenge: generator.generate(10, 'HARD')
        }
    }
}

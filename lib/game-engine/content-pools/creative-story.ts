/**
 * Creative Story - Story completion challenges
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class CreativeStoryGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(seed)
    }

    private subjects = ['astronaut', 'wizard', 'pirate', 'dragon', 'rocket', 'kitten', 'robot', 'detective']
    private verbs = ['discovered', 'invented', 'chased', 'found', 'painted', 'ate', 'flew', 'climbed']
    private objects = ['a magic wand', 'a treasure map', 'a giant pizza', 'a laser sword', 'a hidden door', 'a golden key', 'a flying car']
    private settings = ['in the cave', 'on the moon', 'under the sea', 'on top of the castle', 'in the jungle', 'at school', 'in the secret lab']

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []

        for (let i = 0; i < count; i++) {
            // Template: The [Subject] [Verb] ___ [Setting].
            const subject = this.subjects[Math.floor(this.rng.next() * this.subjects.length)]
            const verb = this.verbs[Math.floor(this.rng.next() * this.verbs.length)]
            const object = this.objects[Math.floor(this.rng.next() * this.objects.length)]
            const setting = this.settings[Math.floor(this.rng.next() * this.settings.length)]

            // Remove "a " or "an " from object for the options list if needed, but keeping text clean is better
            // Lets mask one part.
            // 0: Subject, 1: Verb, 2: Object, 3: Setting
            const maskType = Math.floor(this.rng.next() * 4)

            let prompt = ''
            let correctAnswer = ''
            let distractors: string[] = []

            if (maskType === 0) {
                prompt = `The ___ ${verb} ${object} ${setting}.`
                correctAnswer = subject
                distractors = this.getDistractors(this.subjects, subject)
            } else if (maskType === 1) {
                prompt = `The ${subject} ___ ${object} ${setting}.`
                correctAnswer = verb
                distractors = this.getDistractors(this.verbs, verb)
            } else if (maskType === 2) {
                prompt = `The ${subject} ${verb} ___ ${setting}.`
                correctAnswer = object
                distractors = this.getDistractors(this.objects, object)
            } else {
                prompt = `The ${subject} ${verb} ${object} ___.`
                correctAnswer = setting
                distractors = this.getDistractors(this.settings, setting)
            }

            // Capitalize prompt
            prompt = prompt.charAt(0).toUpperCase() + prompt.slice(1)
            // Capitalize answer/distractors for consistency
            const formatOption = (s: string) => s // s.charAt(0).toUpperCase() + s.slice(1)

            const options = [correctAnswer, ...distractors].map(formatOption)

            // Shuffle options
            for (let j = options.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [options[j], options[k]] = [options[k], options[j]]
            }

            questions.push({
                id: `story-${Date.now()}-${i}`,
                type: 'creative-story',
                difficulty,
                content: {
                    prompt,
                    context: 'Story Completion'
                },
                options,
                correctAnswer: options.indexOf(formatOption(correctAnswer)),
                timeLimit: 30,
                points: 10
            })
        }
        return questions
    }

    private getDistractors(pool: string[], correct: string): string[] {
        const distractors: string[] = []
        while (distractors.length < 3) {
            const d = pool[Math.floor(this.rng.next() * pool.length)]
            if (d !== correct && !distractors.includes(d)) {
                distractors.push(d)
            }
        }
        return distractors
    }
}

export class CreativeStoryContent {
    static generateContentPool(): ContentPool {
        const generator = new CreativeStoryGenerator(Date.now())
        return {
            easy: generator.generate(15, 'EASY'),
            medium: generator.generate(15, 'MEDIUM'),
            hard: generator.generate(15, 'HARD'),
            challenge: generator.generate(15, 'HARD')
        }
    }
}

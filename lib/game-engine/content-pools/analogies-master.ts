/**
 * Analogies Master - Word relationships
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class AnalogiesGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(seed)
    }

    private relationships = [
        {
            type: 'Antonyms',
            pairs: [
                ['Hot', 'Cold'], ['Day', 'Night'], ['Up', 'Down'], ['In', 'Out'],
                ['Black', 'White'], ['Hard', 'Soft'], ['Fast', 'Slow'], ['Big', 'Small'],
                ['Happy', 'Sad'], ['Win', 'Lose'], ['Wet', 'Dry'], ['Rich', 'Poor'],
                ['Love', 'Hate'], ['Create', 'Destroy'], ['Start', 'Finish'], ['Open', 'Close']
            ]
        },
        {
            type: 'Synonyms',
            pairs: [
                ['Happy', 'Joyful'], ['Sad', 'Unhappy'], ['Big', 'Large'], ['Small', 'Tiny'],
                ['Fast', 'Quick'], ['Smart', 'Intelligent'], ['Start', 'Begin'], ['End', 'Finish'],
                ['Scared', 'Afraid'], ['Angry', 'Mad'], ['Run', 'Sprint'], ['Look', 'Stare'],
                ['Listen', 'Hear'], ['Speak', 'Talk'], ['Choose', 'Select'], ['Buy', 'Purchase']
            ]
        },
        {
            type: 'Part to Whole',
            pairs: [
                ['Finger', 'Hand'], ['Toe', 'Foot'], ['Leaf', 'Tree'], ['Petal', 'Flower'],
                ['Wheel', 'Car'], ['Page', 'Book'], ['Key', 'Keyboard'], ['Screen', 'Phone'],
                ['Room', 'House'], ['Slice', 'Pizza'], ['Chapter', 'Novel'], ['Scene', 'Movie'],
                ['Minute', 'Hour'], ['Day', 'Week'], ['Month', 'Year'], ['Sentnece', 'Paragraph']
            ]
        },
        {
            type: 'Animal to Young',
            pairs: [
                ['Cat', 'Kitten'], ['Dog', 'Puppy'], ['Cow', 'Calf'], ['Bear', 'Cub'],
                ['Duck', 'Duckling'], ['Chicken', 'Chick'], ['Sheep', 'Lamb'], ['Horse', 'Foal'],
                ['Deer', 'Fawn'], ['Pig', 'Piglet'], ['Goat', 'Kid'], ['Lion', 'Cub'],
                ['Frog', 'Tadpole'], ['Butterfly', 'Caterpillar'], ['Kangaroo', 'Joey'], ['Owl', 'Owlet']
            ]
        },
        {
            type: 'Worker to Tool',
            pairs: [
                ['Chef', 'Knife'], ['Doctor', 'Stethoscope'], ['Carpenter', 'Hammer'], ['Painter', 'Brush'],
                ['Writer', 'Pen'], ['Photographer', 'Camera'], ['Farmer', 'Tractor'], ['Firefighter', 'Hose'],
                ['Soldier', 'Rifle'], ['Musicann', 'Instrument'], ['Tailor', 'Needle'], ['Gardener', 'Rake'],
                ['Student', 'Pencil'], ['Programmer', 'Computer'], ['Teacher', 'Chalkboard'], ['Fisherman', 'Rod']
            ]
        }
    ]

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []

        for (let i = 0; i < count; i++) {
            // 1. Pick a relationship type
            const relIndex = Math.floor(this.rng.next() * this.relationships.length)
            const rel = this.relationships[relIndex]

            // 2. Pick 2 distinct pairs
            // e.g. [Hot, Cold] and [Day, Night]
            const pairIndices = this.pickManyIndices(rel.pairs.length, 2)
            const pair1 = rel.pairs[pairIndices[0]]
            const pair2 = rel.pairs[pairIndices[1]]

            // Form: A is to B as C is to ___
            // Randomly flip the direction? No, keep A->B for simplicity unless Hard.
            // If Hard, maybe flip the second pair: A->B as C->? (where ? is D)
            // Or A->B as ?->D (where ? is C)

            const questionText = `${pair1[0]} is to ${pair1[1]} as ${pair2[0]} is to ___`
            const correctAnswer = pair2[1]

            // 3. Generate Distractors
            const options = [correctAnswer]

            // Distractor Strategy:
            // 1. Semantic distractor from the same category (e.g. another 'Young' animal)
            // 2. Word from the first pair (e.g. 'Hot')
            // 3. Random word from other pairs

            // Add 1-2 words from the same relationship category (smart distractors)
            const otherPairs = rel.pairs.filter((_, idx) => !pairIndices.includes(idx))
            if (otherPairs.length > 0) {
                const vector = difficulty === 'EASY' ? 1 : 1 // Target is index 1
                const d1 = otherPairs[Math.floor(this.rng.next() * otherPairs.length)][1]
                if (!options.includes(d1)) options.push(d1)

                if (difficulty !== 'EASY') {
                    const d2 = otherPairs[Math.floor(this.rng.next() * otherPairs.length)][1]
                    if (!options.includes(d2)) options.push(d2)
                }
            }

            // Fill distinct randoms from anywhere if needed
            while (options.length < 4) {
                // Flatten all words
                const randRel = this.relationships[Math.floor(this.rng.next() * this.relationships.length)]
                const randPair = randRel.pairs[Math.floor(this.rng.next() * randRel.pairs.length)]
                const word = randPair[Math.floor(this.rng.next() * 2)]
                if (!options.includes(word) && word !== correctAnswer) {
                    options.push(word)
                }
            }

            // Shuffle
            for (let j = options.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [options[j], options[k]] = [options[k], options[j]]
            }

            questions.push({
                id: `ana-${Date.now()}-${i}`,
                type: 'analogies',
                difficulty,
                content: { analogy: questionText },
                options,
                correctAnswer: options.indexOf(correctAnswer),
                timeLimit: 25,
                points: 10
            })
        }
        return questions
    }

    private pickManyIndices(max: number, count: number): number[] {
        const indices: number[] = []
        while (indices.length < count) {
            const r = Math.floor(this.rng.next() * max)
            if (!indices.includes(r)) indices.push(r)
        }
        return indices
    }
}

export class AnalogiesMasterContent {
    static generateContentPool(): ContentPool {
        const generator = new AnalogiesGenerator(Date.now())
        return {
            easy: generator.generate(15, 'EASY'),
            medium: generator.generate(15, 'MEDIUM'),
            hard: generator.generate(15, 'HARD'),
            challenge: generator.generate(15, 'HARD')
        }
    }
}

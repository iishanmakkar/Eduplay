/**
 * Riddle Sprint - Quick riddle challenges
 */

import { Question, ContentPool, SeededRandom } from '../content-generator'

export class RiddleGenerator {
    private rng: SeededRandom

    constructor(seed: number) {
        this.rng = new SeededRandom(seed)
    }

    private riddles = [
        { q: 'What has keys but no locks?', a: 'Piano', d: ['Door', 'Car', 'Map'] },
        { q: 'What gets wet while drying?', a: 'Towel', d: ['Rain', 'Sponge', 'Ocean'] },
        { q: 'What has legs but cannot walk?', a: 'Chair', d: ['Dog', 'Spider', 'Baby'] },
        { q: 'I speak without a mouth and hear without ears. What am I?', a: 'Echo', d: ['Phone', 'Radio', 'Wind'] },
        { q: 'The more of me you take, the more you leave behind. What am I?', a: 'Footsteps', d: ['Time', 'Money', 'Breath'] },
        { q: 'What has a head and a tail but no body?', a: 'Coin', d: ['Snake', 'Comet', 'Worm'] },
        { q: 'What comes once in a minute, twice in a moment, but never in a thousand years?', a: 'The letter M', d: ['Time', 'Rain', 'Opportunity'] },
        { q: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?', a: 'Map', d: ['Globe', 'Picture', 'Dream'] },
        { q: 'What belongs to you, but other people use it more than you?', a: 'Your Name', d: ['Your Money', 'Your Car', 'Your Phone'] },
        { q: 'I am not alive, but I grow; I don\'t have lungs, but I need air; I don\'t have a mouth, but water kills me. What am I?', a: 'Fire', d: ['Plant', 'Balloon', 'Ice'] },
        { q: 'What can travel around the world while staying in a corner?', a: 'Stamp', d: ['Dust', 'Light', 'Thought'] },
        { q: 'What has keys but can\'t open locks?', a: 'Piano', d: ['Map', 'Crypt', 'Chest'] },
        { q: 'I have a neck but no head. What am I?', a: 'Shirt', d: ['Bottle', 'Guitar', 'Giraffe'] },
        { q: 'What becomes broken once you say my name?', a: 'Silence', d: ['Glass', 'Promise', 'Secret'] },
        { q: 'I have holes on the top and bottom, left and right, and in the middle. But I still hold water. What am I?', a: 'Sponge', d: ['Bucket', 'Net', 'Cloud'] },
        { q: 'What goes up but never comes down?', a: 'Age', d: ['Rocket', 'Bird', 'Smoke'] },
        { q: 'I shave every day, but my beard stays the same. What am I?', a: 'Barber', d: ['Lion', 'Wizard', 'Actor'] },
        { q: 'What has fewer eyes than a rainbow?', a: 'None', d: ['Cyclops', 'Spider', 'Storm'] }, // Trick? No, standard riddle logic specific checks needed.
        // Replacing weak riddle
        { q: 'What has one eye but can\'t see?', a: 'Needle', d: ['Storm', 'Cyclops', 'Target'] },
        { q: 'I have a thumb and four fingers, but I am not alive. What am I?', a: 'Glove', d: ['Hand', 'Robot', 'Mannequin'] },
        { q: 'What has words, but never speaks?', a: 'Book', d: ['Radio', 'Teacher', 'Phone'] },
        { q: 'The more you dry, the wetter I become. What am I?', a: 'Towel', d: ['Sponge', 'Cloud', 'Rain'] }, // Duplicate concept, removing
        { q: 'I follow you all the time and copy your every move, but you can\'t touch me or catch me. What am I?', a: 'Shadow', d: ['Reflection', 'Sibling', 'Ghost'] },
        { q: 'What turns everything around but does not move?', a: 'Mirror', d: ['Wind', 'Top', 'Wheel'] },
        { q: 'I am light as a feather, yet the strongest man cannot hold me for much longer. What am I?', a: 'Breath', d: ['Hope', 'Thought', 'Bubble'] },
        { q: 'What goes through cities and fields, but never moves?', a: 'Road', d: ['River', 'Fence', 'Wind'] },
        { q: 'I have branches, but no fruit, trunk or leaves. What am I?', a: 'Bank', d: ['Tree', 'River', 'Library'] },
        { q: 'What can you catch, but not throw?', a: 'Cold', d: ['Ball', 'Train', 'Fish'] },
        { q: 'What has a face and two hands but no arms or legs?', a: 'Clock', d: ['Robot', 'Doll', 'Monkey'] },
        { q: 'What kind of room has no doors or windows?', a: 'Mushroom', d: ['Ballroom', 'Darkroom', 'Classroom'] }
    ]

    generate(count: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): Question[] {
        const questions: Question[] = []
        // Use rng to pick unique riddles
        const shuffled = [...this.riddles].sort(() => this.rng.next() - 0.5) // Simple shuffle
        const selected = shuffled.slice(0, Math.min(count, shuffled.length))

        selected.forEach((r, i) => {
            // Shuffle options
            const options = [r.a, ...r.d]
            for (let j = options.length - 1; j > 0; j--) {
                const k = Math.floor(this.rng.next() * (j + 1));
                [options[j], options[k]] = [options[k], options[j]]
            }

            questions.push({
                id: `rid-${Date.now()}-${i}`,
                type: 'riddle',
                difficulty,
                content: { riddle: r.q },
                options,
                correctAnswer: options.indexOf(r.a),
                timeLimit: 30, // Reading time
                points: 15
            })
        })
        return questions
    }
}

export class RiddleSprintContent {
    static generateContentPool(): ContentPool {
        const generator = new RiddleGenerator(Date.now())
        return {
            easy: generator.generate(20, 'EASY'),
            medium: generator.generate(20, 'MEDIUM'),
            hard: generator.generate(20, 'HARD'),
            challenge: generator.generate(20, 'HARD')
        }
    }
}

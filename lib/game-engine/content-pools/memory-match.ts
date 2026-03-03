/**
 * Memory Match Content Pool
 * Themed card decks with multiple difficulty levels
 */

import { Question, ContentPool } from '../content-generator'

export interface MemoryCard {
    id: string
    emoji: string
    name: string
    theme: string
}

export interface MemoryMatchConfig extends Question {
    content: {
        gridSize: 4 | 6 | 8  // 4x4, 6x6, 8x8
        theme: 'animals' | 'fruits' | 'vehicles' | 'emojis' | 'nature' | 'sports' | 'space'
        cards: MemoryCard[]
        optimalMoves: number
    }
}

export class MemoryMatchContent {
    private static themes = {
        animals: [
            { emoji: '🐶', name: 'Dog' },
            { emoji: '🐱', name: 'Cat' },
            { emoji: '🐭', name: 'Mouse' },
            { emoji: '🐹', name: 'Hamster' },
            { emoji: '🐰', name: 'Rabbit' },
            { emoji: '🦊', name: 'Fox' },
            { emoji: '🐻', name: 'Bear' },
            { emoji: '🐼', name: 'Panda' },
            { emoji: '🐨', name: 'Koala' },
            { emoji: '🐯', name: 'Tiger' },
            { emoji: '🦁', name: 'Lion' },
            { emoji: '🐮', name: 'Cow' },
            { emoji: '🐷', name: 'Pig' },
            { emoji: '🐸', name: 'Frog' },
            { emoji: '🐵', name: 'Monkey' },
            { emoji: '🦄', name: 'Unicorn' },
        ],
        fruits: [
            { emoji: '🍎', name: 'Apple' },
            { emoji: '🍊', name: 'Orange' },
            { emoji: '🍋', name: 'Lemon' },
            { emoji: '🍌', name: 'Banana' },
            { emoji: '🍉', name: 'Watermelon' },
            { emoji: '🍇', name: 'Grapes' },
            { emoji: '🍓', name: 'Strawberry' },
            { emoji: '🍒', name: 'Cherry' },
            { emoji: '🍑', name: 'Peach' },
            { emoji: '🥝', name: 'Kiwi' },
            { emoji: '🍍', name: 'Pineapple' },
            { emoji: '🥭', name: 'Mango' },
            { emoji: '🍐', name: 'Pear' },
            { emoji: '🥥', name: 'Coconut' },
            { emoji: '🫐', name: 'Blueberry' },
            { emoji: '🍈', name: 'Melon' },
        ],
        vehicles: [
            { emoji: '🚗', name: 'Car' },
            { emoji: '🚕', name: 'Taxi' },
            { emoji: '🚙', name: 'SUV' },
            { emoji: '🚌', name: 'Bus' },
            { emoji: '🚎', name: 'Trolleybus' },
            { emoji: '🏎️', name: 'Race Car' },
            { emoji: '🚓', name: 'Police Car' },
            { emoji: '🚑', name: 'Ambulance' },
            { emoji: '🚒', name: 'Fire Truck' },
            { emoji: '🚐', name: 'Van' },
            { emoji: '🚚', name: 'Truck' },
            { emoji: '🚛', name: 'Semi Truck' },
            { emoji: '🚜', name: 'Tractor' },
            { emoji: '🏍️', name: 'Motorcycle' },
            { emoji: '🚲', name: 'Bicycle' },
            { emoji: '🛴', name: 'Scooter' },
        ],
        emojis: [
            { emoji: '😀', name: 'Happy' },
            { emoji: '😂', name: 'Laughing' },
            { emoji: '😍', name: 'Love' },
            { emoji: '🤔', name: 'Thinking' },
            { emoji: '😎', name: 'Cool' },
            { emoji: '🥳', name: 'Party' },
            { emoji: '😴', name: 'Sleepy' },
            { emoji: '🤗', name: 'Hugging' },
            { emoji: '🤩', name: 'Star Eyes' },
            { emoji: '😇', name: 'Angel' },
            { emoji: '🤓', name: 'Nerd' },
            { emoji: '😜', name: 'Winking' },
            { emoji: '🥰', name: 'Hearts' },
            { emoji: '😋', name: 'Yummy' },
            { emoji: '🤯', name: 'Mind Blown' },
            { emoji: '😱', name: 'Shocked' },
        ],
        nature: [
            { emoji: '🌸', name: 'Blossom' },
            { emoji: '🌺', name: 'Hibiscus' },
            { emoji: '🌻', name: 'Sunflower' },
            { emoji: '🌹', name: 'Rose' },
            { emoji: '🌷', name: 'Tulip' },
            { emoji: '🌲', name: 'Tree' },
            { emoji: '🌳', name: 'Deciduous Tree' },
            { emoji: '🌴', name: 'Palm Tree' },
            { emoji: '🌵', name: 'Cactus' },
            { emoji: '🍄', name: 'Mushroom' },
            { emoji: '🌾', name: 'Wheat' },
            { emoji: '🌿', name: 'Herb' },
            { emoji: '☘️', name: 'Shamrock' },
            { emoji: '🍀', name: 'Four Leaf Clover' },
            { emoji: '🌼', name: 'Daisy' },
            { emoji: '🌱', name: 'Seedling' },
        ],
        sports: [
            { emoji: '⚽', name: 'Soccer' },
            { emoji: '🏀', name: 'Basketball' },
            { emoji: '🏈', name: 'Football' },
            { emoji: '⚾', name: 'Baseball' },
            { emoji: '🎾', name: 'Tennis' },
            { emoji: '🏐', name: 'Volleyball' },
            { emoji: '🏉', name: 'Rugby' },
            { emoji: '🎱', name: 'Pool' },
            { emoji: '🏓', name: 'Ping Pong' },
            { emoji: '🏸', name: 'Badminton' },
            { emoji: '🥊', name: 'Boxing' },
            { emoji: '🥋', name: 'Martial Arts' },
            { emoji: '🎯', name: 'Darts' },
            { emoji: '🏹', name: 'Archery' },
            { emoji: '🎳', name: 'Bowling' },
            { emoji: '🏏', name: 'Cricket' },
        ],
        space: [
            { emoji: '🚀', name: 'Rocket' },
            { emoji: '🛸', name: 'UFO' },
            { emoji: '🌍', name: 'Earth' },
            { emoji: '🌕', name: 'Moon' },
            { emoji: '☀️', name: 'Sun' },
            { emoji: '⭐', name: 'Star' },
            { emoji: '🪐', name: 'Saturn' },
            { emoji: '☄️', name: 'Comet' },
            { emoji: '👨‍🚀', name: 'Astronaut' },
            { emoji: '👽', name: 'Alien' },
            { emoji: '🔭', name: 'Telescope' },
            { emoji: '📡', name: 'Satellite' },
            { emoji: '🌌', name: 'Milky Way' },
            { emoji: '🌑', name: 'New Moon' },
            { emoji: '🧊', name: 'Ice' },
            { emoji: '🌋', name: 'Volcano' },
        ]
    }

    static generateContentPool(): ContentPool {
        return {
            easy: this.generateConfigs(4, ['animals', 'fruits']),
            medium: this.generateConfigs(6, ['vehicles', 'emojis']),
            hard: this.generateConfigs(6, ['nature', 'sports']),
            challenge: this.generateConfigs(8, ['animals', 'fruits', 'vehicles', 'emojis', 'nature', 'sports', 'space'])
        }
    }

    private static generateConfigs(
        gridSize: 4 | 6 | 8,
        themes: string[]
    ): MemoryMatchConfig[] {
        const configs: MemoryMatchConfig[] = []

        themes.forEach(theme => {
            const pairsNeeded = (gridSize * gridSize) / 2
            const themeCards = this.themes[theme as keyof typeof this.themes]
            const selectedCards = themeCards.slice(0, pairsNeeded)

            // Create pairs
            const cards: MemoryCard[] = []
            selectedCards.forEach((card, index) => {
                cards.push(
                    { id: `${theme}-${index}-a`, emoji: card.emoji, name: card.name, theme },
                    { id: `${theme}-${index}-b`, emoji: card.emoji, name: card.name, theme }
                )
            })

            // Optimal moves = number of pairs + some buffer
            const optimalMoves = pairsNeeded + Math.floor(pairsNeeded * 0.3)

            const difficulty = gridSize === 4 ? 'EASY' : gridSize === 6 ? 'MEDIUM' : 'HARD'
            const points = gridSize === 4 ? 10 : gridSize === 6 ? 20 : 30

            configs.push({
                id: `memory-${gridSize}x${gridSize}-${theme}`,
                type: 'memory',
                difficulty: difficulty as any,
                content: {
                    gridSize,
                    theme: theme as any,
                    cards,
                    optimalMoves
                },
                correctAnswer: 0, // Not applicable for memory game
                timeLimit: gridSize === 4 ? 120 : gridSize === 6 ? 180 : 240,
                points
            })
        })

        return configs
    }

    static shuffleCards(cards: MemoryCard[]): MemoryCard[] {
        const shuffled = [...cards]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }
}

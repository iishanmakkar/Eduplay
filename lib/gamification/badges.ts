
import { GameType } from '@prisma/client'

export interface BadgeDefinition {
    id: string
    name: string
    description: string
    icon: string
    xpReward: number
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
    category: 'STREAK' | 'PERFORMANCE' | 'SOCIAL' | 'MILESTONE'
    condition: {
        type: 'STREAK' | 'SCORE' | 'ACCURACY' | 'COUNT' | 'SPECIFIC_GAME'
        value: number
        gameType?: GameType
    }
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    // Streaks
    {
        id: 'streak-3',
        name: 'Consistency Kickstart',
        description: 'Maintain a 3-day login streak',
        icon: '🔥',
        xpReward: 100,
        rarity: 'COMMON',
        category: 'STREAK',
        condition: { type: 'STREAK', value: 3 }
    },
    {
        id: 'streak-7',
        name: 'Weekly Warrior',
        description: 'Maintain a 7-day login streak',
        icon: '🛡️',
        xpReward: 500,
        rarity: 'RARE',
        category: 'STREAK',
        condition: { type: 'STREAK', value: 7 }
    },
    {
        id: 'streak-30',
        name: 'Monthly Master',
        description: 'Maintain a 30-day login streak',
        icon: '👑',
        xpReward: 2500,
        rarity: 'LEGENDARY',
        category: 'STREAK',
        condition: { type: 'STREAK', value: 30 }
    },

    // Performance
    {
        id: 'perfect-score',
        name: 'Sniper',
        description: 'Get 100% accuracy in any game',
        icon: '🎯',
        xpReward: 200,
        rarity: 'COMMON',
        category: 'PERFORMANCE',
        condition: { type: 'ACCURACY', value: 1.0 }
    },
    {
        id: 'high-score-1000',
        name: 'Centurion',
        description: 'Score over 1000 points in a single session',
        icon: '💯',
        xpReward: 300,
        rarity: 'COMMON',
        category: 'PERFORMANCE',
        condition: { type: 'SCORE', value: 1000 }
    },
    {
        id: 'high-score-5000',
        name: 'Elite Player',
        description: 'Score over 5000 points in a single session',
        icon: '🚀',
        xpReward: 1000,
        rarity: 'EPIC',
        category: 'PERFORMANCE',
        condition: { type: 'SCORE', value: 5000 }
    },

    // Specific Games
    {
        id: 'math-master',
        name: 'Mathlete',
        description: 'Score 2000 in Speed Math',
        icon: '🧮',
        xpReward: 400,
        rarity: 'RARE',
        category: 'MILESTONE',
        condition: { type: 'SPECIFIC_GAME', gameType: 'SPEED_MATH', value: 2000 }
    },
    {
        id: 'flag-finder',
        name: 'Explorer',
        description: 'Score 1500 in World Flags',
        icon: '🌍',
        xpReward: 400,
        rarity: 'RARE',
        category: 'MILESTONE',
        condition: { type: 'SPECIFIC_GAME', gameType: 'WORLD_FLAGS', value: 1500 }
    },
    {
        id: 'science-star',
        name: 'Scientist',
        description: 'Score 1500 in Science Quiz',
        icon: '🧪',
        xpReward: 400,
        rarity: 'RARE',
        category: 'MILESTONE',
        condition: { type: 'SPECIFIC_GAME', gameType: 'SCIENCE_QUIZ', value: 1500 }
    },

    // Milestones
    {
        id: 'games-played-10',
        name: 'Getting Started',
        description: 'Play 10 games',
        icon: '🎮',
        xpReward: 250,
        rarity: 'COMMON',
        category: 'MILESTONE',
        condition: { type: 'COUNT', value: 10 }
    },
    {
        id: 'games-played-100',
        name: 'Veteran',
        description: 'Play 100 games',
        icon: '🎖️',
        xpReward: 1500,
        rarity: 'EPIC',
        category: 'MILESTONE',
        condition: { type: 'COUNT', value: 100 }
    },

    // Social / Multiplayer
    {
        id: 'multiplayer-1',
        name: 'Social Fly',
        description: 'Play your first multiplayer match',
        icon: '🤝',
        xpReward: 200,
        rarity: 'COMMON',
        category: 'SOCIAL',
        condition: { type: 'COUNT', value: 1 } // Note: we should distinguish solo/multi but generic count is a start or we add a new type. For now let's use Social category for better UI grouping
    },
    {
        id: 'multiplayer-winner',
        name: 'Champion',
        description: 'Win a competitive match with over 2000 points',
        icon: '🏆',
        xpReward: 500,
        rarity: 'RARE',
        category: 'SOCIAL',
        condition: { type: 'SCORE', value: 2000 }
    }
]

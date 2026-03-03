// Brain Boost Achievements Seed Script
// Run this after migration to add new achievements

import { prisma } from '../lib/prisma'

const brainBoostAchievements = [
    {
        name: 'Logic Master',
        description: 'Complete 10 Logic Puzzle sessions',
        icon: '🧩',
        xpReward: 500,
        rarity: 'RARE',
        category: 'BRAIN_BOOST',
        condition: { type: 'game_sessions', gameType: 'LOGIC_PUZZLE', count: 10 }
    },
    {
        name: 'Pattern Pro',
        description: 'Achieve 90% accuracy in Pattern Sequence',
        icon: '🔍',
        xpReward: 500,
        rarity: 'RARE',
        category: 'BRAIN_BOOST',
        condition: { type: 'game_accuracy', gameType: 'PATTERN_SEQUENCE', accuracy: 0.9 }
    },
    {
        name: 'Focus Ninja',
        description: 'Maintain 7-day streak in Focus Challenge',
        icon: '⚡',
        xpReward: 750,
        rarity: 'EPIC',
        category: 'BRAIN_BOOST',
        condition: { type: 'game_streak', gameType: 'FOCUS_REACTION', days: 7 }
    },
    {
        name: 'Strategy Star',
        description: 'Complete Strategy Builder without using hints',
        icon: '♟️',
        xpReward: 600,
        rarity: 'EPIC',
        category: 'BRAIN_BOOST',
        condition: { type: 'game_perfect', gameType: 'MINI_STRATEGY', hintsUsed: 0 }
    },
    {
        name: 'Creative Genius',
        description: 'Receive 10/10 teacher rating on Creative Story',
        icon: '✍️',
        xpReward: 1000,
        rarity: 'LEGENDARY',
        category: 'BRAIN_BOOST',
        condition: { type: 'creative_score', gameType: 'CREATIVE_THINKING', score: 10 }
    },
    {
        name: 'Brain Champion',
        description: 'Unlock all Brain Boost achievements',
        icon: '🧠',
        xpReward: 2000,
        rarity: 'LEGENDARY',
        category: 'BRAIN_BOOST',
        condition: { type: 'achievement_collection', category: 'BRAIN_BOOST', count: 5 }
    }
]

async function seedBrainBoostAchievements() {
    console.log('🌱 Seeding Brain Boost achievements...')

    for (const achievement of brainBoostAchievements) {
        await prisma.achievement.upsert({
            where: { name: achievement.name },
            update: achievement,
            create: achievement,
        })
        console.log(`✅ Created/Updated: ${achievement.name}`)
    }

    console.log('🎉 Brain Boost achievements seeded successfully!')
}

seedBrainBoostAchievements()
    .catch((error) => {
        console.error('❌ Error seeding achievements:', error)
        process.exit(1)
    })

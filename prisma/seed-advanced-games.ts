// Advanced Brain Games Achievements Seed Script

import { prisma } from '../lib/prisma'

const advancedAchievements = [
    {
        name: 'Brain Titan',
        description: 'Complete all 10 advanced brain games',
        icon: '🧠',
        xpReward: 2000,
        rarity: 'LEGENDARY',
        category: 'ADVANCED_BRAIN',
        condition: { type: 'game_collection', category: 'ADVANCED_BRAIN', count: 10 }
    },
    {
        name: 'Master Detective',
        description: 'Solve 20 Logic Grid puzzles',
        icon: '🔍',
        xpReward: 800,
        rarity: 'EPIC',
        category: 'ADVANCED_BRAIN',
        condition: { type: 'game_sessions', gameType: 'LOGIC_GRID', count: 20 }
    },
    {
        name: 'Lightning Thinker',
        description: 'Average reaction time under 2 seconds',
        icon: '⚡',
        xpReward: 750,
        rarity: 'EPIC',
        category: 'ADVANCED_BRAIN',
        condition: { type: 'reaction_time', maxTime: 2000 }
    },
    {
        name: 'Puzzle King',
        description: 'Complete 50 brain puzzles with 90%+ accuracy',
        icon: '🧩',
        xpReward: 1000,
        rarity: 'LEGENDARY',
        category: 'ADVANCED_BRAIN',
        condition: { type: 'accuracy_milestone', accuracy: 0.9, count: 50 }
    },
    {
        name: 'Focus Champion',
        description: 'Complete Attention Switch with zero mistakes',
        icon: '🎯',
        xpReward: 600,
        rarity: 'RARE',
        category: 'ADVANCED_BRAIN',
        condition: { type: 'perfect_game', gameType: 'ATTENTION_SWITCH', mistakes: 0 }
    },
    {
        name: 'Number Ninja',
        description: 'Solve 15 Math Grid Sudoku puzzles',
        icon: '🧮',
        xpReward: 700,
        rarity: 'EPIC',
        category: 'ADVANCED_BRAIN',
        condition: { type: 'game_sessions', gameType: 'MATH_GRID', count: 15 }
    }
]

async function seedAdvancedAchievements() {
    console.log('🌱 Seeding Advanced Brain Games achievements...')

    for (const achievement of advancedAchievements) {
        await prisma.achievement.upsert({
            where: { name: achievement.name },
            update: achievement,
            create: achievement,
        })
        console.log(`✅ Created/Updated: ${achievement.name}`)
    }

    console.log('🎉 Advanced achievements seeded successfully!')
}

seedAdvancedAchievements()
    .catch((error) => {
        console.error('❌ Error seeding achievements:', error)
        process.exit(1)
    })

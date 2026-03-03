'use server'

import { prisma } from '@/lib/prisma'
import { GameType } from '@prisma/client'

export async function fetchCurriculumTemplates(gameType: GameType) {
    try {
        const templates = await prisma.questionTemplate.findMany({
            where: { gameType },
            include: { standard: true }
        })
        return templates
    } catch (error) {
        console.error('Failed to fetch templates:', error)
        return []
    }
}

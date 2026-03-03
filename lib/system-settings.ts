import { prisma } from '@/lib/prisma'
import { cache } from 'react'

export const getSystemSettings = cache(async () => {
    try {
        const settings = await prisma.systemSettings.findMany()
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value
            return acc
        }, {} as Record<string, string>)
    } catch (error) {
        console.error('Failed to fetch system settings:', error)
        return {}
    }
})

export const getMaintenanceMode = cache(async () => {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: 'maintenance_mode' }
        })
        return setting?.value === 'true'
    } catch (error) {
        return false
    }
})

export const setSystemSetting = async (key: string, value: string, userId: string) => {
    return await prisma.systemSettings.upsert({
        where: { key },
        update: {
            value,
            updatedBy: userId
        },
        create: {
            key,
            value,
            updatedBy: userId
        }
    })
}

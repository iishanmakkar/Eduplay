import { prisma } from '@/lib/prisma'
import { PLAN_LIMITS, PlanType, PLAN_FEATURES } from './constants'

export async function getSchoolUsage(schoolId: string) {
    const [studentCount, teacherCount, classCount] = await Promise.all([
        prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
        prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
        prisma.class.count({ where: { schoolId } }),
    ])

    return {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
    }
}

export async function checkLimit(schoolId: string, limitType: 'students' | 'teachers' | 'classes') {
    // Get school's subscription plan
    // For now, assuming we can get it from the school record or a subscription record
    // This might need adjustment based on your actual schema
    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
            subscription: true
        }
    })

    if (!school) throw new Error('School not found')

    const plan = (school.subscription?.plan || 'STARTER') as PlanType
    const limits = PLAN_LIMITS[plan]

    // If unlimited
    if (limits[limitType] === -1) return { allowed: true, current: 0, limit: -1, plan }

    const current = await getCurrentCount(schoolId, limitType)

    return {
        allowed: current < limits[limitType],
        current,
        limit: limits[limitType],
        plan
    }
}

async function getCurrentCount(schoolId: string, type: 'students' | 'teachers' | 'classes') {
    switch (type) {
        case 'students':
            return prisma.user.count({ where: { schoolId, role: 'STUDENT' } })
        case 'teachers':
            return prisma.user.count({ where: { schoolId, role: 'TEACHER' } })
        case 'classes':
            return prisma.class.count({ where: { schoolId } })
    }
}

export async function hasFeature(schoolId: string, feature: string) {
    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: { subscription: true }
    })

    if (!school) return false

    const plan = (school.subscription?.plan || 'STARTER') as PlanType
    return PLAN_FEATURES[plan].includes(feature)
}

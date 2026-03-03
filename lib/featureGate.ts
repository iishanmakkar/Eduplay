import { prisma } from '@/lib/prisma'
import { SubscriptionPlan } from '@prisma/client'

// Feature gates by plan
const FEATURE_GATES: Record<string, SubscriptionPlan[]> = {
    // Analytics features
    ADVANCED_ANALYTICS: ['SCHOOL', 'DISTRICT'],
    WEAK_TOPIC_DETECTION: ['SCHOOL', 'DISTRICT'],
    PERFORMANCE_HEATMAP: ['SCHOOL', 'DISTRICT'],

    // Export features
    PDF_EXPORT: ['SCHOOL', 'DISTRICT'],
    CSV_EXPORT: ['SCHOOL', 'DISTRICT'],

    // Collaboration features
    TEACHER_COLLABORATION: ['SCHOOL', 'DISTRICT'],
    UNLIMITED_TEACHERS: ['SCHOOL', 'DISTRICT'],

    // Branding & customization
    CUSTOM_BRANDING: ['DISTRICT'],
    WHITE_LABEL: ['DISTRICT'],

    // Multi-school
    MULTI_SCHOOL: ['DISTRICT'],
    DISTRICT_ANALYTICS: ['DISTRICT'],

    // Premium games
    PREMIUM_GAMES: ['SCHOOL', 'DISTRICT'],
    EARLY_ACCESS: ['DISTRICT'],
}

// Plan limits
export const PLAN_LIMITS = {
    STARTER: {
        classes: 2,
        students: 60,
        teachers: 1,
        schools: 1,
    },
    SCHOOL: {
        classes: Infinity,
        students: Infinity,
        teachers: Infinity,
        schools: 1,
    },
    DISTRICT: {
        classes: Infinity,
        students: Infinity,
        teachers: Infinity,
        schools: 10,
    },
}

interface FeatureAccessResult {
    allowed: boolean
    reason?: string
    upgrade?: {
        requiredPlan: SubscriptionPlan
        currentPlan: SubscriptionPlan
    }
}

/**
 * Check if a user has access to a specific feature
 */
export async function checkFeatureAccess(
    userId: string,
    feature: keyof typeof FEATURE_GATES
): Promise<FeatureAccessResult> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            school: {
                include: { subscription: true },
            },
        },
    })

    if (!user?.school?.subscription) {
        return {
            allowed: false,
            reason: 'No active subscription',
        }
    }

    const currentPlan = user.school.subscription.plan
    const allowedPlans = FEATURE_GATES[feature]

    if (!allowedPlans) {
        // Feature doesn't exist or no restrictions
        return { allowed: true }
    }

    const allowed = allowedPlans.includes(currentPlan)

    if (!allowed) {
        return {
            allowed: false,
            reason: `Upgrade to ${allowedPlans[0]} to unlock this feature`,
            upgrade: {
                requiredPlan: allowedPlans[0],
                currentPlan,
            },
        }
    }

    return { allowed: true }
}

/**
 * Check if school can add more students
 */
export async function canAddStudent(schoolId: string): Promise<{
    allowed: boolean
    current: number
    limit: number
    reason?: string
}> {
    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
            subscription: true,
            users: { where: { role: 'STUDENT' } },
        },
    })

    if (!school || !school.subscription) {
        return { allowed: false, current: 0, limit: 0, reason: 'No subscription' }
    }

    const plan = school.subscription.plan
    const currentStudents = school.users.length
    const limit = PLAN_LIMITS[plan].students

    const allowed = currentStudents < limit

    return {
        allowed,
        current: currentStudents,
        limit,
        reason: allowed ? undefined : `Student limit reached. Upgrade to add more students.`,
    }
}

/**
 * Check if teacher can create more classes
 */
export async function canCreateClass(teacherId: string): Promise<{
    allowed: boolean
    current: number
    limit: number
    reason?: string
}> {
    const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        include: {
            school: { include: { subscription: true } },
            classesTeaching: true,
        },
    })

    if (!teacher || !teacher.school?.subscription) {
        return { allowed: false, current: 0, limit: 0, reason: 'No subscription' }
    }

    const plan = teacher.school!.subscription!.plan
    const currentClasses = teacher.classesTeaching.length
    const limit = PLAN_LIMITS[plan].classes

    const allowed = currentClasses < limit

    return {
        allowed,
        current: currentClasses,
        limit,
        reason: allowed ? undefined : `Class limit reached. Upgrade for unlimited classes.`,
    }
}

/**
 * Check if subscription is in trial and get days remaining
 */
export async function getTrialStatus(schoolId: string): Promise<{
    isTrial: boolean
    daysLeft: number
    expiresAt: Date | null
}> {
    const subscription = await prisma.subscription.findUnique({
        where: { schoolId },
    })

    if (!subscription || subscription.status !== 'TRIALING') {
        return { isTrial: false, daysLeft: 0, expiresAt: null }
    }

    const trialStart = subscription.trialStartedAt || subscription.createdAt
    const trialEnd = new Date(trialStart)
    trialEnd.setDate(trialEnd.getDate() + 30) // 30-day trial

    const now = new Date()
    const daysLeft = Math.max(
        0,
        Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )

    return {
        isTrial: true,
        daysLeft,
        expiresAt: trialEnd,
    }
}

/**
 * Track feature usage for analytics
 */
export async function trackFeatureUsage(
    userId: string,
    feature: string
): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { schoolId: true },
        })

        if (!user) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        await prisma.usageMetric.upsert({
            where: {
                schoolId_date_metric: {
                    schoolId: user.schoolId ?? '',
                    date: today,
                    metric: `FEATURE_${feature}`,
                },
            },
            update: {
                value: { increment: 1 },
            },
            create: {
                schoolId: user.schoolId ?? '',
                date: today,
                metric: `FEATURE_${feature}`,
                value: 1,
            },
        })
    } catch (error) {
        console.error('Failed to track feature usage:', error)
    }
}

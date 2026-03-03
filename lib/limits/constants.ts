
export const PLAN_LIMITS = {
    STARTER: {
        students: 100,
        teachers: 5,
        classes: 10,
        storage: 1000 * 1000 * 1000, // 1GB
    },
    SCHOOL: {
        students: 500,
        teachers: 25,
        classes: 50,
        storage: 50 * 1000 * 1000 * 1000, // 50GB
    },
    DISTRICT: {
        students: -1, // Unlimited
        teachers: -1,
        classes: -1,
        storage: -1,
    },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const FEATURES = {
    ANALYTICS: 'analytics',
    ADVANCED_REPORTS: 'advanced_reports',
    CUSTOM_BRANDING: 'custom_branding',
    API_ACCESS: 'api_access',
    PRIORITY_SUPPORT: 'priority_support',
} as const;

export const PLAN_FEATURES: Record<PlanType, string[]> = {
    STARTER: [],
    SCHOOL: [FEATURES.ANALYTICS, FEATURES.ADVANCED_REPORTS],
    DISTRICT: [
        FEATURES.ANALYTICS,
        FEATURES.ADVANCED_REPORTS,
        FEATURES.CUSTOM_BRANDING,
        FEATURES.API_ACCESS,
        FEATURES.PRIORITY_SUPPORT,
    ],
};

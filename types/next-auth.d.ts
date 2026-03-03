import 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: string
            schoolId: string
            firstName?: string
            lastName?: string
            subscriptionStatus?: string
            consentStatus?: string
            parentEmail?: string | null
            dob?: string | null
        }
    }

    interface User {
        id: string
        email: string
        name: string
        role: string
        schoolId: string
        firstName?: string
        lastName?: string
        subscriptionStatus?: string
        consentStatus?: string
        parentEmail?: string | null
        dob?: string | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: string
        schoolId: string
        firstName?: string
        lastName?: string
        subscriptionStatus?: string
        consentStatus?: string
        parentEmail?: string | null
        dob?: string | null
    }
}

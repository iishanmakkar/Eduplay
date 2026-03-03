import GoogleProvider from 'next-auth/providers/google'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Roles that CANNOT use Google OAuth — must use credentials only
// Note: OWNER is NOT blocked — the platform admin uses Google sign-in
const GOOGLE_BLOCKED_ROLES = ['TEACHER', 'SCHOOL']

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Allow linking Google to existing credential accounts (same email)
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                code: { label: '2FA Code', type: 'text' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        school: {
                            include: { subscription: true }
                        },
                        independentSubscription: true,
                    },
                }) as any

                if (!user) {
                    throw new Error('Invalid credentials')
                }

                if (!user.password) {
                    // Account was created via Google OAuth — no password set
                    throw new Error('This account uses Google Sign-In. Please click "Continue with Google" instead.')
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    throw new Error('Invalid credentials')
                }

                // 2FA Verification
                if (user.twoFactorEnabled) {
                    if (!credentials.code) {
                        throw new Error('2FA_REQUIRED')
                    }

                    if (user.twoFactorSecret) {
                        const speakeasy = require('speakeasy')
                        const verified = speakeasy.totp.verify({
                            secret: user.twoFactorSecret,
                            encoding: 'base32',
                            token: credentials.code
                        })

                        if (!verified) {
                            throw new Error('Invalid 2FA code')
                        }
                    }
                }

                // Determine subscription status
                let subscriptionStatus = 'ACTIVE'
                if (user.role === 'INDEPENDENT') {
                    subscriptionStatus = user.independentSubscription?.status || 'INACTIVE'
                } else if (user.school?.subscription) {
                    subscriptionStatus = user.school.subscription.status
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    role: user.role,
                    schoolId: user.schoolId || null,
                    teacherId: user.teacherId || null,
                    googleId: user.googleId || null,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    subscriptionStatus,
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                // Look up existing user by email
                const existing = await prisma.user.findUnique({
                    where: { email: user.email! },
                    select: { id: true, role: true }
                })

                if (existing) {
                    // ❌ Block teachers, schools, and owner from Google login
                    if (GOOGLE_BLOCKED_ROLES.includes(existing.role)) {
                        return '/auth/error?error=TeacherGoogleBlocked'
                    }
                    // ✅ Allow STUDENT and INDEPENDENT via Google
                    return true
                }

                // New Google user: create with STUDENT role (pending onboarding)
                // They will be directed to /auth/onboarding to choose their path
                await prisma.user.create({
                    data: {
                        email: user.email!,
                        name: user.name || '',
                        image: user.image || null,
                        role: 'STUDENT', // Default — will be updated during onboarding
                        googleId: user.id,
                    }
                })

                return true
            }

            // Credentials login — always allow (role enforcement happens in middleware)
            return true
        },

        async jwt({ token, user, trigger, session: updateSession }) {
            // Handle manual session updates (e.g. after joining a class)
            if (trigger === 'update') {
                if (updateSession?.schoolId !== undefined) token.schoolId = updateSession.schoolId
                if (updateSession?.teacherId !== undefined) token.teacherId = updateSession.teacherId
                if (updateSession?.role !== undefined) token.role = updateSession.role
                if (updateSession?.subscriptionStatus !== undefined) token.subscriptionStatus = updateSession.subscriptionStatus
            }

            if (user) {
                // Always fetch from DB to get the correct role (especially for Google OAuth
                // where the provider user object doesn't include our custom fields)
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                        school: { include: { subscription: true } },
                        independentSubscription: true,
                    }
                }) as any

                if (dbUser) {
                    token.id = dbUser.id
                    token.role = dbUser.role || 'STUDENT'
                    token.schoolId = dbUser.schoolId || null
                    token.teacherId = dbUser.teacherId || null
                    token.googleId = dbUser.googleId || null
                    token.firstName = dbUser.firstName || user.name?.split(' ')[0] || 'User'
                    token.lastName = dbUser.lastName || user.name?.split(' ').slice(1).join(' ') || ''
                    token.consentStatus = dbUser.consentStatus || 'NOT_REQUIRED'
                    token.parentEmail = dbUser.parentEmail || null
                    token.dob = dbUser.dob?.toISOString() || null

                    // Determine subscription status
                    if (dbUser.role === 'INDEPENDENT') {
                        token.subscriptionStatus = dbUser.independentSubscription?.status || 'INACTIVE'
                    } else if (dbUser.school?.subscription) {
                        token.subscriptionStatus = dbUser.school.subscription.status
                    } else {
                        token.subscriptionStatus = 'ACTIVE'
                    }
                } else {
                    token.id = user.id
                    token.role = (user as any).role || 'STUDENT'
                    token.schoolId = null as any
                    token.teacherId = null as any
                    token.googleId = null as any
                    token.subscriptionStatus = 'ACTIVE'
                    token.firstName = user.name?.split(' ')[0] || 'User'
                    token.lastName = user.name?.split(' ').slice(1).join(' ') || ''
                    token.consentStatus = 'NOT_REQUIRED'
                    token.parentEmail = null
                    token.dob = null
                }

                // Log login
                try {
                    const { logAudit } = await import('@/lib/audit/log')
                    await logAudit({
                        userId: user.id,
                        action: 'LOGIN',
                        resource: 'USER',
                        resourceId: user.id,
                        details: { email: user.email, role: (user as any).role }
                    })
                } catch (e) {
                    console.error('Audit log error', e)
                }
            }
            return token
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.schoolId = (token.schoolId as string) || ''
                    ; (session.user as any).teacherId = token.teacherId as string | null
                    ; (session.user as any).googleId = token.googleId as string | null
                    ; (session.user as any).subscriptionStatus = token.subscriptionStatus as string
                session.user.firstName = token.firstName as string
                session.user.lastName = token.lastName as string
                    ; (session.user as any).consentStatus = token.consentStatus as string
                    ; (session.user as any).parentEmail = token.parentEmail as string | null
                    ; (session.user as any).dob = token.dob as string | null
            }
            return session
        },
    },
}

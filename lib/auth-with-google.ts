import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        // Google Workspace SSO
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code',
                    // Request additional scopes for Google Workspace
                    scope: 'openid email profile https://www.googleapis.com/auth/classroom.rosters.readonly'
                }
            },
            // Allow only specific domains (optional - for school restrictions)
            async profile(profile) {
                // You can restrict to specific domains here
                // const allowedDomains = ['school.edu', 'district.edu']
                // const domain = profile.email.split('@')[1]
                // if (!allowedDomains.includes(domain)) {
                //   throw new Error('Domain not allowed')
                // }

                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    emailVerified: profile.email_verified ? new Date() : null
                } as any
            }
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            // Auto-create user if doesn't exist
            if (account?.provider === 'google') {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email! }
                })

                if (!existingUser) {
                    // Create a default school for the new teacher
                    const schoolName = user.name ? `${user.name}'s School` : 'New School'
                    const schoolSlug = (user.name || 'school').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7)

                    const newSchool = await prisma.school.create({
                        data: {
                            name: schoolName,
                            slug: schoolSlug,
                        }
                    })

                    await prisma.user.create({
                        data: {
                            email: user.email!,
                            password: '', // Google users don't need passwords
                            firstName: (user.name || '').split(' ')[0] || 'Unknown',
                            lastName: (user.name || '').split(' ').slice(1).join(' ') || 'Teacher',
                            role: 'TEACHER',
                            emailVerified: new Date(),
                            schoolId: newSchool.id,
                            avatar: user.image
                        }
                    })
                }
            }
            return true
        },

        async session({ session, user }) {
            if (session.user) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email! },
                    select: {
                        id: true,
                        role: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                })

                if (dbUser) {
                    session.user.id = dbUser.id
                    session.user.role = dbUser.role
                }
            }
            return session
        },

        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        }
    },

    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit } from '@/lib/rate-limit'

// ============================================================
// ROUTE PERMISSION MAP
// ============================================================
// OWNER      → full access to everything
// SCHOOL     → /dashboard/school/* only
// TEACHER    → /dashboard/teacher/* only
// STUDENT    → /dashboard/student/* only
// INDEPENDENT→ /dashboard/independent/* only
// ============================================================

const ROLE_DASHBOARD_MAP: Record<string, string> = {
    OWNER: '/dashboard/owner',
    SCHOOL: '/dashboard/school',
    TEACHER: '/dashboard/teacher',
    STUDENT: '/dashboard/student',
    INDEPENDENT: '/dashboard/independent',
}

// Routes each role is allowed to access (prefix match)
const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
    OWNER: ['/dashboard'], // Full access
    SCHOOL: ['/dashboard/school', '/dashboard/settings', '/dashboard/billing'],
    TEACHER: ['/dashboard/teacher', '/dashboard/settings'],
    STUDENT: ['/dashboard/student', '/dashboard/settings'],
    INDEPENDENT: ['/dashboard/independent', '/dashboard/settings'],
}

// Subscription-restricted statuses
const EXPIRED_STATUSES = ['PAST_DUE', 'CANCELED', 'EXPIRED', 'INACTIVE']

export async function middleware(request: NextRequest) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1'
    const path = request.nextUrl.pathname
    const isApiRoute = path.startsWith('/api')
    const isAuthRoute = path.startsWith('/api/auth') || path.startsWith('/auth')
    const isGameSave = path.startsWith('/api/games/save-result')

    // ── Rate Limiting ──────────────────────────────────────────
    if (isGameSave) {
        const { success, limit, remaining, reset } = await rateLimit.heavy.limit(ip)
        if (!success) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': reset.toString(),
                },
            })
        }
    } else if (isAuthRoute) {
        const { success, limit, remaining, reset } = await rateLimit.auth.limit(ip)
        if (!success) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': reset.toString(),
                },
            })
        }
    } else if (isApiRoute) {
        const { success, limit, remaining, reset } = await rateLimit.api.limit(ip)
        if (!success) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': reset.toString(),
                },
            })
        }
    }

    // Allow API routes to handle their own auth
    if (isApiRoute) {
        const response = NextResponse.next()
        // Phase 5 — Global Readiness: pass region to API routes for future read-replica routing
        const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'US'
        response.headers.set('x-region', country)

        // Phase 1 — Enterprise Observability: Inject Trace ID
        const traceId = request.headers.get('x-trace-id') || crypto.randomUUID()
        response.headers.set('x-trace-id', traceId)

        return response
    }

    const token = await getToken({ req: request })
    const isAuthPage = path.startsWith('/auth')
    const isDashboard = path.startsWith('/dashboard')
    const isOnboarding = path.startsWith('/auth/onboarding')
    const isSetup = path.startsWith('/setup')
    const isJoin = path.startsWith('/join')
    const isGameRoute = path.startsWith('/games') || path.startsWith('/aipoweredgames') || path.startsWith('/profile')

    // ── Redirect authenticated users away from auth pages ─────
    if (isAuthPage && !isOnboarding && token) {
        const role = token.role as string
        const dashboardUrl = ROLE_DASHBOARD_MAP[role] || '/dashboard'
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // ── Protect game / profile routes ─────────────────────────
    if (isGameRoute && !token) {
        const callbackUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, request.url))
    }

    // ── Protect dashboard routes ───────────────────────────────
    if ((isDashboard || isSetup || isJoin) && !token) {
        return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // ── Dashboard RBAC enforcement ─────────────────────────────
    if (isDashboard && token) {
        const role = token.role as string
        const schoolId = token.schoolId as string | null
        const subscriptionStatus = token.subscriptionStatus as string

        // OWNER: full access, no restrictions
        if (role === 'OWNER') {
            return NextResponse.next()
        }

        // ── Onboarding redirects ───────────────────────────────
        // Student with no school → must join a class
        if (role === 'STUDENT' && !schoolId && !path.startsWith('/auth/onboarding')) {
            return NextResponse.redirect(new URL('/auth/onboarding?step=join-class', request.url))
        }

        // Independent user with no/expired subscription → must pay
        if (role === 'INDEPENDENT') {
            if (EXPIRED_STATUSES.includes(subscriptionStatus)) {
                const isBillingPath = path.includes('/billing') || path.includes('/settings')
                if (!isBillingPath) {
                    return NextResponse.redirect(new URL('/pricing?locked=true&reason=subscription_expired', request.url))
                }
            }
        }

        // ── School subscription enforcement ───────────────────
        // If school subscription is expired, lock teacher and student gameplay
        if ((role === 'TEACHER' || role === 'STUDENT') && EXPIRED_STATUSES.includes(subscriptionStatus)) {
            const isSafeRoute = path.includes('/settings') || path.includes('/billing')
            if (!isSafeRoute) {
                return NextResponse.redirect(new URL('/auth/error?error=SchoolSuspended', request.url))
            }
        }

        // ── Role-based route enforcement ──────────────────────
        const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role] || []
        const isAllowed = allowedPrefixes.some(prefix => path.startsWith(prefix))

        if (!isAllowed) {
            // Redirect to their own dashboard instead of 403
            const ownDashboard = ROLE_DASHBOARD_MAP[role] || '/dashboard'
            return NextResponse.redirect(new URL(ownDashboard, request.url))
        }

        // ── Specific cross-role blocks ─────────────────────────
        // Block INDEPENDENT from any school-related routes
        if (role === 'INDEPENDENT' && (
            path.startsWith('/dashboard/school') ||
            path.startsWith('/dashboard/teacher') ||
            path.startsWith('/dashboard/student') ||
            path.startsWith('/dashboard/admin') ||
            path.startsWith('/dashboard/owner')
        )) {
            return NextResponse.redirect(new URL('/dashboard/independent', request.url))
        }

        // Block STUDENT from billing routes (school billing is handled by SCHOOL role)
        if (role === 'STUDENT' && path.includes('/billing')) {
            return NextResponse.redirect(new URL('/dashboard/student', request.url))
        }

        // Block TEACHER from owner/school-admin routes
        if (role === 'TEACHER' && (
            path.startsWith('/dashboard/owner') ||
            path.startsWith('/dashboard/school') ||
            path.startsWith('/dashboard/admin')
        )) {
            return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/auth/:path*',
        '/api/:path*',
        '/setup/:path*',
        '/join/:path*',
        '/games/:path*',
        '/games',
        '/aipoweredgames/:path*',
        '/aipoweredgames',
        '/profile/:path*',
        '/profile',
    ],
}

# Environment Setup

Required environment variables for a full production deployment.

## Core
- `NODE_ENV`: `production`
- `NEXT_PUBLIC_APP_URL`: `https://your-domain.com`

## Database (Neon)
- `DATABASE_URL`: `postgresql://user:pass@endpoint.neon.tech/neondb?sslmode=require`

## Authentication (NextAuth)
- `NEXTAUTH_URL`: `https://your-domain.com`
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

## Caching (Upstash Redis)
- `UPSTASH_REDIS_REST_URL`: `https://...`
- `UPSTASH_REDIS_REST_TOKEN`: `...`

## Payments (Razorpay)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: `rzp_live_...`
- `RAZORPAY_KEY_SECRET`: `...`
- `RAZORPAY_WEBHOOK_SECRET`: `...`

## Email (Resend)
- `RESEND_API_KEY`: `re_...`

## Monitoring (Sentry)
- `NEXT_PUBLIC_SENTRY_DSN`: `https://...`
- `SENTRY_AUTH_TOKEN`: `...` (for build time sourcemaps)

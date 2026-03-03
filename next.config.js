const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com', 'res.cloudinary.com'],
  },
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },

  // ── Phase 7 — Security Headers ──────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME-sniff protection
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Stop browsers sending referrer to cross-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
          },
          // HSTS: force HTTPS for 1 year, include subdomains
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Block XSS in older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Security-relevant DNS prefetch control
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Content Security Policy
          // Allows: same-origin scripts/styles, Google Fonts, Vercel analytics, OpenRouter
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",   // unsafe-eval needed for Next.js dev; tighten in prod
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://lh3.googleusercontent.com https://res.cloudinary.com",
              "connect-src 'self' https://openrouter.ai https://*.neon.tech wss://*.pusher.com https://api.pusher.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
      {
        // Extra security for API routes
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },

  // ── Phase 9 — Build hardening ───────────────────────────────────────────────
  // Remove X-Powered-By header (avoids Next.js version fingerprinting)
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // ── Logging suppression in production ──────────────────────────────────────
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],  // Keep error/warn logs, remove console.log
      },
    },
  }),
}

module.exports = withNextIntl(nextConfig)

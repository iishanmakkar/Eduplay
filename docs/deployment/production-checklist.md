# Production Checklist

Before deploying EduPlay Pro to production, ensure all items on this checklist are completed.

## 🔒 Security
- [ ] **Environment Variables**: All sensitive keys (Stripe, NextAuth, Database) are set in the production environment.
- [ ] **Rate Limiting**: Rate limiting middleware is active and configured correctly.
- [ ] **Headers**: Security headers (HSTS, X-Content-Type-Options) are configured.
- [ ] **Authentication**: Secure cookies are enabled (`NEXTAUTH_URL` starts with `https://`).

## ⚡ Performance
- [ ] **Database Indexes**: All Prisma indexes are applied (`npx prisma db push`).
- [ ] **Caching**: Redis is connected and caching strategies are verified.
- [ ] **Assets**: Images are optimized and served via a CDN (e.g., Vercel Blob or S3).
- [ ] **Build**: Application builds successfully without type errors (`npm run build`).

## 📝 Monitoring
- [ ] **Logging**: Audit logging is functional.
- [ ] **Errors**: Sentry DSN is configured and capturing errors.
- [ ] **Analytics**: Vercel Analytics or similar is enabled for traffic insights.

## 🤝 Compliance
- [ ] **Terms of Service**: Up-to-date and accessible.
- [ ] **Privacy Policy**: Including data handling details.
- [ ] **Backup**: Database backups are scheduled (e.g., Neon auto-backup).

# SOC 2 Type I — Secrets Rotation Policy
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: CTO

---

## Control Objective CC6.6: Logical Access — Credentials

> EduPlay removes access to protected information assets when no longer required and changes authenticators/credentials at regular intervals.

---

## Rotation Schedule

| Secret | Rotation Frequency | Trigger for Immediate Rotation |
|---|---|---|
| `NEXTAUTH_SECRET` | Quarterly | Engineer departure, suspected breach |
| `CRON_SECRET` | Quarterly | Engineer departure |
| `DATABASE_URL` / `DATABASE_POOL_URL` | Quarterly | Engineer departure, Neon incident |
| `UPSTASH_REDIS_REST_TOKEN` | Quarterly | Engineer departure |
| `RAZORPAY_KEY_SECRET` | Annually | Merchant account change |
| `RAZORPAY_WEBHOOK_SECRET` | Annually | Webhook endpoint change |
| `SENTRY_AUTH_TOKEN` | On engineer departure | Eng departure |
| `RESEND_API_KEY` | Annually | Vendor incident |

---

## Rotation Procedure (Standard)

```
1. Generate new secret in vendor dashboard (Razorpay, Neon, Upstash, etc.)
2. Add new secret to Railway / Vercel environment variables
   → Railway: Settings → Variables → Edit
   → Vercel: Project Settings → Environment Variables
3. Trigger a fresh Vercel deployment (or Railway redeploy)
4. Verify new secret works in production (check health endpoint, test webhook)
5. Revoke / delete old secret in vendor dashboard
6. Log the rotation in AuditLog:
   { action: 'SECRET_ROTATED', resource: '<SECRET_NAME>', actor: '<engineer-email>' }
7. Update this document with the new rotation date
```

---

## Emergency Rotation (Breach Suspected)

```
⚡ Rotate immediately — do not wait for business hours

1. Revoke old secret in vendor dashboard FIRST (prevents attacker use)
2. Generate new secret
3. Update Railway/Vercel immediately
4. Trigger redeploy
5. Verify service health
6. File P1 incident per INCIDENT_RESPONSE.md
7. Notify affected users if their data was at risk (within 72 hours)
```

---

## Secret Storage Rules

| Rule | Details |
|---|---|
| **Never in code** | No secrets in source files. `.env` files git-ignored. `.env.production.example` contains only placeholders |
| **Never in logs** | Pino logger hashes userId; no secrets logged. `console.log` banned in production code |
| **Never in DB** | No API keys stored in `User` or `School` tables |
| **Minimum scope** | Each service uses only the secrets it needs (Razorpay creds only in payment routes) |
| **Vault future** | At 50+ engineers: migrate to HashiCorp Vault or AWS Secrets Manager |

---

## Current Secret Locations

| Secret | Lives In |
|---|---|
| All production secrets | Railway environment variables + Vercel environment variables |
| GitHub CI secrets | GitHub Repository Secrets (Actions only) |
| Local dev secrets | `.env.local` (never committed, Git-ignored) |
| SOC 2 audit evidence | CTO 1Password vault (not in code) |

---

## Rotation Evidence

All rotations logged to `AuditLog` table with `action = 'SECRET_ROTATED'`. Quarterly rotation review included in access review cron output.

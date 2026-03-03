# SOC 2 Type I — Encryption Policy
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: Engineering Lead

---

## Control Objective CC6.7: Encryption

> EduPlay restricts the transmission of sensitive data and restricts the use of encryption to protect data in transit and at rest.

---

## Data Classification

| Classification | Examples | Handling |
|---|---|---|
| **Critical** | DB credentials, Razorpay secrets, NEXTAUTH_SECRET | Encrypted at rest (Railway Secrets / Vercel Env), never logged, rotated quarterly |
| **Confidential** | Student PII, game results, school billing data | Encrypted at rest (Neon TDE), encrypted in transit (TLS 1.3) |
| **Internal** | Aggregate analytics, usage metrics | Encrypted at rest, accessible to OWNER role only |
| **Public** | Landing page content, game assets | No PII, CDN-served |

---

## Encryption in Transit

| Path | Protocol | Certificate |
|---|---|---|
| Client ↔ Vercel Edge | TLS 1.3 | Vercel-managed Let's Encrypt (auto-renewal) |
| Vercel ↔ Neon DB | TLS 1.3 + SSL verify | Neon-provided CA cert |
| Vercel ↔ Upstash Redis | TLS 1.2+ | Upstash REST API (HTTPS only) |
| Vercel ↔ Razorpay | TLS 1.3 | Razorpay API (HTTPS only) |
| Vercel ↔ Resend Email | TLS 1.3 | Resend API (HTTPS only) |
| Vercel ↔ Sentry | TLS 1.3 | Sentry DSN endpoint (HTTPS) |

**HTTP Strict Transport Security (HSTS)**: Enforced by Vercel edge for all production domains. `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Encryption at Rest

| Data Store | Mechanism | Key Management |
|---|---|---|
| Neon PostgreSQL | AES-256 Transparent Data Encryption | Neon-managed (AWS KMS underneath) |
| Upstash Redis | AES-256 at rest | Upstash-managed |
| Vercel Blob (assets) | AES-256 | Vercel-managed |
| Railway Volumes | AES-256 | Railway-managed |

---

## Password Storage

- User passwords: **not stored** — Google OAuth is the sole authentication provider
- Session tokens: `NEXTAUTH_SECRET`-signed JWTs (HS256) with 30-day rolling expiry
- Session tokens: **never stored in DB** (stateless JWT)

---

## Secrets Management

| Secret | Location | Rotation Frequency |
|---|---|---|
| `DATABASE_URL` | Railway / Vercel Env | Quarterly or on personnel change |
| `NEXTAUTH_SECRET` | Railway / Vercel Env | Quarterly |
| `RAZORPAY_KEY_SECRET` | Railway / Vercel Env | Annually (Razorpay policy) |
| `RAZORPAY_WEBHOOK_SECRET` | Railway / Vercel Env | Annually |
| `UPSTASH_REDIS_REST_TOKEN` | Railway / Vercel Env | Quarterly |
| `CRON_SECRET` | Railway / Vercel Env | Quarterly |
| `SENTRY_AUTH_TOKEN` | GitHub Actions Secrets | On engineer departure |

> Full rotation procedure: `docs/SOC2_SECRETS_ROTATION.md`

---

## Key Algorithms Summary

| Use | Algorithm | Key Length |
|---|---|---|
| Data at rest | AES-256-GCM | 256 bits |
| TLS session | ECDHE + AES-256 | 256 bits |
| Session JWT | HMAC-SHA256 | 256 bits (from NEXTAUTH_SECRET) |
| Razorpay webhook HMAC | HMAC-SHA256 | 256 bits |

---

## Compliance

- **NIST SP 800-57**: Key strength guidelines followed
- **PCI DSS scope**: Minimal. Razorpay handles cardholder data; EduPlay stores only payment status and order IDs (no card numbers, CVVs, or bank details)
- **FERPA**: Student PII encrypted at rest + in transit. No PII in logs (userId hashed via `createRequestLogger`)

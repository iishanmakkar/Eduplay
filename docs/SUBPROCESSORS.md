# EduPlay Sub-Processors
*Last updated: February 2026*

This document lists all sub-processors that EduPlay engages to process personal data of students and educators on behalf of school and district customers.

EduPlay will provide 30 days' notice before engaging any new sub-processor that processes personal data.

---

## Sub-Processor List

| Sub-Processor | Purpose | Country of Processing | Data Processed | Security Certification |
|---|---|---|---|---|
| **Neon, Inc.** | Primary database (PostgreSQL) | United States (AWS us-east-2) | All student & school data | SOC 2 Type II |
| **Upstash, Inc.** | Redis caching (rate limiting, leaderboard) | United States (AWS us-east-1) | Session metadata, leaderboard scores (no PII) | SOC 2 Type I |
| **Resend, Inc.** | Transactional email delivery | United States | Student email addresses, first names | SOC 2 Type II |
| **Razorpay Software Pvt. Ltd.** | Payment processing (India) | India | School billing contact name, email; payment amounts | PCI-DSS Level 1 |
| **Stripe, Inc.** | Payment processing (US/EU) | United States | School billing contact name, email; payment amounts | PCI-DSS Level 1 |
| **Sentry, Inc.** | Error monitoring & performance | United States | Error stack traces (anonymized), session metadata | SOC 2 Type II |
| **Vercel, Inc.** | Application hosting & CDN | Global (Edge network) | HTTP request metadata (no persistent student PII) | SOC 2 Type II |

---

## Data Residency Notes

- **India Independent Tier**: All payments processed by Razorpay (India data center).
- **US School Tier**: All payments processed by Stripe (US data center).
- **Database**: Currently US-only (Neon us-east-2). EU data residency planned for the 200K milestone.
- **Email**: Resend stores email logs for 30 days; no student body data is stored in email provider.

---

## Encryption at Rest

All sub-processors listed above encrypt data at rest using AES-256 or equivalent. EduPlay does not store payment card data — all payment processing is delegated to PCI-DSS certified sub-processors.

---

## Data Flows

```
Student Browser
    │
    ├─► Vercel Edge (CDN) — static assets, middleware (no persistent PII)
    │
    └─► Vercel Serverless Functions
            │
            ├─► Neon Postgres (US-East) — all persistent student data
            ├─► Upstash Redis — session + leaderboard cache (TTL-bounded)
            ├─► Sentry — error reports (stack traces, anonymized userId)
            └─► Resend — email notifications (name + email only)

School Admin (Billing)
    └─► Razorpay (IN) / Stripe (US) — payment processing (PCI scope, not EduPlay)
```

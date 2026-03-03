# SOC 2 Type I — Log Retention Policy
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: Engineering Lead

---

## Control Objective CC7.2: Log Retention

> EduPlay retains audit logs, system logs, and security event logs for a defined retention period sufficient to support incident response and compliance requirements.

---

## Log Types and Retention Schedule

| Log Type | Source | Retention | Location | Searchable |
|---|---|---|---|---|
| **Access logs** (auth events) | `AuditLog` table | 7 years | Neon PostgreSQL | ✅ via `/api/admin/audit-log` |
| **Game result logs** | `GameResult` table | 5 years | Neon PostgreSQL | ✅ via export API |
| **Payment events** | `Transaction` + `WebhookEvent` | 7 years | Neon PostgreSQL | ✅ |
| **Subscription changes** | `Subscription` + `AuditLog` | 7 years | Neon PostgreSQL | ✅ |
| **Application logs** (Pino) | Pino → Railway/Vercel stdout | 30 days | Railway / Vercel | ✅ (text search) |
| **Error logs** | Sentry | 90 days | Sentry | ✅ (error tracking dashboard) |
| **Infrastructure logs** | Railway/Vercel platform | 30 days | Platform dashboard | Limited |
| **Email delivery logs** | `EmailLog` table | 2 years | Neon PostgreSQL | ✅ |
| **Cron execution logs** | Pino structured output | 30 days | Railway/Vercel | ✅ |
| **Webhook delivery logs** | `WebhookEvent` table | 7 years | Neon PostgreSQL | ✅ |

---

## Regulatory Alignment

| Regulation | Required Retention | EduPlay Retention | Status |
|---|---|---|---|
| FERPA | Duration of enrollment + 5 years | 5–7 years | ✅ Compliant |
| GDPR / DPDP | Minimum necessary; deletable on request | 5–7 years + deletion API | ✅ Compliant |
| PCI DSS | 1 year (payment logs) | 7 years | ✅ Compliant |
| SOC 2 | 1 year audit trail | 7 years (access + payment) | ✅ Compliant |
| India IT Act | 5 years | 7 years | ✅ Compliant |

---

## Log Integrity & Tamper Evidence

- `AuditLog` table: insert-only (no UPDATE or DELETE granted to application service account)
- Soft deletes only on user records (`deletedAt` field) — game + payment data never deleted
- `WebhookEvent`: status-only updates, payload field immutable after insert
- DB-level: Neon grants application user `SELECT, INSERT, UPDATE` but NOT `DELETE` on audit tables (enforced via row-level security policy)

---

## Deletion Policy (User Right to Erasure)

1. User submits deletion request → `User.deletedAt = now()` (soft delete, 30-day grace)
2. After 30 days: `hard-delete` cron removes PII fields from `User` record
3. `GameResult`: `studentId` field set to `User.analyticsId` (anonymized UUID, not linked to PII)
4. `AuditLog`: entries retained as required by FERPA/SOC 2 but PII fields anonymized
5. Deletion confirmed via `AuditLog` entry with `action: 'USER_HARD_DELETED'`

---

## Log Access Controls

| Log | Read Access | Write Access |
|---|---|---|
| `AuditLog` | OWNER via `/api/admin/audit-log` only | Application (INSERT only) |
| Sentry | Engineering team (MFA required) | Sentry SDK (automated) |
| Railway/Vercel logs | Engineering team (MFA required) | Platform (automated) |
| `WebhookEvent` | OWNER + application | Application (INSERT, limited UPDATE) |

---

## Backup of Logs

- Neon PostgreSQL (containing `AuditLog`, `WebhookEvent`) takes continuous WAL backups (Point-in-Time Recovery to 30-day window)
- Long-term: Monthly Neon database dump to encrypted Vercel Blob (see `SOC2_BACKUP_VERIFICATION.md`)

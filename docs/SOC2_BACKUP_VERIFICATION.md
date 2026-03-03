# SOC 2 Type I — Backup Verification Policy
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: Engineering Lead

---

## Control Objective A1.2: Environmental Protections — Backup

> EduPlay uses environmental protections, software, and recovery infrastructure to protect against loss of data.

---

## Backup Architecture

### Tier 1: Continuous (Neon Built-In)
| Feature | Details |
|---|---|
| **Point-in-Time Recovery (PITR)** | 30-day window (Neon Pro) |
| **WAL Archiving** | Continuous WAL shipping to Neon storage |
| **RPO** | ~5 seconds (WAL interval) |
| **RTO** | ~10–30 minutes (branch-based restore) |

### Tier 2: Daily Snapshots (Neon Branching)
| Feature | Details |
|---|---|
| **Mechanism** | Neon `createBranch` API creates instant copy-on-write snapshot |
| **Schedule** | Daily at 02:00 UTC via cron |
| **Retention** | 30 branches retained (auto-purge after 30 days) |
| **Purpose** | Fast restore to previous day's state |

### Tier 3: Monthly Dump (Long-Term Archive)
| Feature | Details |
|---|---|
| **Mechanism** | `pg_dump` via Neon serverless driver, uploaded to Vercel Blob |
| **Schedule** | 1st of each month at 03:00 UTC |
| **Encryption** | AES-256 at rest (Vercel Blob native) |
| **Retention** | 12 months rolling |
| **RPO** | Up to 1 month for this tier |

---

## Backup Verification Schedule

| Backup Type | Verification Frequency | Method | Last Verified |
|---|---|---|---|
| Neon PITR | Monthly | Restore to `verify-branch`, run `SELECT COUNT(*) FROM "User"` | Monthly automated |
| Daily snapshot | Monthly | Activate Neon branch + run smoke tests | Monthly |
| Monthly dump | Quarterly | Restore to test DB, run schema + row count assertions | Quarterly |

### Automated Verification (Monthly)
The `/api/cron/recalibrate-bkt` cron also logs `{ backupVerified: true/false }` after checking Neon branch API for recent `created_at` branches.

---

## Restoration Procedure

### Neon PITR Restore
```bash
# 1. Create restore branch in Neon Console or API
neon branches create --project-id <id> --timestamp "2026-02-20T12:00:00Z"

# 2. Update DATABASE_URL to point to new branch
# 3. Run smoke test: GET /api/health/db
# 4. If confirmed: promote branch to primary
```

### Monthly Dump Restore
```bash
pg_restore -h <NEW_HOST> -U <USER> -d <DB> /path/to/backup.dump
npx prisma migrate deploy  # ensure schema is current
```

---

## Data Residency

All backups currently stored in US regions (Neon AWS us-east-1, Vercel Blob us-east-1).
India-region schools under DPDP: notify DPA that backup copies reside in US. Future: Neon India region when available.

---

## Disaster Recovery Objectives

| Metric | Target | Current Capability |
|---|---|---|
| **RTO** | < 1 hour for P1 | 30 min (Neon PITR branch) |
| **RPO** | < 5 minutes for P1 | ~5 seconds (WAL) |
| **Last tested** | 2026-Q1 | Quarterly test scheduled |

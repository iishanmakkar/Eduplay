# SOC 2 Type I — Incident Response Drill Playbook
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: Engineering Lead + CTO

---

## Purpose

This document defines the quarterly incident drill schedule and procedure. Running drills validates EduPlay's `INCIDENT_RESPONSE.md` policy and ensures team readiness without a real emergency.

---

## Drill Types

### Drill Type A: Data Access Breach Simulation
**Objective**: Validate breach detection → notification → containment in under 2 hours.

**Scenario**: A test user with STUDENT role successfully queries another school's data via a misconfigured API endpoint (simulated).

**Steps**:
1. Engineering lead crafts a test HTTP request that would expose cross-school data (if bug existed)
2. Confirm middleware/session guard blocks it (expected: 403)
3. Confirm `AuditLog` entry created for the blocked cross-school access attempt
4. Simulate "breach discovered" → trigger P1 incident process per `INCIDENT_RESPONSE.md`
5. Measure: time from detection to written incident report
6. PASS criteria: Report written within 60 minutes, AuditLog entry present

### Drill Type B: Database Failover
**Objective**: Validate Neon PITR restore takes < 30 minutes.

**Steps**:
1. Restore to Neon PITR branch (use yesterday's timestamp)
2. Point staging `DATABASE_URL` to the branch
3. Run `/api/health/db` — confirm response `{ status: 'ok' }`
4. Run `npx jest bkt-clamp --verbose` — confirm 12/12 pass
5. Measure: total minutes from drill start to healthy health check
6. PASS criteria: < 30 minutes

### Drill Type C: Secrets Rotation Under Pressure
**Objective**: Validate full secrets rotation procedure in < 45 minutes.

**Steps**:
1. Rotate `NEXTAUTH_SECRET` in Railway staging env
2. Trigger redeploy
3. Verify login still works (SSO flow)
4. Rotate `CRON_SECRET`
5. Hit a cron endpoint with old secret — confirm 401
6. Hit with new secret — confirm 200
7. Log rotation in `AuditLog`
8. PASS criteria: < 45 minutes, all logins functional

### Drill Type D: DLQ Alert Response
**Objective**: Validate webhook DLQ monitoring catches and escalates dead-letter events.

**Steps**:
1. Insert a test `WebhookEvent` with `status: 'DEAD'` directly in staging DB
2. Run `/api/cron/webhook-dlq-retry` manually
3. Confirm retry attempted, `retryCount` incremented
4. Confirm alert logged
5. PASS criteria: Alert visible within 1 cron cycle (1 hour)

---

## Drill Schedule

| Quarter | Drill Type | Lead | Date | Status |
|---|---|---|---|---|
| Q1 2026 | Type B (DB Failover) | Engineering Lead | 2026-03-15 | Scheduled |
| Q2 2026 | Type A (Breach Simulation) | CTO | 2026-06-15 | Planned |
| Q3 2026 | Type C (Secrets Rotation) | Engineering Lead | 2026-09-15 | Planned |
| Q4 2026 | Type D (DLQ Alert) | Engineering Lead | 2026-12-15 | Planned |

---

## Drill Report Template

```markdown
## Incident Drill Report — {Drill Type} — {Date}

**Lead**: {Name}
**Participants**: {Names}
**Duration**: {X} minutes

### Scenario
{Description}

### Outcome
- [ ] PASS / [ ] FAIL
- Time to completion: {X} minutes
- Findings: {Any gaps found}
- Corrective actions: {What will be fixed, by when}

**Signed by CTO**: ___________________
**Date**: ___________________
```

---

## Evidence Requirements for SOC 2 Auditor

- Completed drill reports (PDF or signed Notion/Confluence page)
- `AuditLog` export covering drill event window
- Screenshot of health endpoint post-drill
- Time-stamped Slack/communication thread during drill

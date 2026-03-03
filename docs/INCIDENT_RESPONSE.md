# Incident Response Policy
**EduPlay SaaS Platform**
*Version 1.0 — February 2026*

---

## 1. Purpose

This policy establishes EduPlay's process for identifying, containing, and reporting personal data security incidents, with specific attention to obligations under FERPA, COPPA, GDPR, and India's DPDP Act 2023.

---

## 2. Incident Classification

| Severity | Description | Example |
|---|---|---|
| **P1 — Critical** | Unauthorized access to student PII; data exfiltration | DB credentials exposed; unauthorized export of student records |
| **P2 — High** | Service disruption affecting student data availability | DB outage > 30 min; authentication failure |
| **P3 — Medium** | Potential vulnerability with no confirmed exploitation | Dependency CVE discovered; misconfigured access control |
| **P4 — Low** | Security anomaly requiring investigation | Unusual login pattern; failed auth spike |

---

## 3. Response Timeline

| Phase | P1 Timeline | P2 Timeline |
|---|---|---|
| **Detection & Triage** | Within 2 hours | Within 4 hours |
| **Internal notification** (CTO, CEO) | Within 2 hours | Within 8 hours |
| **Containment** | Within 4 hours | Within 12 hours |
| **Customer notification** | Within 24 hours | Within 72 hours |
| **Regulatory notification** (GDPR: 72h, DPDP: 72h) | Within 72 hours | N/A (if no breach) |
| **Post-incident review** | Within 7 days | Within 14 days |

---

## 4. Notification Templates

### 4.1 School/District Notification (within 24 hours of P1)

> Subject: [EduPlay] Security Incident Notice — Action Required
>
> Dear [School/District Name],
>
> We are writing to inform you of a security incident affecting your school's account on the EduPlay platform.
>
> **Incident summary**: [Brief description]
> **Data affected**: [Categories of data]
> **Students affected**: [Number or "under investigation"]
> **Action taken**: [Containment steps]
> **Recommended action for your school**: [e.g., reset student passwords, review audit logs]
>
> We will provide a full incident report within 7 days.

### 4.2 Regulatory Notification (within 72 hours)

For incidents involving EU residents: Notify relevant Data Protection Authority via their online portal.
For incidents involving India residents: Notify CERT-In within 6 hours per IT Amendment Rules 2022.

---

## 5. Technical Response Steps

1. **Detection**: Sentry alert, `/api/health/db` alert, or user report
2. **Triage**: Determine scope using AuditLog table — `SELECT * FROM "AuditLog" WHERE "createdAt" > [incident_start] ORDER BY "createdAt"`
3. **Containment**: Revoke compromised API keys via admin dashboard; rotate `NEXTAUTH_SECRET` and `DATABASE_URL` if DB credentials are exposed
4. **Eradication**: Patch vulnerability, redeploy
5. **Recovery**: Restore from Neon point-in-time recovery (RPO < 5 min)
6. **Evidence preservation**: Export audit logs for affected period before any delete/modification
7. **Post-mortem**: Document timeline, root cause, remediation, preventive measures

---

## 6. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| **Incident Commander** (CTO) | Coordinates response, makes containment decisions |
| **Engineering Lead** | Technical investigation and remediation |
| **Customer Success** | School/district communication |
| **Legal/Compliance** | Regulatory notification decisions |

---

## 7. Contact

Internal: [internal@eduplayapp.com]
External (media/legal): [legal@eduplayapp.com]
Data Protection Officer: [dpo@eduplayapp.com]

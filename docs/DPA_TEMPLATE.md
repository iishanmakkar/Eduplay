# Data Processing Agreement — Template
**EduPlay SaaS Platform**

*Version 1.0 — February 2026*

---

## 1. Parties

This Data Processing Agreement ("DPA") is entered into between:

**Data Controller**: [School / District Name] ("Controller")
**Data Processor**: EduPlay Technologies Pvt. Ltd. ("Processor")

Effective date of DPA: [DATE]

---

## 2. Purpose and Scope

Processor will process personal data of students and educators on behalf of Controller solely for the purpose of providing the EduPlay educational platform services as described in the Master Services Agreement.

**Subject matter**: Adaptive educational game platform, skill tracking, progress reporting.
**Duration of processing**: For the term of the MSA, plus 45 days post-termination for data export requests.
**Nature of processing**: Collection, storage, retrieval, use, disclosure, erasure.
**Type of personal data**: Names, email addresses, date of birth, game activity records, skill mastery data.
**Categories of data subjects**: Students (minors under 18), teachers, school administrators.

---

## 3. Data Controller Obligations

Controller represents and warrants that:
1. It has a lawful basis for processing personal data under applicable law (FERPA, COPPA, GDPR, DPDP).
2. It will not instruct Processor to process data in violation of applicable law.
3. It has obtained all necessary parental consents for students under 13 (COPPA / DPDP).

---

## 4. Data Processor Obligations

Processor agrees to:

1. **Process data only on documented instructions** from Controller and not for Processor's own purposes.
2. **Implement appropriate technical and organizational security measures** (see Section 7).
3. **Ensure personnel confidentiality**: All persons authorized to process personal data are bound by confidentiality.
4. **Assist Controller** in fulfilling data subject rights (access, deletion, portability) within 30 days of request.
5. **Notify Controller within 72 hours** of becoming aware of a personal data breach.
6. **Delete or return all personal data** within 45 days of termination of services, per Controller's choice.
7. **Maintain sub-processor list** (Annex B) and notify Controller 30 days before adding new sub-processors.

---

## 5. Data Subject Rights

Upon request from Controller, Processor will:

| Right | Response Time | Method |
|---|---|---|
| Access (FERPA records request) | 45 days | `GET /api/export/school/{id}/students` |
| Correction | 30 days | Admin dashboard or API |
| Deletion | 30 days | Hard-delete cron + API |
| Portability | 45 days | JSON or CSV export |
| Restriction of processing | 72 hours | Account suspension API |

---

## 6. International Transfers

As of the effective date, data is primarily stored in the United States (Neon Postgres, us-east-1 region). Controller acknowledges this transfer.

For EU schools: Data transfers to the US are covered under Standard Contractual Clauses (SCCs) as approved by the European Commission (Decision 2021/914).

For India schools: Data is processed per DPDP Act 2023. Cross-border transfers to the US are conducted under applicable exemptions.

---

## 7. Technical and Organizational Security Measures

| Measure | Detail |
|---|---|
| Encryption at rest | PostgreSQL database encrypted at rest by Neon (AES-256) |
| Encryption in transit | TLS 1.2+ enforced on all connections |
| Access control | Role-based access (STUDENT / TEACHER / SCHOOL / OWNER) |
| Authentication | NextAuth.js with optional 2FA (TOTP + backup codes) |
| Audit logging | All admin actions logged with IP, user agent, timestamp |
| Vulnerability management | Dependency scanning via npm audit; Sentry error monitoring |
| Penetration testing | Annual third-party pen test (scheduled) |

---

## 8. Sub-Processors

See Annex B (SUBPROCESSORS.md) for complete list.

Processor will provide 30 days' notice prior to adding any new sub-processor that processes personal data.

---

## 9. Liability

Each party's liability under this DPA is subject to the limitations and exclusions set out in the Master Services Agreement.

---

## 10. Governing Law

This DPA is governed by the laws of [Jurisdiction — US: State of Delaware / India: Laws of India].

---

## Signatures

| Controller | Processor |
|---|---|
| Name: _______________ | Name: _______________ |
| Title: _______________ | Title: _______________ |
| Date: _______________ | Date: _______________ |
| Signature: ___________ | Signature: ___________ |

---

*Annex A — Description of Processing: See Section 2 above.*
*Annex B — Sub-Processors: See SUBPROCESSORS.md*

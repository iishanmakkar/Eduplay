# SOC 2 Type I — Vendor Risk Assessment
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: CTO

---

## Control Objective CC9.2: Vendor / Third-Party Risk Management

> EduPlay assesses and manages risks associated with vendors and business partners.

---

## Vendor Inventory & Risk Ratings

| Vendor | Service | Data Processed | Tier | SOC 2? | ISO 27001? | Risk Level |
|---|---|---|---|---|---|---|
| **Neon** | PostgreSQL Database | All student PII, game data, financials | Critical | Type II ✅ | ✅ | Low |
| **Vercel** | Hosting + Edge CDN | Request data, env vars | Critical | SOC 2 Type II ✅ | ✅ | Low |
| **Upstash** | Redis Cache | Session data, leaderboards, rate-limit state | High | SOC 2 Type II ✅ | ✅ | Low |
| **Razorpay** | Payment Processing | Order amounts, subscription IDs (NO card data) | Critical | PCI DSS Level 1 ✅ | ✅ | Low |
| **Resend** | Transactional Email | Student/teacher email addresses, first names | Medium | SOC 2 Type II ✅ | ❌ | Medium |
| **Sentry** | Error Monitoring | Stack traces, sanitized request context | Medium | SOC 2 Type II ✅ | ✅ | Low |
| **Google OAuth** | Authentication | OAuth tokens, email address | Critical | ISO 27001 ✅, SOC 2 ✅ | ✅ | Low |

---

## Risk Assessment Process

### Initial Assessment (Before Onboarding)
1. Request SOC 2 Type II report or equivalent certification
2. Review data processing agreement / DPA
3. Confirm geographic data residency requirements
4. Verify breach notification SLA (must be ≤72 hours)
5. CTO sign-off required for Critical/High tier vendors

### Annual Reassessment
- Critical tier vendors: annual review of updated SOC 2 Reports
- High tier vendors: biennial review
- Medium/Low tier vendors: review on contract renewal

---

## Contractual Controls

| Vendor | DPA Signed | Breach Notification | Right to Audit |
|---|---|---|---|
| Neon | ✅ (Neon DBA) | 72 hours | Via SOC 2 Report |
| Vercel | ✅ (Vercel DPA) | 72 hours | Via SOC 2 Report |
| Upstash | ✅ (Upstash DPA) | 72 hours | Via SOC 2 Report |
| Razorpay | ✅ (Razorpay Merchant Agreement) | Per PCI DSS | PCI QSA |
| Resend | ✅ (Resend DPA) | 72 hours | N/A |
| Sentry | ✅ (Sentry DPA) | 72 hours | Via SOC 2 Report |

---

## Vendor Concentration Risk

| Risk | Mitigation |
|---|---|
| Neon outage (primary DB) | WAL-based Neon read replicas + failover plan in `RUNBOOKS/db-failover.md` |
| Vercel outage | DNS-based failover to Railway or Fly.io (documented in runbook) |
| Razorpay downtime | Checkout flow shows maintenance message; no revenue loss — retry window |
| Upstash outage | All Redis calls wrapped in `SafeRatelimit` fallback (permit-on-failure) |

---

## Resend Medium Risk — Mitigation

Resend does not hold ISO 27001. Mitigation:
1. Minimum data sent: email + first name only (no student ID, grade, or school name)
2. Email sending is non-critical path — failure logged but does not block game play
3. Resend DPA signed; GDPR-compliant EU data processing available if needed

---

## Vendor Off-boarding Checklist

On vendor termination:
- [ ] Revoke API keys / credentials
- [ ] Confirm data deletion per DPA requirements (typically 30 days)
- [ ] Update `SUBPROCESSORS.md`
- [ ] Notify affected school districts if sub-processor changes affect their DPA
- [ ] Log in `AuditLog` with `action: 'VENDOR_OFFBOARDED'`

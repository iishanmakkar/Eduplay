# SOC 2 Type I — Change Management Policy
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: Engineering Lead + CTO

---

## Control Objective CC8.1: Change Management

> EduPlay authorizes, designs, develops/acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its commitments and system requirements.

---

## Change Categories

| Type | Examples | Approval Required | Rollback Plan |
|---|---|---|---|
| Hotfix (P1) | Security patch, data loss fix | CTO verbal + async PR | Vercel instant rollback |
| Standard | Feature, new API route, schema change | PR review (1+ engineer) | Git revert + Vercel rollback |
| Database Migration | `prisma migrate` | Engineering lead review | Migration rollback script |
| Infrastructure | New env var, service config | CTO approval | Terraform/Railway snapshot |
| Secrets Rotation | API key rotation | CTO + sec lead | Previous secret documented |

---

## Deployment Pipeline

```
Developer Branch → PR (GitHub) → CI (GitHub Actions) → Staging (Vercel Preview) → Production (Vercel)
```

### CI/CD Controls (GitHub Actions)
1. **Type checks**: `npx tsc --noEmit`
2. **Unit tests**: `npx jest --testPathPattern=__tests__/validation`
3. **Prisma validate**: `npx prisma validate`
4. **Build**: `npm run build`
5. **Auto-deploy**: Merges to `main` deploy to Vercel production automatically

### Database Migrations
- All migrations run via `npx prisma migrate deploy` in CI (not `migrate dev`)
- `migrate dev` is developer-only and never runs in CI
- Each migration has a descriptive name and is committed to version control
- Rollback: Prisma does not auto-rollback. Manual rollback SQL documented in migration PR body.

### Feature Flags
EduPlay uses code-level feature flags (`lib/feature-flags.ts`) as a kill switch.
Features behind a flag can be disabled without redeployment via `app/api/admin/feature-flags`.

---

## Change Freeze Windows

| Period | Restriction |
|---|---|
| School exam seasons (Mar, Oct) | No schema migrations; only hotfix releases |
| First 48hr after major release | No additional production pushes |
| SOC 2 audit periods | Change freeze on infrastructure; code changes require auditor notification |

---

## Approval Evidence

- GitHub PR approvals stored permanently in git history
- Deployment logs retained in Vercel dashboard (90 days) + Railway logs (30 days)
- Prisma migration history stored in `prisma/migrations/` (version controlled)

---

## Emergency Change Process (P1 Incident)

1. CTO verbal authorization via Slack/call (documented in incident channel)
2. Direct commit to `main` with `[HOTFIX]` prefix
3. Vercel auto-deploys within 60 seconds
4. Post-incident PR documenting the change submitted within 24 hours
5. Incident report filed per `INCIDENT_RESPONSE.md`

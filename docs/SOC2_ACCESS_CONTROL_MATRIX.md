# SOC 2 Type I — Access Control Matrix
**EduPlay Technologies | Classification: Internal–Confidential**
Last Updated: 2026-02-21 | Owner: Engineering + CTO

---

## Control Objective CC6.1: Logical Access

> Prior to issuing system credentials and granting system access, EduPlay registers and authorizes new internal and external users with formal access provisioning controlled by role.

---

## Role Capability Matrix

| Capability | OWNER | SCHOOL (Admin) | TEACHER | STUDENT | INDEPENDENT |
|---|:---:|:---:|:---:|:---:|:---:|
| View all schools & districts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage subscriptions / billing | ✅ | ✅ (own) | ❌ | ❌ | ✅ (own) |
| Export FERPA student data | ✅ | ✅ (own school) | ❌ | ❌ | ❌ |
| Create / delete classes | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| Assign students to classes | ✅ | ✅ | ✅ | ❌ | ❌ |
| View student mastery (BKT) | ✅ | ✅ | ✅ (own class) | ✅ (own) | ✅ (own) |
| Play games | ✅ | ❌ | ❌ | ✅ | ✅ |
| View analytics dashboard | ✅ | ✅ (own school) | ✅ (own class) | ❌ | ❌ |
| Access audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage feature flags | ✅ | ❌ | ❌ | ❌ | ❌ |
| API key management | ✅ | ✅ (read) | ❌ | ❌ | ❌ |
| Hard-delete accounts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite code generation | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Access Provisioning Process

### New School Onboarding
1. SCHOOL administrator registers → creates `User` with `role: SCHOOL`
2. Admin configures school profile and subscription (`status: TRIALING`)
3. Admin generates invite codes for teachers/students
4. First login enforces onboarding flow (`/auth/onboarding`)

### New Teacher/Student
1. Uses invite code from school admin → auto-assigned `schoolId`
2. Role set deterministically: teacher invites → `TEACHER`, student invites → `STUDENT`
3. Role cannot be upgraded by the user post-creation

### Infrastructure Access (Neon, Railway, Vercel, Upstash)
| System | Who Has Access | MFA Required | Access Review |
|---|---|---|---|
| Neon DB | CTO + Lead Eng | ✅ | Quarterly |
| Railway (prod) | CTO + Lead Eng | ✅ | Quarterly |
| Vercel | CTO + Lead Eng + DevOps | ✅ | Quarterly |
| Upstash Redis | CTO + Lead Eng | ✅ | Quarterly |
| Sentry | Engineering team | ✅ | Semi-annual |
| Razorpay Dashboard | Finance + CTO | ✅ | Quarterly |

---

## Enforcement Implementation

### Middleware RBAC (`middleware.ts`)
- All `/dashboard/*` routes protected by `getToken()` JWT validation
- Role-based redirect enforced before serving any dashboard page
- Expired subscriptions redirect to `/pricing?locked=true`

### API Route Guards
- Every API route calls `getServerSession(authOptions)` as first step
- Operations requiring elevated roles checked against `session.user.role`
- Cross-school data access prevented by `session.user.schoolId === params.id` checks

### Principle of Least Privilege
- Teachers cannot access other teachers' class data
- Students cannot view other students' mastery data
- SCHOOL admins scoped to their own school — cannot list other schools

---

## CC6.2: Pre-Employment Screening

EduPlay requires background verification for all personnel with production system access (contractors and employees). Verified via vendor contracts (documented in `SUBPROCESSORS.md`).

## CC6.3: Access Revocation

On employee/contractor departure:
1. Remove from GitHub org (automated via IAM)
2. Revoke Railway/Vercel access within 24 hours
3. Rotate `NEXTAUTH_SECRET` and `CRON_SECRET` if departing engineer had access
4. Soft-delete or deactivate user account in DB

---

## Quarterly Access Review

Automated by `/api/cron/quarterly-access-review` (runs first week of each quarter).
Returns: list of OWNER-role accounts not logged in for >90 days.
Human review required: engineering lead approves quarterly.

**Evidence Location**: `AuditLog` table, `action = 'QUARTERLY_ACCESS_REVIEW'`

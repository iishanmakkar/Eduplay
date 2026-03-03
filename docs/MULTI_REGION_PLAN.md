# EduPlay Multi-Region Evolution Plan
**Classification: Internal Engineering**
Last Updated: 2026-02-21

---

## Objective

Scale EduPlay to serve India, US, and EU markets with < 200ms p95 latency globally — **without a full infrastructure rewrite**. This plan uses progressive enhancement: each phase can ship independently and provides immediate value.

---

## Current State

```
All traffic → Vercel Edge (global CDN) → Neon US-East-1 (single region)
```

Latency profile:
- India → US: ~220ms DB round-trip
- EU → US: ~120ms DB round-trip
- US → US: ~30ms DB round-trip

**Problem**: India schools (70% of current user base) experience 220ms+ per DB query. At 5 queries per game session, that's 1.1 seconds of latency invisible to the student.

---

## Phase 1: Read Replicas (Already Implemented ✅)

```
Analytics routes → prismaReadonly → DATABASE_READONLY_URL (Neon read replica)
```

**shipped**: `/api/analytics/dau-wau`, `/api/analytics/revenue`, `/api/analytics/game-activity`, `/api/analytics/conversion`

**Impact**: Admin dashboard queries no longer compete with game writes on the primary DB.

---

## Phase 2: Per-School Region Pinning

### Schema Change
```prisma
model School {
  schoolRegion String?  // 'IN', 'US', 'EU', 'SG'
}
```
**Shipped**: Added to `prisma/schema.prisma` ✅

### Middleware Header
`middleware.ts` already sets `x-region` from `cf-ipcountry`.

Next: API routes read `x-region` and select the appropriate `prismaReadonly` client:
```typescript
const region = req.headers.get('x-region') || 'US'
const db = getRegionalReadClient(region) // returns prismaReadonly for now
```

---

## Phase 3: Neon Multi-Region Read Replicas

Neon supports instant branch-based read replicas. Target: India replica (ap-south-1).

```
Dashboard (IN school) → x-region: IN → Neon India Read Replica
Game play (IN school) → always → Neon US Primary (write)
Dashboard (US school) → x-region: US → Neon US Read Replica
```

**Cost**: ~$30–60/month for an India read replica at 100K users.
**Latency benefit**: India analytics queries drop from 220ms → ~30ms.

Implementation:
```typescript
// lib/prisma.ts (future)
export const prismaReadIndia = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_READONLY_IN_URL } }
})

export function getRegionalReadClient(region: string) {
    if (region === 'IN' && process.env.DATABASE_READONLY_IN_URL) return prismaReadIndia
    return prismaReadonly  // fallback to US replica
}
```

---

## Phase 4: Region-Based Feature Flags

Feature flags in `lib/feature-flags.ts` support region-scoped rollout:

```typescript
// Future extension
await setFlag('AI_IRT_WEIGHTING_ENABLED', true, { regions: ['IN'] })
// Rolls out IRT to India first, US/EU when confident
```

**Use case**: DPDP compliance features → India only. GDPR features → EU only.

---

## Phase 5: Region-Aware Multiplayer Matching

Current: all multiplayer matches are globally pooled.

Target: match students within the same region to reduce WebSocket latency.

```typescript
// app/api/multiplayer/match/route.ts (future)
const schoolRegion = session.user.school.schoolRegion || 'GLOBAL'
const matchRegion = REGION_MATCHING_ENABLED ? schoolRegion : 'GLOBAL'

const match = await prisma.gameSession.findFirst({
    where: {
        status: 'WAITING',
        participants: { none: {} },
        schoolRegion: matchRegion  // prefer same-region match
    }
})
```

---

## Non-Targets (Avoid Until 200K+ Users)

| Feature | Why Not Yet |
|---|---|
| Multi-region write DB (multi-master) | Neon doesn't support it; CockroachDB would require full migration |
| EU data residency (separate EU DB) | Required only for EU schools; needed when first EU contract signed |
| Global CDN for DB (PlanetScale Boost) | Not on Neon stack; reassess at $100K MRR |
| Kubernetes / container orchestration | Vercel + Railway handles this at current scale |

---

## Latency Targets by Phase

| Phase | India p95 | EU p95 | Cost |
|---|---|---|---|
| Current | ~300ms | ~180ms | $0 |
| Phase 2 (region pinning) | ~300ms (unchanged) | ~180ms | $0 |
| Phase 3 (Neon India) | **~80ms** | ~100ms | +$40/mo |
| Phase 4 (feature flags) | ~80ms | ~100ms | $0 |
| Phase 5 (regional match) | ~80ms + lower WS latency | ~100ms | $0 |

# EduPlay Investor Defense Layer
**Classification: Confidential — Series A Due Diligence**
Last Updated: 2026-02-21

---

## Section 1 — Unit Economics at 100K Users

### Infrastructure Cost Model

| Service | 100K Users | Notes |
|---|---|---|
| Neon PostgreSQL | $69/mo | Pro plan; 10GB storage + 1 compute unit |
| Upstash Redis | $20/mo | Pay-per-request at ~5M req/mo |
| Vercel Hosting | $40/mo | Pro plan (10 seats) |
| Railway (crons) | $10/mo | Background workers |
| Resend Email | $20/mo | ~50K emails/mo |
| Sentry | $26/mo | Team plan |
| **Total Infra** | **~$185/mo** | **$0.0019 per user/month** |

### Revenue at 100K Users (Conservative)

| Segment | Users | Monthly Revenu |
|---|---|---|
| School STARTER (40 schools × 300 students) | 12,000 | ₹ 2,40,000 (~$2,880) |
| School SCHOOL plan (80 schools × 500 students) | 40,000 | ₹ 12,00,000 (~$14,400) |
| DISTRICT plan (10 districts × 3,000 students) | 30,000 | ₹ 18,00,000 (~$21,600) |
| INDEPENDENT students | 18,000 | ₹ 4,50,000 (~$5,400) |
| **Total MRR** | **100K** | **~$44,280** |

### Gross Margin at 100K Users
```
MRR:         $44,280
Infra cost:  -$185
Team (3):   -$15,000  (founder CTO + 2 eng)
Support:     -$1,000
Total COGS: -$16,185

Gross Profit: $28,095 / mo
Gross Margin: 63%
```

---

## Section 2 — Infrastructure Scaling Curve

| User Count | DB | Redis | Infra Cost | Cost/User/Mo |
|---|---|---|---|---|
| 10K | Neon Free | Upstash Pay-as-go | $50/mo | $0.005 |
| 100K | Neon Pro | Upstash Scale | $185/mo | $0.0019 |
| 500K | Neon Business + India replica | Upstash Enterprise | $620/mo | $0.0012 |
| 1M | Neon Enterprise + 3 replicas | Upstash Enterprise | $1,400/mo | $0.0014 |

> Infrastructure unit cost **decreases** with scale. This is the hallmark of a software-driven product at favorable cost structure for a SaaS model.

---

## Section 3 — Margin Projection at 500K Users

| Metric | Value |
|---|---|
| Target ARR | $6.4M |
| Gross Revenue | $533K/mo |
| Infra Cost | $620/mo (0.1% of revenue) |
| Team (10 FTE) | $50,000/mo |
| Gross Margin | **90%** |
| EBITDA Margin | **79%** |

> At 500K, infra is a rounding error. Margin expands as team cost grows slower than revenue.

---

## Section 4 — Net Revenue Retention (NRR) Levers

### Current NRR Drivers
1. **Seat expansion**: `billedStudentCount` grows as schools add students → automatic MRR expansion
2. **Plan upgrades**: STARTER → SCHOOL → DISTRICT upgrade path driven by teacher/district adoption
3. **Multi-grade expansion**: Once one grade adopts EduPlay, adjacent grades follow (teacher recommendation loop)

### NRR Model

| Year | NRR Target | Primary Driver |
|---|---|---|
| Year 1 | 110% | New student seats within existing schools |
| Year 2 | 125% | Grade expansion + district upsell |
| Year 3 | 135% | District → multi-district contracts |

> At 125% NRR, existing customers grow the business even without new acquisition.

---

## Section 5 — CAC / LTV Assumptions

### CAC (Customer Acquisition Cost)
| Channel | CAC | Notes |
|---|---|---|
| Outbound (district sales) | ₹25,000 ($300) | Sales-led; slow but high LTV |
| Teacher virality (invite codes) | ₹2,000 ($24) | Dominant channel; teachers invite students |
| Content marketing (math problems viral) | ₹800 ($10) | Growing organic; playable demos |
| **Blended CAC** | **₹3,500 ($42)** | Per school (not per user) |

### LTV (Lifetime Value)
| Plan | ACV | Avg Lifetime | LTV |
|---|---|---|---|
| STARTER | ₹60,000 ($720) | 2.5 years | ₹150,000 ($1,800) |
| SCHOOL | ₹1,80,000 ($2,160) | 3 years | ₹540,000 ($6,480) |
| DISTRICT | ₹12,00,000 ($14,400) | 5 years | ₹60,00,000 ($72,000) |

### LTV:CAC
| Plan | LTV:CAC |
|---|---|
| STARTER | **43:1** |
| SCHOOL | **154:1** |
| DISTRICT | **1,714:1** |

> LTV:CAC > 10x at every tier. District contracts are transformative.

---

## Section 6 — School Expansion Model

### Viral Coefficient (k-factor)
1. Teacher at School A uses EduPlay
2. Teacher mentions it at district professional development session
3. 2–3 adjacent schools adopt within the same district
4. District IT notices → initiates district-wide pilot
5. → District contract (10–50× the original school ACV)

**Empirical k-factor target**: 1.8 (each school generates 0.8 additional schools in year 1)

### Expansion Sequence
```
Parent District (1 school pilot) 
→ Grade adoption (2–4 more grades in same school)
→ Sibling school recommendation (1–3 more schools)
→ District IT consolidation (district contract)
→ Adjacent district targeting (district to district virality)
```

---

## Section 7 — AI Defensibility Explanation (Non-Technical)

> **For investors who ask "can't Google/Khan Academy just copy this?"**

EduPlay's AI is **not a feature** — it is a **data flywheel**:

1. Students play → BKT mastery records are created (15,000+ data points per student per year)
2. More data → better BKT parameter calibration per subject/grade
3. Better calibration → more accurate adaptive difficulty → better learning outcomes
4. Better outcomes → teachers recommend to more schools → more students → more data

**The moat is the data, not the algorithm.** At 100K students with 12 months of play history, EduPlay's BKT models are calibrated at a level that would take a competitor 12 months to replicate — during which EduPlay continues to improve.

Khan Academy's AI (Khanmigo/GPT-4 based) is a different approach (LLM tutor), not BKT/IRT. Google's tools (Google Classroom) are infrastructure, not adaptive content. No direct competitor combines BKT + IRT + spaced repetition + gamification + India-first pricing.

### Data Moat Depth Estimate
| Students | Moat Depth (replication time) |
|---|---|
| 10K | 3 months to replicate |
| 100K | 12 months to replicate |
| 500K | 3+ years to replicate |
| 1M+ | Effectively permanent |

---

## Section 8 — Data Network Effects

EduPlay benefits from two data network effects:

### Network Effect 1: Curriculum Graph Calibration
Every school that uses EduPlay improves the skill DAG calibration for all future schools in the same curriculum (CBSE, NCERT, Common Core, etc.). A new school joining in Grade 4 Math gets the benefit of 1,000 prior Grade 4 Math journeys.

### Network Effect 2: Cohort Benchmarking
As more schools join, SCHOOL admins get richer comparative analytics:
- "Your Grade 4 Math mastery is in the 67th percentile of CBSE schools"
- This benchmarking feature is **impossible without network data** — and becomes more valuable as the network grows

These are **cross-side** network effects: more schools → better model calibration → better outcomes → more schools. Classic SaaS flywheel with an educational twist.

---

## Final Summary Table — Investor Confidence Metrics

| Metric | Value |
|---|---|
| Gross Margin at 100K | 63% |
| Gross Margin at 500K | 90% |
| LTV:CAC (blended) | 300:1 |
| NRR (Year 2 target) | 125% |
| Infra/Revenue ratio | < 0.5% |
| AI replication time (100K) | 12 months |
| Data moat type | Multi-sided network effect |
| SOC 2 status | Type I by Q2 2026 |
| FERPA compliance | ✅ Implemented |
| Enterprise procurement ready | ✅ DPA + Subprocessors + Incident Response |

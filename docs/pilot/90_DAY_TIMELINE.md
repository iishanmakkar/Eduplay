# EduPlay — 90-Day Pilot Timeline
**Week-by-Week Execution Plan**

---

## PRE-LAUNCH — Week 0 (Days -14 to 0)

### Founder Actions
- [ ] Identify 15 target schools (need 10 to commit; expect ~67% acceptance rate)
- [ ] Send Email 1 (Principal Outreach) to all 15 principals
- [ ] Follow up unresponsive principals via WhatsApp after 3 days
- [ ] Schedule and complete 10 kickoff calls
- [ ] Sign Pilot Agreements with 10 schools
- [ ] Create school profiles in EduPlay admin
- [ ] Generate unique invite codes per school (teacher + student batches)
- [ ] Prepare teacher setup video (Loom, < 5 min)
- [ ] Prepare teacher WhatsApp quick-start card
- [ ] Set up WhatsApp groups: one per school + one master group (all pilot HoDs)

### Tech Readiness Check
- [ ] Run `GET /api/health/slo` — confirm 200 OK
- [ ] Run `GET /api/health/db` — confirm latency < 200ms
- [ ] Confirm cron jobs all firing (`vercel.json`)
- [ ] Confirm BKT tests passing: `npx jest bkt-clamp`
- [ ] Confirm weekly admin email template configured in Resend

---

## WEEK 1 (Days 1–7) — ACTIVATION

**Goal**: 80% teachers active, 30% students signed up

| Day | Action |
|---|---|
| Day 1 | Send Email 2 (Teacher Welcome) to all teachers at all 10 schools |
| Day 2 | Follow up via WhatsApp: teacher invite code reminder |
| Day 3 | Check activation dashboard: flag schools with < 20% teacher activation |
| Day 4 | Personal WhatsApp to HoD at lagging schools |
| Day 5 | Post in master pilot group: "School X has [Y] students active!" (social proof) |
| Day 7 | Run Week 1 health check (SQL queries from SOP) |
| Day 7 | 10-minute check-in call with each school's HoD (all 10 schools this week) |

**Target metrics**:
- Teachers active: ≥ 80%
- Students signed up: ≥ 30%
- Games played total: ≥ 500

---

## WEEK 2 (Days 8–14) — HABITUATION

**Goal**: Students playing 3+ times/week; teachers assigning weekly

| Day | Action |
|---|---|
| Day 8 | Send personalized teacher "Week 1 summary" (Email 3 variant) |
| Day 10 | WhatsApp nudge to any teacher with < 5 students assigned |
| Day 12 | Post leaderboard screenshot in master pilot group (school vs school XP total) |
| Day 14 | Weekly metrics pull: WAU, streak count, games played |

**Target metrics**:
- WAU: ≥ 40% of enrolled students
- Avg sessions/active student: ≥ 2.5
- Streak ≥ 3 days: ≥ 25% of active students

---

## WEEK 3–4 (Days 15–30) — DATA ACCUMULATION

**Goal**: Mastery data accumulating; identify first signal schools (high mastery delta)

| Day | Action |
|---|---|
| Day 15 | Automated weekly admin summary begins (Email 4) |
| Day 18 | Identify the top 3 schools by mastery delta — note for impact report |
| Day 21 | Send teachers the first "weakest skill heatmap" for their class |
| Day 25 | Post in master pilot group: "We've now processed [X] game sessions!" |
| Day 30 | **Month 1 review call** — each school gets a 15-minute data review |

**Target metrics**:
- WAU: ≥ 55% of enrolled students
- Avg mastery delta (school-wide): ≥ +0.05 (early; full signal at Day 60)
- Assignment completion rate: ≥ 60%
- ≥ 5,000 total game sessions at this point

---

## WEEK 5–8 (Days 31–60) — MOAT BUILDING

**Goal**: Deep mastery data; begin IRT calibration prep

| Day | Action |
|---|---|
| Day 35 | Analyze first 5,000 response sequences — spot any miscalibrated skills |
| Day 42 | "School of the Week" in master pilot group — top mastery delta school |
| Day 45 | Send each teacher: "Your class's time-to-mastery is [X] sessions per skill" |
| Day 50 | Begin drafting impact report (Sections 1–3) — use real data |
| Day 55 | Identify the "top 10 hardest skills" across the cohort (SQL from calibration plan) |
| Day 60 | **Send Email 5 (Day 60 Impact Preview)** to all school admins |
| Day 60 | **Month 2 review call** — show each school their ranked position in pilot |

**Target metrics**:
- WAU: ≥ 65% of enrolled students
- Total game sessions: ≥ 30,000
- Skills with ≥ 100 student responses (IRT-calibratable): ≥ 20 skills
- Avg mastery delta: ≥ +0.15

---

## WEEK 9–10 (Days 61–75) — AI CALIBRATION

**Goal**: Use real data to improve IRT model; finalize impact report

| Day | Action |
|---|---|
| Day 62 | Run IRT b-parameter estimation query (METRICS_FRAMEWORK.md) |
| Day 65 | Identify top 10 hardest skills + miscalibrated items |
| Day 67 | Update `selectNextItemDifficulty()` with calibrated b-values |
| Day 70 | Complete draft of full impact report |
| Day 72 | Get 2 teacher quotes for impact report ("Before/After" format) |
| Day 75 | **Send Email 6 (Conversion Offer)** to all school admins |
| Day 75 | **Begin conversion calls** — start with highest-LEI schools first |

**Target metrics**:
- Impact report draft: complete
- IRT calibration: ≥ 15 skills calibrated
- Week 10 WAU: ≥ 70% of enrolled students

---

## WEEK 11–12 (Days 76–90) — CONVERSION

**Goal**: 8/10 schools signed; impact report published

| Day | Action |
|---|---|
| Day 76 | Conversion call with every school (20 min each) |
| Day 78 | Send signed proposals to interested schools |
| Day 80 | Follow up: "Early discount expires Day 88" |
| Day 82 | WhatsApp voice note to undecided principals (more personal than email) |
| Day 84 | Offer to join trust/management meeting for district schools |
| Day 85 | Finalize impact report — get principal approval for their school's data |
| Day 87 | Publish impact report (PDF + web version) |
| Day 88 | Final deadline for 10% pilot discount |
| Day 90 | Pilot ends. Final tally: contracts signed, churn reasons documented |

**Target metrics (Day 90)**:
- Schools converted to paid: ≥ 8 (80%)
- ARR locked: ≥ ₹8,40,000 ($10,000)
- Impact report published: ✅
- IRT calibrated on pilot data: ✅
- Series A data asset: 3 months of mastery trajectories from 3,000+ students ✅

---

## Series A Leverage Points Created by Day 90

| Asset | How it was created |
|---|---|
| **Revenue proof** | ₹8–18L ARR from 8–10 paying schools |
| **Retention proof** | 80% pilot schools → paying (NRR > 100% signal) |
| **Mastery proof** | Published impact report with real P(L) delta numbers |
| **AI proof** | IRT calibrated from real data — better than any competitor without this data |
| **Operational proof** | 99.9% uptime across 90 days, 50K+ game sessions processed |
| **Market proof** | 10 schools across 1 region in 90 days = scalable GTM playbook |
| **Expansion proof** | 3 schools in same district/trust = district upsell pipeline visible |

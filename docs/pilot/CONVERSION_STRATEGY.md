# EduPlay — Conversion Engine
**Pricing Strategy, Revenue Projection, and Conversion Funnel**

---

## Pricing Architecture

### Core Tiers (Annual Billing — 20% Discount vs Monthly)

| Plan | Target | Students | Price/Year | Per Seat/Month |
|---|---|---|---|---|
| **STARTER** | Small private schools | Up to 300 | **₹60,000** | ₹16.67 |
| **SCHOOL** | Mid-size CBSE schools | Up to 600 | **₹1,80,000** | ₹25.00 |
| **DISTRICT** | District/trust networks | Up to 5,000 | **₹12,00,000** | ₹20.00 |
| **INDEPENDENT** | Individual students | 1 student | **₹2,400/year** | ₹200/month |

### Pilot→Paid Transition Discounts
| Timing | Discount | Rationale |
|---|---|---|
| Sign within Day 75–80 | 20% off first year | Early adopter reward |
| Sign Day 81–88 | 10% off | Standard pilot discount |
| Sign Day 89–90 | 0% — full price | Urgency. Pilot ends = data loss. |
| Sign after Day 91 | Full price + migration fee | Late = no goodwill discount |

### Premium Add-Ons (Upsell, not required for conversion)

| Feature | Price | Who Buys |
|---|---|---|
| AI Analytics Pack | +₹12,000/year | District/SCHOOL tier |
| School Tournament Mode | +₹6,000/year | Competition-oriented schools |
| Parent Progress Reports | +₹8,000/year | SCHOOL/DISTRICT |
| API Access + LMS Integration | +₹20,000/year | District IT who uses REMS/ERPs |

---

## Conversion Funnel Map

```
Day 0: Pilot start
   ↓
Day 30: First mastery report → "wow, this is real data"
   ↓
Day 60: Impact preview → ranked #N in pilot → social proof activated
   ↓
Day 75: Conversion call — ROI calculator walkthrough + pricing
   ↓
Day 78: Proposal email with signed quote
   ↓
Day 82: Follow-up if no reply (10% discount expires Day 88)
   ↓
Day 85: "Last chance" WhatsApp (voice note from founder > email)
   ↓
Day 88: Final offer at full price
   ↓
Day 90: Pilot ends. Contract or churn.
```

**Objection handling**:
| Objection | Response |
|---|---|
| "Too expensive for our school" | "Your math team saves 4 hours/week of test prep. That's ₹X in teacher time alone — vs ₹5,000/month." |
| "We'll evaluate next year" | "Your students' mastery profiles reset if you leave. The 90 days of learning data doesn't transfer." |
| "We use [competitor]" | "Show me their individual P(L) mastery score per student. If they have it, we'll match their price." |
| "We need principal + trust approval" | "I'll join the meeting. 20 minutes — I'll bring the data." |

---

## School ROI Calculator

### Input Variables
- School plan tier (STARTER / SCHOOL / DISTRICT)
- Number of math teachers
- Number of students
- Current cost: tuition, extra classes, test prep materials

### Output
```
Annual EduPlay cost:      ₹[X]
Teacher time saved:       [N] teachers × 2 hrs/week × 40 weeks × [₹hourly_rate]
                       =  ₹[Y] equivalent
Extra tuition displaced:  [N] students × ₹[tuition_monthly] × [months avoided]
                       =  ₹[Z]
Mastery improvement:      [X]pp avg P(L) growth (from your own pilot data)

ROI:                      [((Y + Z) - X) / X × 100]% = [N]% return
Payback period:           [X weeks]
```

**For SCHOOL-tier school (500 students, 10 math teachers)**:
```
Cost: ₹1,80,000/year
Teacher time saved: 10 × 2 × 40 × ₹300/hr = ₹2,40,000/year
Net benefit: ₹2,40,000 - ₹1,80,000 = ₹60,000 profit in year 1
(Year 2+: full ₹2,40,000 benefit as cost is sunk)
```

---

## Revenue Projection — Post Pilot

### Conservative Scenario (6/10 schools convert)

| Plan Mix | Schools | ACV | Total ARR |
|---|---|---|---|
| STARTER (early discount 20%) | 4 | ₹48,000 | ₹1,92,000 |
| SCHOOL (early discount 10%) | 2 | ₹1,62,000 | ₹3,24,000 |
| **Total** | **6** | | **₹5,16,000** ($6,200) |

### Base Scenario (8/10 schools convert)

| Plan Mix | Schools | ACV | Total ARR |
|---|---|---|---|
| STARTER | 5 | ₹60,000 | ₹3,00,000 |
| SCHOOL | 3 | ₹1,80,000 | ₹5,40,000 |
| **Total** | **8** | | **₹8,40,000** ($10,100) |
| Add-on upsell rate 30% | 2–3 schools | +₹12,000 | +₹36,000 |
| **Final ARR** | | | **₹8,76,000** ($10,500) |

### Optimistic + Viral Scenario (10/10 + 5 referral schools)

| Scenario | ARR |
|---|---|
| 10 pilot converts + 5 referral schools | ₹18,00,000 ($21,600) |
| 1 district contract unlocked | +₹12,00,000 ($14,400) |
| **Total ARR at Month 6** | **₹30,00,000** ($36,000) |

---

## NRR Expansion Path

After Year 1:
1. **Seat expansion** — schools add students each academic year → automatic MRR growth
2. **Grade expansion** — Grade 4–5 adopters add Grade 6–7 → 1.5× ACV uplift
3. **Plan upgrade** — STARTER → SCHOOL when teacher count grows > 3
4. **Add-on attach** — AI Analytics Pack offered at renewal (30% attach target)
5. **District pull** — 3+ schools in same trust/district → trigger district pilot → 10× ACV

**Projected NRR Year 1**: 118%
**Projected NRR Year 2**: 135% (district upsell cycle activates)

---

## Teacher Referral Incentive

**Program structure**: Any teacher who refers a new school gets:
- ₹2,000 Amazon voucher when the referred school signs (paid, not just trialed)
- Named credit in EduPlay's quarterly teacher impact newsletter
- Early access to new features (AI tutor, premium games)

Teachers are the most efficient distribution channel — they talk to each other at district training sessions, competitive math events, and WhatsApp groups. One satisfied math HoD at a well-known school can generate 5–8 warm leads per year.

# EduPlay — IRT Calibration Plan
**Converting Pilot Data Into AI Competitive Advantage**

---

## Objective

Use 3 months of real student response data (1,000–3,000 students, 50,000+ game sessions) to:
1. Estimate item-level IRT parameters (a, b, c) from real responses
2. Identify the 10 most miscalibrated items (too easy → no learning; too hard → frustration)
3. Improve adaptive difficulty selection for all future students
4. Create the "Hardest Skill Heatmap" for the impact report

---

## What Data We Have After 90 Days

| Data Type | Estimated Volume |
|---|---|
| Game sessions | 50,000–150,000 |
| Individual question responses | 500,000–1,500,000 |
| UserSkillMastery records | 3,000–10,000 |
| Unique skills practiced | 50–200 |
| BKT P(L) trajectories per student | 1,000–3,000 per skill |

> This is enough for **item-level BKT parameter fitting** and **IRT b-parameter estimation** on high-frequency skills (those with ≥ 200 student responses).

---

## Step 1 — Response Data Collection (Days 1–90, ongoing)

For IRT calibration we need to log individual question responses, not just session-level scores.

**Required data per response:**
```
{
  questionId: string,        // unique ID per question variant
  studentId: string,         // hashed for privacy
  isCorrect: boolean,
  timeSpentMs: number,       // for speed anomaly + difficulty estimation
  skillCode: string,
  grade: string,
  bktPL_before: number,     // P(L) before this response
  bktPL_after: number,       // P(L) after this response
  sessionId: string
}
```

> This data is already partially captured in `GameResult`. For pilot, ensure `score` breakdown is available per question, not just per session.

---

## Step 2 — Item Difficulty Estimation (Day 75–80)

### Method: Proportion Correct (Quick Estimate)
For each question, estimate difficulty `b`:
```
p_correct = responses_correct / total_responses

# Map p_correct to IRT b-parameter:
b_estimate = -logit(p_correct) / 1.7  
# where logit(p) = log(p / (1-p))

# Examples:
# p=0.90 (very easy) → b ≈ -1.29
# p=0.50 (moderate)  → b ≈  0.00
# p=0.20 (very hard) → b ≈  1.09
```

### Top 10 Hardest Skills Query
```sql
SELECT
    sn.code AS skill_code,
    sn.name AS skill_name,
    sn.grade,
    COUNT(*) AS total_attempts,
    ROUND(AVG(gr.score)::numeric / 100, 3) AS p_correct,
    ROUND(
        -LN(AVG(gr.score)::numeric / 100 / NULLIF(1 - AVG(gr.score)::numeric / 100, 0)) / 1.7,
        3
    ) AS b_estimate
FROM "GameResult" gr
JOIN "User" u ON gr."userId" = u.id
JOIN "SkillNode" sn ON gr."gameType" = sn.code  -- assumes gameType maps to skill code
WHERE u."schoolId" = ANY($1::text[])  -- all pilot schools
  AND gr."completedAt" >= NOW() - INTERVAL '90 days'
GROUP BY sn.id, sn.code, sn.name, sn.grade
HAVING COUNT(*) >= 100  -- Only calibrate on statistically significant sample
ORDER BY b_estimate DESC
LIMIT 10;
```

---

## Step 3 — BKT Parameter Recalibration (Day 80–85)

Current BKT parameters are expert-estimated defaults:
- P(T) = 0.10 (transition/learning rate)
- P(S) = 0.10 (slip)
- P(G) = 0.20 (guess)

After pilot, fit skill-specific parameters by maximizing likelihood of observed response sequences.

**Simplified EM approach** (manual, one-skill-at-a-time):
```python
# For each skill with > 200 response sequences:
# 1. Extract all (student_id, response_sequence) pairs
# 2. For each (P_T, P_S, P_G) candidate in grid:
#    compute P(observed responses | P_T, P_S, P_G, P_L_0=0.1)
# 3. Pick (P_T, P_S, P_G) that maximizes log-likelihood
# 4. Update skill's BKT parameters in database
```

**Expected findings**: Some skills will have P(T) = 0.02 (hard to learn), others P(T) = 0.25 (easy to learn). This calibration makes mastery estimates dramatically more accurate.

---

## Step 4 — Difficulty Curve Improvement (Day 85–88)

After calibration:
1. Identify questions where estimated `b` is too far from student's current `θ` (ability estimate)
2. Flag questions where `|b - theta| > 2.0` → these are either too easy or too hard for the cohort
3. Propose question variants at intermediate difficulties for flagged skills
4. Update `selectNextItemDifficulty()` to use calibrated `b` values instead of uniform `[-2,-1,0,1,2]`

---

## Step 5 — Hardest Skill Heatmap (Day 88–90)

For the impact report and Series A deck:

| Rank | Skill | Grade | p_correct | b_est | Recommendation |
|---|---|---|---|---|---|
| 1 | Fractions: Division | Grade 6 | 18% | +1.21 | Add 3 intermediate steps |
| 2 | Algebra: Variables | Grade 7 | 22% | +0.98 | Add visual scaffolding |
| 3 | Percentages: Word problems | Grade 5 | 27% | +0.74 | Break into sub-skills |
| ... | ... | ... | ... | ... | ... |

**"The Hardest 10" is marketing gold**: principals share this because it validates that the platform is measuring something real — not just gamification.

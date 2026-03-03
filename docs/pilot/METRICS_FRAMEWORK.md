# EduPlay Pilot — Metrics Framework
**Exact Definitions, SQL Aggregation Logic, and KPI Tracking Schema**

---

## Student-Level Metrics

### 1. Accuracy Growth Over Time
**Definition**: Rolling 7-day average accuracy per student, compared to baseline (first 3 sessions).

```sql
-- Per-student accuracy by week
SELECT
    u.id AS student_id,
    u."firstName",
    DATE_TRUNC('week', gr."completedAt") AS week,
    ROUND(AVG(gr.score)::numeric, 1) AS avg_accuracy,
    COUNT(*) AS sessions
FROM "GameResult" gr
JOIN "User" u ON gr."userId" = u.id
WHERE u."schoolId" = $1
  AND gr."completedAt" >= NOW() - INTERVAL '90 days'
GROUP BY u.id, u."firstName", DATE_TRUNC('week', gr."completedAt")
ORDER BY u.id, week;
```

---

### 2. Mastery Delta — P(L) Growth
**Definition**: Change in average `masteryProbability` per student across all practiced skills, from Day 0 to Day N.

**Formula**: `Δ P(L) = avg(P(L)_current) - avg(P(L)_day0)`

```sql
-- Current avg mastery per student
SELECT
    u.id AS student_id,
    u."firstName",
    ROUND(AVG(usm."masteryProbability")::numeric, 3) AS avg_mastery_now,
    COUNT(DISTINCT usm."skillId") AS skills_tracked,
    MAX(usm."updatedAt") AS last_active
FROM "UserSkillMastery" usm
JOIN "User" u ON usm."userId" = u.id
WHERE u."schoolId" = $1
GROUP BY u.id, u."firstName"
ORDER BY avg_mastery_now DESC;
```

**Pilot KPI target**: Avg mastery delta ≥ +0.25 across all students by Day 90.

---

### 3. Skill Gap Closure Rate
**Definition**: % of skills that were below mastery threshold (< 0.60) on Day 1 that crossed 0.60 P(L) by Day N.

```sql
-- Skills below 0.60 mastery that improved above 0.60
-- (Requires a snapshot table; proxy: compare totalAttempts > 10 with current P(L))
SELECT
    sn.code AS skill_code,
    sn.name AS skill_name,
    COUNT(*) FILTER (WHERE usm."masteryProbability" >= 0.60) AS above_threshold,
    COUNT(*) AS total_students,
    ROUND(
        COUNT(*) FILTER (WHERE usm."masteryProbability" >= 0.60)::numeric / NULLIF(COUNT(*), 0) * 100,
        1
    ) AS pct_mastered
FROM "UserSkillMastery" usm
JOIN "SkillNode" sn ON usm."skillId" = sn.id
JOIN "User" u ON usm."userId" = u.id
WHERE u."schoolId" = $1
  AND usm."totalAttempts" >= 5
GROUP BY sn.id, sn.code, sn.name
ORDER BY pct_mastered ASC;
```

---

### 4. Engagement Streak Retention
**Definition**: % of students maintaining a streak ≥ 3 days by end of the reporting week.

```sql
SELECT
    u."schoolId",
    COUNT(*) FILTER (WHERE u."currentStreak" >= 3) AS streak_3plus,
    COUNT(*) FILTER (WHERE u."currentStreak" >= 7) AS streak_7plus,
    COUNT(*) AS total_students,
    ROUND(
        COUNT(*) FILTER (WHERE u."currentStreak" >= 3)::numeric / NULLIF(COUNT(*), 0) * 100, 1
    ) AS streak_retention_pct
FROM "User" u
WHERE u."schoolId" = $1 AND u.role = 'STUDENT' AND u."deletedAt" IS NULL
GROUP BY u."schoolId";
```

---

### 5. Time-to-Mastery per Skill
**Definition**: Avg number of sessions for a student to go from P(L) < 0.30 to P(L) ≥ 0.80.

```sql
-- Proxy: total attempts before reaching 0.80 mastery
SELECT
    sn.name AS skill_name,
    ROUND(AVG(usm."totalAttempts")::numeric, 1) AS avg_attempts_to_mastery,
    COUNT(*) AS students_who_mastered
FROM "UserSkillMastery" usm
JOIN "SkillNode" sn ON usm."skillId" = sn.id
JOIN "User" u ON usm."userId" = u.id
WHERE u."schoolId" = $1
  AND usm."masteryProbability" >= 0.80
  AND usm."totalAttempts" >= 3
GROUP BY sn.id, sn.name
ORDER BY avg_attempts_to_mastery ASC;
```

---

## Teacher-Level Metrics

### 6. Assignment Completion Rate

```sql
-- For each assignment, what % of enrolled students completed it
SELECT
    a.id, a.title, a."dueDate",
    COUNT(DISTINCT ce.id) AS enrolled,
    COUNT(DISTINCT gr."userId") FILTER (
        WHERE gr."completedAt" <= a."dueDate"
    ) AS completed,
    ROUND(
        COUNT(DISTINCT gr."userId") FILTER (WHERE gr."completedAt" <= a."dueDate")::numeric
        / NULLIF(COUNT(DISTINCT ce.id), 0) * 100, 1
    ) AS completion_pct
FROM "Assignment" a
JOIN "ClassEnrollment" ce ON ce."classId" = a."classId"
LEFT JOIN "GameResult" gr ON gr."userId" = ce."studentId"
    AND gr."gameType" = a."gameType"
    AND gr."completedAt" BETWEEN a."createdAt" AND a."dueDate" + INTERVAL '1 day'
WHERE a."teacherId" = $1
GROUP BY a.id, a.title, a."dueDate"
ORDER BY a."dueDate" DESC;
```

---

### 7. Weakest Skill Heatmap (per class)

```sql
-- Bottom 10 skills by average mastery in a class
SELECT
    sn.name AS skill,
    sn.subject,
    sn.grade,
    ROUND(AVG(usm."masteryProbability")::numeric, 3) AS avg_mastery,
    COUNT(*) AS student_count
FROM "UserSkillMastery" usm
JOIN "SkillNode" sn ON usm."skillId" = sn.id
JOIN "User" u ON usm."userId" = u.id
JOIN "ClassEnrollment" ce ON ce."studentId" = u.id
WHERE ce."classId" = $1
  AND usm."totalAttempts" >= 3
GROUP BY sn.id, sn.name, sn.subject, sn.grade
HAVING COUNT(*) >= 3  -- Only skills practiced by at least 3 students
ORDER BY avg_mastery ASC
LIMIT 10;
```

---

## School-Level Metrics

### 8. Weekly Active Users (WAU)

```sql
SELECT
    DATE_TRUNC('week', gr."completedAt") AS week,
    COUNT(DISTINCT gr."userId") AS wau,
    COUNT(*) AS total_sessions,
    ROUND(AVG(gr.score)::numeric, 1) AS avg_accuracy
FROM "GameResult" gr
JOIN "User" u ON gr."userId" = u.id
WHERE u."schoolId" = $1
  AND gr."completedAt" >= NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', gr."completedAt")
ORDER BY week DESC;
```

---

## Learning Efficiency Index (LEI)

**The headline metric for the impact report and investor deck.**

```
LEI = (Mastery Delta × Streak Retention × Skill Gap Closure) / Sessions Per Student

Where:
  Mastery Delta      = avg P(L) growth across all students (0–1 scale)
  Streak Retention   = % students with streak ≥ 3 days (0–1 scale)
  Skill Gap Closure  = % weakly-mastered skills that crossed threshold (0–1 scale)
  Sessions Per Student = avg sessions per active student (this week)

Interpretation:
  LEI > 0.10 → Excellent (top quartile)
  LEI 0.05–0.10 → Good
  LEI < 0.05 → Needs intervention (low streak or low closure)
```

**Example**: Mastery Delta = 0.18, Streak Retention = 0.72, Gap Closure = 0.61, Sessions/Student = 8
→ LEI = (0.18 × 0.72 × 0.61) / 8 = **0.0099 → needs more session frequency**

The LEI is designed so that it **cannot be gamed by passive use** — high mastery without engagement OR high engagement without mastery improvement both produce low LEI.

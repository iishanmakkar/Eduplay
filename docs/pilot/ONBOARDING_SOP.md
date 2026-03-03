# EduPlay Pilot — Onboarding SOP
**Standard Operating Procedure for School Activation**
Version 1.0

---

## Step 0 — Pre-Onboarding (Day -3 to 0)

### Founder/Sales Actions
- [ ] Pilot Agreement signed (see `PILOT_AGREEMENT.md`)
- [ ] School profile created in EduPlay admin (schoolName, slug, domain)
- [ ] SCHOOL-role admin account created for principal or department head
- [ ] Invite codes generated: 1 batch for teachers, 1 batch for students
- [ ] WhatsApp group created: `[School Name] × EduPlay Pilot`
- [ ] Kickoff call scheduled with principal + head of math department

---

## Step 1 — Principal Kickoff Call (Day 0, 30 minutes)

**Agenda**:
1. Show the dashboard (3 minutes: real data from another pilot school)
2. Explain the 3 commitments we need from them:
   - Teachers to run 2 class sessions/week through EduPlay
   - Students to play minimum 3 times/week
   - Admin to share anonymized mastery data for the impact report
3. Set Week 1 goal: 100% teacher accounts created, 50% student accounts
4. Hand over: teacher invite code + student invite code sheet
5. Schedule Week 1 check-in call (15 minutes, Day 7)

**Do not spend more than 30 minutes on this call.**

---

## Step 2 — Teacher Activation (Days 1–5)

### Teacher Activation Checklist (per teacher)
- [ ] Receive invite code from admin
- [ ] Sign up at `/auth/register` → role auto-set to TEACHER
- [ ] Complete profile (first name, subject, grade)
- [ ] Create first class at `/dashboard/teacher/classes/new`
- [ ] Add 5+ students to class (via student invite code)
- [ ] Assign first assignment (any available math game, 3-day window)
- [ ] View class mastery map at `/dashboard/teacher/mastery`

**Teacher success milestone**: First assignment created + 3 students submitted → teacher is "activated."

### Teacher Support Toolbox
- Setup video (< 5 minutes, screen recording)
- WhatsApp quick-start card (1 image, 5 steps)
- FAQ doc (10 most common questions)
- Direct WhatsApp to EduPlay support (founder responds within 2 hours)

---

## Step 3 — Student Activation (Days 1–7)

### Student Activation Checklist
- [ ] Teacher distributes invite code in class (WhatsApp to parents / written in notebook)
- [ ] Student signs up at `/auth/register` → role STUDENT
- [ ] Google OAuth sign-in (no password to forget!)
- [ ] Completes onboarding flow: selects grade + subjects
- [ ] Plays first game (target: < 5 minutes from signup to first game)
- [ ] Earns 50 XP (first milestone) → streak starts

**Student success milestone**: 3 sessions played in first week.

**Parent communication**: Teacher sends WhatsApp message with:
- EduPlay link
- Student invite code
- "10 minutes per day replaces homework drills"

---

## Step 4 — Week 1 Health Check (Day 7 call, 15 minutes)

Check these numbers before the call:
```sql
-- Teacher activation rate
SELECT COUNT(*) FROM "User" WHERE "schoolId" = ? AND "role" = 'TEACHER' AND "createdAt" > NOW() - INTERVAL '7 days'

-- Student signup rate  
SELECT COUNT(*) FROM "User" WHERE "schoolId" = ? AND "role" = 'STUDENT' AND "createdAt" > NOW() - INTERVAL '7 days'

-- Games played this week
SELECT COUNT(*) FROM "GameResult" gr JOIN "User" u ON gr."userId" = u.id WHERE u."schoolId" = ? AND gr."completedAt" > NOW() - INTERVAL '7 days'
```

**Green light**: ≥ 60% teachers activated, ≥ 30% students signed up.
**Yellow light**: < 30% students → teacher needs WhatsApp nudge template.
**Red light**: < 10% → escalate to principal immediately.

---

## Step 5 — Ongoing Rhythm (Days 8–90)

| Cadence | Action |
|---|---|
| **Daily** (automated) | Streak reminder emails to students (already deployed) |
| **Weekly Monday** | Admin receives automated Mastery Growth Report email |
| **Weekly Wednesday** | EduPlay sends teacher the "weakest skill heatmap" for their class |
| **Day 30** | Founder call: "Here's your school's learning data — look at this" |
| **Day 60** | Preview of impact report → "your school is in the top 3 on mastery growth" |
| **Day 75** | Conversion call: ROI calculator + annual pricing |
| **Day 82** | Follow-up if not converted: limited-time offer (10% discount for early renewal) |
| **Day 90** | Pilot ends. Paid or churned. Document reason either way. |

---

## School Admin Dashboard — What They See

The school admin (`/dashboard/school`) should surface:
- **WAU trend chart** (this week vs last week vs 4 weeks ago)
- **Top 5 engaged students by XP** (motivates other students when shared)
- **Weakest skills across the school** (what teachers need to focus on)
- **Avg mastery delta this week** (P(L) growth — headline number)
- **Assignment completion rate by class**

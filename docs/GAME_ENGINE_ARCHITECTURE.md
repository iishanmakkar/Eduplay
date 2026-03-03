# EduPlay Unified Game Engine — Architecture
**Version 2.0 | Competitive-Ready | 25 Games**

---

## System Overview

```
Student Client
    │
    ├─── POST /api/games/session          ──► GameSession created server-side
    │         ↓ questions (no answers)            stored in Redis (30min TTL)
    │
    ├─── [Game plays locally with questions from session]
    │
    ├─── POST /api/games/save-result      ──► Server verifies signature
    │         submittedAnswers[], signature         computes score server-side
    │         sessionId                             updates BKT, XP, leaderboard
    │
    └─── GET /dashboard/student           ──► Leaderboard (Redis sorted sets)
                                                    BKT mastery maps
                                                    Skill gap reports
```

---

## Phase 1 — Game Integrity Audit

### Fixes Made to `lib/game-engine/math-engine.ts`

| Issue | Fix |
|---|---|
| Two-step `×` branch: `step1Result` reassigned twice | Forward construction: pick `step1Result` cleanly, derive final answer with real math |
| `generateOptions()` could produce NaN/Infinity distractors | Added `isFinite()` / `isNaN()` guard before adding to Set |
| Deterministic fill loop reused `options.size` (could loop infinitely) | Replaced with counter `fill++` with monotonic increment |
| `calculate()` could return `-0` | Added `Object.is(result, -0) ? 0 : result` normalization |

### Simulation Results (10,000 runs)
All validations implemented in `lib/game-engine/integrity-validator.ts`:
- ✅ Zero NaN answers
- ✅ Zero undefined answers
- ✅ No multi-correct option sets
- ✅ No duplicate options
- ✅ Division always produces integer results
- ✅ Correct answer always present in options
- ✅ Negative-zero normalized to positive zero

---

## Phase 2 — Unified Session Architecture

### Server-Side Question Generation Flow

```
POST /api/games/session
    receive: gameType, mode, studentId, difficulty, grade
    generate: questions via MathEngine (server-side, never client)
    sign: questionHash = HMAC(sessionId + questionIds + correctAnswers, SECRET)
    store: GameSessionInternal in Redis (with correctAnswers, 30min TTL)
    return: GameSession (WITHOUT correctAnswers)

POST /api/games/save-result
    receive: sessionId, submittedAnswers[], answerTimestamps[], signature
    validate: signature = HMAC(sessionId + submittedAnswers + userId, SECRET)
    validate: speed cap (min 400ms per answer)
    validate: session not expired, not already used
    compute: score server-side via answer-validator + ScoringEngine
    apply: power-up effects (DOUBLE_XP, SHIELD)
    save: GameResult, XP, BKT
    mark: session as used (replay prevention)
```

### Key Types (`lib/game-engine/game-session.ts`)

```typescript
interface GameQuestion {
    id: string              // UUID for deduplication
    display: string         // Question text/expression
    type: 'MCQ' | 'TEXT_INPUT' | 'SEQUENCE' | 'MATCH'
    options?: string[]      // MCQ only; shuffled server-side
    skillCode: string       // BKT tracking
    difficultyLevel: 1|2|3|4
    timeLimit: number       // Seconds
    // correctAnswer: intentionally ABSENT from client-sent type
}
```

---

## Phase 3 — Multi-Leaderboard System

### Board Types (Redis Sorted Sets)

| Board | Redis Key Pattern | Scope | TTL |
|---|---|---|---|
| Global weekly | `lb:global:{week}` | All students | 8 days |
| School weekly | `lb:school:{schoolId}:{week}` | Per school | 8 days |
| Grade weekly | `lb:grade:{grade}:{week}` | Per grade band | 8 days |
| Game weekly | `lb:game:{gameType}:{week}` | Per game type | 8 days |
| All-time | `lb:alltime` | Global | No expiry |

### Tie-Handling
```
score = xp * 1e10 + (MAX_TS - timestamp)
```
Higher XP always wins. For identical XP: earlier submission wins.

### XP Inflation Prevention
- `save-result` computes XP server-side (not from client)
- PPS cap: score/timeSpent capped at maximum possible
- Submission signature prevents tampered answer payloads

---

## Phase 4 — Answer Correctness Guarantee

### Validation Strategies (`lib/game-engine/answer-validator.ts`)

| Strategy | Games | Logic |
|---|---|---|
| `math_numeric` | SpeedMath, MathGrid | `|parsed - correct| ≤ 0.01` |
| `text_exact` | ScienceQuiz, WorldFlags | `trim().toLowerCase()` |
| `text_multi` | CodeBreaker, RiddleSprint, Analogies | Pipe-separated valid answers |
| `typing_exact` | TypingSpeed, KidsTypingTutor | Char-accurate, case-sensitive |
| `word_scramble` | WordScramble | Normalize + remove hyphens |
| `sequence_ordered` | PatternSequence, SequenceBuilder | JSON array comparison |
| `memory_pair` | MemoryMatch, MemoryMatrix, MemoryGridAdv | Pair integrity check |
| `generic_choice` | ColorMatch, VisualRotation, etc. | Case-insensitive string match |

---

## Phase 5 — Grade-Locked Difficulty

### Four Grade Bands (`lib/game-engine/grade-difficulty-map.ts`)

| Band | Grades | Number Range | Operators | Time/Q | Distractor |
|---|---|---|---|---|---|
| K2 | K–2 | 1–20 | +, - | 30s | ±1–2 |
| 35 | 3–5 | 1–100 | +, -, ×, ÷ | 20s | ±3–10 |
| 68 | 6–8 | ±999 | all + decimals | 15s | logically close |
| 912 | 9–12 | ±9999 | all + fractions | 10s | expert traps |

### Difficulty Promotion Gate (Double-Lock)
```
promote = accuracy ≥ 85% (last 10 sessions)
       && recentAccuracy ≥ 85% (last 3 sessions)
       && BKT P(L) ≥ 85% (average across game's skill codes)
```

---

## Phase 6 — Power-Ups

| Power-Up | Effect | Max/Session | Server-Enforced |
|---|---|---|---|
| 🧊 TIME_FREEZE | +5s on timer (client enforces pause) | 1 | Usage tracked in Redis per session |
| ⚡ DOUBLE_XP | Final XP × 2 | 1 | Applied in save-result before DB write |
| 🛡️ SHIELD | First wrong answer absorbed (streak intact) | 1 | applyShieldToStreak() in scoring logic |

---

## Phase 7 — Security & Fairness

| Attack | Defense |
|---|---|
| Client spoofs score | Server computes score from submitted answers; client score ignored |
| Client modifies questions | HMAC question hash verified before scoring |
| Replay attack (resend same session) | Session marked `used=true` after save-result; 409 on duplicate |
| Too-fast answering (bot) | Speed cap: min 400ms per answer enforced server-side |
| Multi-tab parallel sessions | Session `tabId` bound; second active session rejected |
| XP inflation | PPS cap + server-computed XP only |

---

## Classroom Mode (Mode 3) — Session Flow

```
Teacher → POST /api/games/classroom/create → gets code "XK4R9P"
Students → POST /api/games/classroom/join { code: "XK4R9P" } → lobby
Teacher → POST /api/games/classroom/XK4R9P/start → all students get questions
Students → POST /api/games/classroom/XK4R9P/submit { questionIndex, submitted, timeMs }
All → GET /api/games/classroom/XK4R9P/results → live ranked leaderboard
Teacher → GET /api/games/classroom/XK4R9P/export?format=csv → full export
```

### Race Condition Prevention
- Redis stores all player answers atomically
- Submit is idempotent: duplicate (studentId, questionIndex) → 200 "already submitted"
- Session status transitions are single-key atomic writes
- Max 60 concurrent students per session

---

## Test Plan

### Automated
```bash
# 10,000-run game engine audit (Phase 1)
npx jest __tests__/validation/game-engine-audit.test.ts --verbose

# Answer validator unit tests (Phase 4)
npx jest __tests__/validation/answer-validator.test.ts --verbose

# Existing BKT tests
npx jest bkt-clamp --verbose
```

### Classroom Stress Test (Phase 2)
```
30 concurrent students join session → submit answers simultaneously
→ Assert: zero race conditions (all answers recorded)
→ Assert: results endpoint consistent under load
→ Assert: duplicate submits return idempotent 200, not double-recorded
```

---

## Files Created/Modified

| File | Phase | What |
|---|---|---|
| `lib/game-engine/math-engine.ts` | 1 | Fixed × bug, NaN guards, -0 normalization |
| `lib/game-engine/integrity-validator.ts` | 1 | 10K sim validator, option uniqueness checker |
| `__tests__/validation/game-engine-audit.test.ts` | 1 | Full audit test suite |
| `lib/game-engine/answer-validator.ts` | 4 | 8 strategies for all 25 games |
| `lib/game-engine/game-session.ts` | 2 | Unified session types, HMAC, speed cap |
| `lib/game-engine/grade-difficulty-map.ts` | 5 | 4 grade bands, distractor strength |
| `lib/game-engine/power-ups.ts` | 6 | TIME_FREEZE, DOUBLE_XP, SHIELD |
| `lib/game-engine/adaptive-difficulty.ts` | 5 | BKT mastery gate added |
| `lib/cache/leaderboard.ts` | 3 | 5 board types, tie-aware scoring |
| `app/api/games/classroom/create/route.ts` | 2 | Teacher creates session |
| `app/api/games/classroom/join/route.ts` | 2 | Student joins via code |
| `app/api/games/classroom/[code]/start/route.ts` | 2 | Teacher starts + students poll |
| `app/api/games/classroom/[code]/submit/route.ts` | 2 | Student submits answer (idempotent) |
| `app/api/games/classroom/[code]/results/route.ts` | 2 | Live ranked results |
| `app/api/games/classroom/[code]/export/route.ts` | 2 | CSV + JSON export |

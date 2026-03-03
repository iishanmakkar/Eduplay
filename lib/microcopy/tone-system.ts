/**
 * lib/microcopy/tone-system.ts
 *
 * PHASE 3 — Global Microcopy Tone System
 *
 * 4-tier tone calibration:
 *  KG–2  → playful, warm, celebratory
 *  3–5   → encouraging, energetic, confidence-building
 *  6–8   → competitive, precise, skill-oriented
 *  9–12  → intellectual, strategic, academic
 */

export type GradeTier = 'kg2' | '35' | '68' | '912'

export type FeedbackType =
    | 'correct'
    | 'incorrect'
    | 'streak'
    | 'session_complete'
    | 'xp_earned'
    | 'level_up'
    | 'hint_used'
    | 'time_up'
    | 'new_best'
    | 'first_attempt'

export interface FeedbackMessage {
    headline: string
    subtext: string
    cta?: string
}

// ── Correct answer messages ───────────────────────────────────────────────────

const CORRECT_MESSAGES: Record<GradeTier, FeedbackMessage[]> = {
    kg2: [
        { headline: '🌟 Wonderful!', subtext: 'You got it right! Keep going!', cta: 'Next →' },
        { headline: '🎉 Amazing!', subtext: "That's exactly right! You're so smart!", cta: 'Keep going!' },
        { headline: '⭐ Super Star!', subtext: 'Perfect answer! You did it!', cta: 'Next →' },
        { headline: '🦋 Beautiful!', subtext: 'You are getting so good at this!', cta: 'More!' },
    ],
    '35': [
        { headline: 'Correct! 🔥', subtext: 'Sharp thinking — that answer is exactly right.', cta: 'Next Question' },
        { headline: 'Nailed it! ✅', subtext: 'Your reasoning was spot on. Keep it up!', cta: 'Continue' },
        { headline: 'Great work! 💪', subtext: "That's the right answer and you found it fast!", cta: 'Next →' },
        { headline: 'Excellent! ⚡', subtext: 'You showed real understanding there.', cta: 'Keep going' },
    ],
    '68': [
        { headline: 'Correct ✓', subtext: 'Sound reasoning. That solution is verified.', cta: 'Next' },
        { headline: 'Well done', subtext: 'Accurate application of the concept. Streak building.', cta: 'Continue' },
        { headline: 'Precise answer ✓', subtext: 'You applied the method correctly under time pressure.', cta: 'Next →' },
        { headline: 'Confirmed ✓', subtext: 'Excellent reasoning. That solution is mathematically sound.', cta: 'Proceed' },
    ],
    '912': [
        { headline: 'Validated ✓', subtext: 'Excellent reasoning. That solution is mathematically sound.', cta: 'Advance' },
        { headline: 'Correct', subtext: 'Your analysis identified the precise answer. Confidence score updated.', cta: 'Next' },
        { headline: 'Accurate ✓', subtext: 'Logical framework correctly applied. Mastery delta: +1%.', cta: 'Continue' },
        { headline: 'Confirmed', subtext: 'Rigorous and exact. Your conceptual model is solid.', cta: 'Proceed' },
    ],
}

// ── Incorrect answer messages ─────────────────────────────────────────────────

const INCORRECT_MESSAGES: Record<GradeTier, FeedbackMessage[]> = {
    kg2: [
        { headline: 'Oops! 🌈', subtext: "Not quite — let's try again! You can do it!", cta: 'Try Again' },
        { headline: "That's OK! 💛", subtext: "Mistakes help us learn! Let's look at the answer.", cta: 'See Answer' },
        { headline: 'Almost! 🌟', subtext: "You're learning so much. Let's check the answer together.", cta: 'Next' },
    ],
    '35': [
        { headline: 'Not quite ❌', subtext: "Good try! Review the approach and you'll get it next time.", cta: 'See Explanation' },
        { headline: 'Incorrect', subtext: "That answer isn't right — check the explanation to see why.", cta: 'Explain' },
        { headline: 'Keep trying! 💡', subtext: "Mistakes build mastery. Review the correct answer below.", cta: 'See Answer' },
    ],
    '68': [
        { headline: 'Incorrect', subtext: "Not quite. Let's analyze the structure of the problem.", cta: 'Analysis' },
        { headline: 'Review needed', subtext: 'This concept requires reinforcement — examine the correct method.', cta: 'Show Method' },
        { headline: 'Incorrect ✗', subtext: 'Identify where the logic diverged and recalibrate your approach.', cta: 'Examine' },
    ],
    '912': [
        { headline: 'Incorrect', subtext: "Not quite. Let's deconstruct the reasoning. Identify which axiom was misapplied.", cta: 'Deconstruct' },
        { headline: 'Recalibrate', subtext: 'Your model produced an incorrect result. Examine the underlying assumptions.', cta: 'Analyse' },
        { headline: 'Error detected', subtext: 'Systematic error in approach. Review the derivation carefully.', cta: 'Review' },
    ],
}

// ── Session complete messages ─────────────────────────────────────────────────

const SESSION_COMPLETE: Record<GradeTier, FeedbackMessage> = {
    kg2: { headline: '🎊 You finished!', subtext: "Amazing job today! You're a star learner!", cta: 'See my stars!' },
    '35': { headline: '🏆 Session Complete!', subtext: "Fantastic work! You've leveled up your skills today.", cta: 'See Results' },
    '68': { headline: 'Session Complete', subtext: 'Review your performance and target your next improvement area.', cta: 'View Dashboard' },
    '912': { headline: 'Session Complete — Review & Optimise', subtext: 'Analyse your performance vectors and calibrate your next practice session.', cta: 'Performance Intelligence' },
}

// ── XP earned messages ────────────────────────────────────────────────────────

const XP_EARNED: Record<GradeTier, (xp: number, skill: string) => string> = {
    kg2: (xp) => `You earned ${xp} stars! ⭐`,
    '35': (xp, skill) => `+${xp} XP unlocked! Your ${skill} skill is growing!`,
    '68': (xp, skill) => `+${xp} XP — ${skill} mastery advancing.`,
    '912': (xp, skill) => `You've strengthened your mastery in ${skill}. +${xp} XP accrued.`,
}

// ── Streak messages ───────────────────────────────────────────────────────────

const STREAK_MESSAGES: Record<GradeTier, (n: number) => string> = {
    kg2: (n) => `${n} in a row! You're on fire! 🔥`,
    '35': (n) => `${n} streak! You're unstoppable! 🔥`,
    '68': (n) => `${n}-answer streak — momentum is building.`,
    '912': (n) => `${n}-sequence streak. Cognitive flow state engaged.`,
}

// ── Hint used messages ────────────────────────────────────────────────────────

const HINT_USED: Record<GradeTier, string> = {
    kg2: "Here's a little clue! 💡",
    '35': "Here's a hint to help you out!",
    '68': 'Hint: Focus on this key principle —',
    '912': 'Analytical scaffold: Consider the following constraint —',
}

// ── Time up messages ──────────────────────────────────────────────────────────

const TIME_UP: Record<GradeTier, FeedbackMessage> = {
    kg2: { headline: "Time's up! ⏰", subtext: "Let's see the answer!", cta: 'Next' },
    '35': { headline: "Time's up!", subtext: "No problem — let's look at the correct answer.", cta: 'See Answer' },
    '68': { headline: 'Time expired', subtext: 'Answer not submitted in time. Review the correct solution.', cta: 'Review' },
    '912': { headline: 'Time limit reached', subtext: 'Optimise for time efficiency in subsequent attempts. Correct solution below.', cta: 'Analyse' },
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Detect the grade tier from a gradeBand string.
 */
export function getGradeTier(gradeBand: string): GradeTier {
    if (['kg2', 'kg', '1', '2'].includes(gradeBand)) return 'kg2'
    if (['35', '3', '4', '5'].includes(gradeBand)) return '35'
    if (['68', '6', '7', '8'].includes(gradeBand)) return '68'
    return '912'
}

/**
 * Get a correct-answer feedback message for a given tier.
 * Rotates through messages based on question index for variety.
 */
export function getCorrectMessage(tier: GradeTier, questionIndex = 0): FeedbackMessage {
    const msgs = CORRECT_MESSAGES[tier]
    return msgs[questionIndex % msgs.length]
}

/**
 * Get an incorrect-answer feedback message.
 */
export function getIncorrectMessage(tier: GradeTier, questionIndex = 0): FeedbackMessage {
    const msgs = INCORRECT_MESSAGES[tier]
    return msgs[questionIndex % msgs.length]
}

/**
 * Get the session complete message.
 */
export function getSessionCompleteMessage(tier: GradeTier): FeedbackMessage {
    return SESSION_COMPLETE[tier]
}

/**
 * Get the XP earned message string.
 */
export function getXPMessage(tier: GradeTier, xp: number, skill = 'this skill'): string {
    return XP_EARNED[tier](xp, skill)
}

/**
 * Get a streak milestone message.
 */
export function getStreakMessage(tier: GradeTier, streakCount: number): string {
    return STREAK_MESSAGES[tier](streakCount)
}

export function getHintMessage(tier: GradeTier): string {
    return HINT_USED[tier]
}

export function getTimeUpMessage(tier: GradeTier): FeedbackMessage {
    return TIME_UP[tier]
}

export type { GradeTier as GradeTierType }

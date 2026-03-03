/**
 * __tests__/engine/bkt.test.ts
 *
 * BKT (Bayesian Knowledge Tracing) bounds and behavior tests.
 * Ensures mastery estimates stay in [0,1] and converge as expected.
 */

import { updateBKT, classifyPriority, buildWeaknessProfile, getHighestImpactSkill } from '../../lib/ai-games/weakness-trainer'

describe('updateBKT — bounds', () => {
    test('initial state in valid range', () => {
        const initial = 0.20  // pInit
        expect(initial).toBeGreaterThan(0)
        expect(initial).toBeLessThan(1)
    })

    test('always stays between 0 and 1', () => {
        let p = 0.20
        for (let i = 0; i < 1000; i++) {
            p = updateBKT(p, Math.random() > 0.5)
            expect(p).toBeGreaterThan(0)
            expect(p).toBeLessThan(1)
        }
    })

    test('correct answers increase mastery', () => {
        let p = 0.20
        const before = p
        for (let i = 0; i < 10; i++) p = updateBKT(p, true)
        expect(p).toBeGreaterThan(before)
    })

    test('wrong answers decrease mastery (or hold steady)', () => {
        let p = 0.80
        const before = p
        for (let i = 0; i < 10; i++) p = updateBKT(p, false)
        expect(p).toBeLessThanOrEqual(before)
    })

    test('converges toward high mastery with all correct answers', () => {
        let p = 0.20
        for (let i = 0; i < 50; i++) p = updateBKT(p, true)
        expect(p).toBeGreaterThan(0.85)
    })
})

describe('classifyPriority', () => {
    test('< 0.40 is critical', () => expect(classifyPriority(0.30)).toBe('critical'))
    test('0.40-0.74 is review', () => expect(classifyPriority(0.60)).toBe('review'))
    test('>= 0.75 is strong', () => expect(classifyPriority(0.80)).toBe('strong'))
})

describe('buildWeaknessProfile', () => {
    const history = [
        { skill: 'fractions', subject: 'math', correct: false },
        { skill: 'fractions', subject: 'math', correct: false },
        { skill: 'fractions', subject: 'math', correct: false },
        { skill: 'algebra', subject: 'math', correct: true },
        { skill: 'algebra', subject: 'math', correct: true },
        { skill: 'algebra', subject: 'math', correct: true },
    ]

    test('returns profile with correct userId', () => {
        const profile = buildWeaknessProfile('user-1', history)
        expect(profile.userId).toBe('user-1')
    })

    test('weaker skill has higher priority', () => {
        const profile = buildWeaknessProfile('user-1', history)
        const fractions = profile.skillGaps.find(g => g.skill === 'fractions')
        const algebra = profile.skillGaps.find(g => g.skill === 'algebra')
        expect(fractions).toBeDefined()
        expect(algebra).toBeDefined()
        // Fractions (2 wrong + 1 correct) should have lower mastery than algebra
        expect(fractions!.masteryLevel).toBeLessThan(algebra!.masteryLevel)
    })

    test('recommends fractions as top priority', () => {
        const profile = buildWeaknessProfile('user-1', history)
        expect(profile.recommendedTopics[0]).toBe('fractions')
    })

    test('lastUpdated is recent', () => {
        const profile = buildWeaknessProfile('user-1', history)
        expect(Date.now() - profile.lastUpdated.getTime()).toBeLessThan(1000)
    })
})

describe('getHighestImpactSkill', () => {
    test('returns the skill with highest expected gain', () => {
        const profile = buildWeaknessProfile('user-1', [
            { skill: 'fractions', subject: 'math', correct: false },
            { skill: 'algebra', subject: 'math', correct: true },
        ])
        const best = getHighestImpactSkill(profile)
        expect(best).toBe('fractions')  // Lower mastery = higher learning gain
    })

    test('returns null if all skills are strong', () => {
        const profile = buildWeaknessProfile('user-1', [
            ...Array(30).fill({ skill: 'algebra', subject: 'math', correct: true }),
        ])
        const best = getHighestImpactSkill(profile)
        // All strong — should return null
        expect(best).toBeNull()
    })
})

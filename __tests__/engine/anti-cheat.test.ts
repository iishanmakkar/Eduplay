/**
 * __tests__/engine/anti-cheat.test.ts
 *
 * Tests for anti-cheat subsystem:
 *  - Payload validation
 *  - HMAC signing and verification
 *  - Duplicate guard (in-memory fallback)
 */

import {
    validateSubmissionPayload,
    signPayload,
    verifyPayloadHMAC,
} from '../../lib/game-engine/anti-cheat'

// --- Payload validation ---------------------------------------------------

describe('validateSubmissionPayload', () => {
    test('valid payload passes', () => {
        const r = validateSubmissionPayload({
            questionId: 'abc123',
            userAnswer: 'Paris',
            timeTaken: 4500,
        })
        expect(r.valid).toBe(true)
        expect(r.errors).toHaveLength(0)
    })

    test('missing questionId fails', () => {
        const r = validateSubmissionPayload({ userAnswer: 'Paris', timeTaken: 4500 })
        expect(r.valid).toBe(false)
        expect(r.errors.some(e => e.includes('questionId'))).toBe(true)
    })

    test('missing userAnswer fails', () => {
        const r = validateSubmissionPayload({ questionId: 'abc', timeTaken: 4500 })
        expect(r.valid).toBe(false)
        expect(r.errors.some(e => e.includes('userAnswer'))).toBe(true)
    })

    test('negative timeTaken fails', () => {
        const r = validateSubmissionPayload({ questionId: 'abc', userAnswer: 'x', timeTaken: -100 })
        expect(r.valid).toBe(false)
        expect(r.errors.some(e => e.includes('timeTaken'))).toBe(true)
    })

    test('Infinity timeTaken fails', () => {
        const r = validateSubmissionPayload({ questionId: 'abc', userAnswer: 'x', timeTaken: Infinity })
        expect(r.valid).toBe(false)
    })

    test('NaN timeTaken fails', () => {
        const r = validateSubmissionPayload({ questionId: 'abc', userAnswer: 'x', timeTaken: NaN })
        expect(r.valid).toBe(false)
    })
})

// --- HMAC signing + verification -----------------------------------------

describe('signPayload + verifyPayloadHMAC', () => {
    const payload = { questionId: 'q-001', userAnswer: '42', timeTaken: 5000 }
    const secret = 'test-session-secret'

    test('signed payload verifies correctly', () => {
        const sig = signPayload(payload, secret)
        expect(verifyPayloadHMAC(payload, sig, secret)).toBe(true)
    })

    test('tampered answer fails verification', () => {
        const sig = signPayload(payload, secret)
        const tampered = { ...payload, userAnswer: '999' }
        expect(verifyPayloadHMAC(tampered, sig, secret)).toBe(false)
    })

    test('tampered timeTaken fails verification', () => {
        const sig = signPayload(payload, secret)
        const tampered = { ...payload, timeTaken: 1 }
        expect(verifyPayloadHMAC(tampered, sig, secret)).toBe(false)
    })

    test('wrong secret fails verification', () => {
        const sig = signPayload(payload, secret)
        expect(verifyPayloadHMAC(payload, sig, 'wrong-secret')).toBe(false)
    })

    test('malformed HMAC (wrong length) returns false without throwing', () => {
        expect(verifyPayloadHMAC(payload, 'not-a-valid-hmac', secret)).toBe(false)
    })

    test('HMAC is deterministic for same input', () => {
        const sig1 = signPayload(payload, secret)
        const sig2 = signPayload(payload, secret)
        expect(sig1).toBe(sig2)
    })

    test('different payloads produce different HMACs', () => {
        const sig1 = signPayload({ ...payload, userAnswer: 'A' }, secret)
        const sig2 = signPayload({ ...payload, userAnswer: 'B' }, secret)
        expect(sig1).not.toBe(sig2)
    })
})

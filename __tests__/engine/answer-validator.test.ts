/**
 * __tests__/engine/answer-validator.test.ts
 *
 * Tests for the unified answer validator.
 * Covers all strategies: math_numeric, math_fraction, math_plus_minus,
 * generic_choice, text_exact, text_multi, sequence_ordered.
 */

import {
    validateAnswer,
    fractionsEqual,
    simplifyFraction,
    normalizeNumeric,
    normalizeText,
} from '../../lib/game-engine/answer-validator'

// --- normalizeText -----------------------------------------------------------

describe('normalizeText', () => {
    test('trims and lowercases', () => {
        expect(normalizeText('  Hello World  ')).toBe('hello world')
    })
    test('collapses internal whitespace', () => {
        expect(normalizeText('a  b   c')).toBe('a b c')
    })
})

// --- normalizeNumeric --------------------------------------------------------

describe('normalizeNumeric', () => {
    test('parses integers', () => expect(normalizeNumeric('42')).toBe(42))
    test('parses negative', () => expect(normalizeNumeric('-7')).toBe(-7))
    test('strips commas', () => expect(normalizeNumeric('1,000')).toBe(1000))
    test('-0 becomes 0', () => expect(normalizeNumeric('-0')).toBe(0))
})

// --- fractionsEqual ----------------------------------------------------------

describe('fractionsEqual', () => {
    test('1/2 == 2/4', () => expect(fractionsEqual('1/2', '2/4')).toBe(true))
    test('3/4 != 2/3', () => expect(fractionsEqual('3/4', '2/3')).toBe(false))
    test('integer "2" == "2/1"', () => expect(fractionsEqual('2', '2/1')).toBe(true))
    test('0.5 and 1/2 are equal via numeric fallback', () => {
        // Not cross-multiply equal (0.5 is not a fraction string), but falls back to decimal
        const result = validateAnswer('0.5', '1/2', 'FRACTION_ARROW_ARCHER')
        expect(result.isCorrect).toBe(true)
    })
})

// --- simplifyFraction --------------------------------------------------------

describe('simplifyFraction', () => {
    test('6/4 -> 3/2', () => expect(simplifyFraction('6/4')).toBe('3/2'))
    test('8/4 -> 2/1', () => expect(simplifyFraction('8/4')).toBe('2/1'))
    test('already simplified', () => expect(simplifyFraction('3/7')).toBe('3/7'))
})

// --- validateAnswer: math_numeric -------------------------------------------

describe('validateAnswer math_numeric', () => {
    test('integer exact match', () => {
        expect(validateAnswer('42', '42', 'NUMBER_CATERPILLAR').isCorrect).toBe(true)
    })
    test('within 0.01 tolerance', () => {
        expect(validateAnswer('3.14', '3.14159', 'DECIMAL_DODGE').isCorrect).toBe(true)
    })
    test('beyond tolerance fails', () => {
        expect(validateAnswer('3.0', '3.14', 'DECIMAL_DODGE').isCorrect).toBe(false)
    })
    test('NaN submitted fails gracefully', () => {
        const r = validateAnswer('abc', '42', 'NUMBER_CATERPILLAR')
        expect(r.isCorrect).toBe(false)
        expect(r.matchType).toBe('failed')
    })
    test('negative numbers', () => {
        expect(validateAnswer('-5', '-5', 'INTEGER_ICE_BATTLE').isCorrect).toBe(true)
    })
})

// --- validateAnswer: math_fraction ------------------------------------------

describe('validateAnswer math_fraction', () => {
    test('1/2 matches 2/4', () => {
        expect(validateAnswer('2/4', '1/2', 'FRACTION_ARROW_ARCHER').isCorrect).toBe(true)
    })
    test('wrong fraction fails', () => {
        expect(validateAnswer('1/3', '1/2', 'FRACTION_ARROW_ARCHER').isCorrect).toBe(false)
    })
    test('0.5 matches 1/2', () => {
        expect(validateAnswer('0.5', '1/2', 'PIZZA_SLICE_WARS').isCorrect).toBe(true)
    })
})

// --- validateAnswer: math_plus_minus ----------------------------------------

describe('validateAnswer math_plus_minus', () => {
    test('+-3 matches +-3', () => {
        expect(validateAnswer('+-3', '+-3', 'QUADRATIC_QUEST').isCorrect).toBe(true)
    })
    test('3 matches +-3 (magnitude)', () => {
        expect(validateAnswer('3', '+-3', 'QUADRATIC_QUEST').isCorrect).toBe(true)
    })
    test('-3 matches +-3 (magnitude)', () => {
        expect(validateAnswer('-3', '+-3', 'QUADRATIC_QUEST').isCorrect).toBe(true)
    })
    test('4 does not match +-3', () => {
        expect(validateAnswer('4', '+-3', 'QUADRATIC_QUEST').isCorrect).toBe(false)
    })
})

// --- validateAnswer: generic_choice -----------------------------------------

describe('validateAnswer generic_choice', () => {
    test('case-insensitive match', () => {
        expect(validateAnswer('PARIS', 'paris', 'CAPITALS_CONQUEST').isCorrect).toBe(true)
    })
    test('trimmed match', () => {
        expect(validateAnswer('  Paris  ', 'paris', 'CAPITALS_CONQUEST').isCorrect).toBe(true)
    })
    test('wrong city fails', () => {
        expect(validateAnswer('London', 'Paris', 'CAPITALS_CONQUEST').isCorrect).toBe(false)
    })
})

// --- validateAnswer: text_multi ---------------------------------------------

describe('validateAnswer text_multi', () => {
    test('matches first valid answer', () => {
        expect(validateAnswer('cat', 'cat|cats|the cat', 'CODE_BREAKER').isCorrect).toBe(true)
    })
    test('matches second valid answer', () => {
        expect(validateAnswer('cats', 'cat|cats|the cat', 'CODE_BREAKER').isCorrect).toBe(true)
    })
    test('invalid answer fails', () => {
        expect(validateAnswer('dog', 'cat|cats|the cat', 'CODE_BREAKER').isCorrect).toBe(false)
    })
})

// --- validateAnswer: sequence_ordered ---------------------------------------

describe('validateAnswer sequence_ordered', () => {
    test('correct order passes', () => {
        expect(validateAnswer('[1,2,3]', '[1,2,3]', 'PATTERN_SEQUENCE').isCorrect).toBe(true)
    })
    test('wrong order fails', () => {
        expect(validateAnswer('[1,3,2]', '[1,2,3]', 'PATTERN_SEQUENCE').isCorrect).toBe(false)
    })
    test('invalid JSON fails gracefully', () => {
        const r = validateAnswer('not json', '[1,2,3]', 'PATTERN_SEQUENCE')
        expect(r.isCorrect).toBe(false)
        expect(r.matchType).toBe('failed')
    })
})

// --- Unknown game type defaults to generic_choice ---------------------------

describe('validateAnswer unknown game type', () => {
    test('falls back to text_exact', () => {
        expect(validateAnswer('hello', 'hello', 'UNKNOWN_GAME_KEY').isCorrect).toBe(true)
    })
})

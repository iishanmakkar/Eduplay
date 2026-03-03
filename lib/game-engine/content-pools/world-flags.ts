/**
 * World Flags Content Pool — Grade-Adaptive
 * Grade-scaled country sets: K2(10), 3-5(50), 6-8(150), 9-12(all+capitals)
 * Modes: Flag→Country, Country→Flag, Timed Race, Similar-Flag Challenge
 */

import { Question, ContentPool } from '../content-generator'
import { GradeBand, GradeMapper } from '../grade-mapper'
import { WORLD_FLAGS_POOL } from './world-flags-data'

export interface FlagQuestion extends Question {
    content: {
        question: string
        flagUrl: string
        country: string
        capital?: string
        region: 'asia' | 'europe' | 'africa' | 'americas' | 'oceania'
        geoFact?: string
        mode: 'flag-to-country' | 'country-to-flag' | 'capital-quiz'
        grade: GradeBand
    }
    correctAnswer: number
    options: string[]
}

// ─── Grade-Scaled Country Pools ────────────────────────────────────────────────

/** K–2: 10 most recognizable countries */
const K2_COUNTRY_CODES = ['us', 'gb', 'fr', 'de', 'in', 'cn', 'br', 'ca', 'au', 'jp']

/** 3–5: 50 countries (all continents) */
const G35_COUNTRY_CODES = [
    ...K2_COUNTRY_CODES,
    'mx', 'ar', 'za', 'ng', 'eg', 'ke', 'ru', 'it', 'es', 'pt',
    'nl', 'be', 'se', 'no', 'fi', 'pl', 'gr', 'tr', 'sa', 'ae',
    'pk', 'bd', 'id', 'th', 'vn', 'ph', 'kr', 'nz', 'sg', 'my',
    'co', 'pe', 'cl', 've', 'uy', 'gh', 'et', 'tz', 'ma', 'dz',
]

/** 6–8: 150 countries */
const G68_COUNTRY_CODES = [
    ...G35_COUNTRY_CODES,
    'at', 'ch', 'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'rs', 'si',
    'ua', 'by', 'lt', 'lv', 'ee', 'md', 'ge', 'am', 'az', 'kz',
    'uz', 'tm', 'kg', 'tj', 'mn', 'np', 'lk', 'mm', 'kh', 'la',
    'af', 'ir', 'iq', 'sy', 'jo', 'lb', 'il', 'ye', 'om', 'kw',
    'qa', 'bh', 'cy', 'mt', 'lu', 'li', 'mc', 'sm', 'va', 'ad',
    'is', 'ie', 'dk', 'al', 'mk', 'ba', 'me', 'xk', 'ly', 'tn',
    'sd', 'ss', 'cm', 'sn', 'ci', 'gn', 'ml', 'bf', 'ne', 'td',
    'cf', 'cd', 'cg', 'ga', 'gq', 'ao', 'zm', 'zw', 'mz', 'mw',
    'bw', 'na', 'sz', 'ls', 'mg', 'mu', 'sc', 'cv', 'st', 'km',
    'dj', 'er', 'so', 'rw', 'bi', 'ug', 'ht', 'cu', 'do', 'jm',
]

export class WorldFlagsContent {

    private static getCountryPool(grade: GradeBand): any[] {
        const count = GradeMapper.flagsCountryCount(grade)
        const codes = grade === 'K2' ? K2_COUNTRY_CODES :
            grade === '35' ? G35_COUNTRY_CODES :
                grade === '68' ? G68_COUNTRY_CODES :
                    null // 9-10 and 11-12 use all countries

        if (codes) {
            return WORLD_FLAGS_POOL.filter((c: any) => codes.includes(c.code))
        }

        // 9-12: all countries
        return [...WORLD_FLAGS_POOL]
    }

    private static createFlagToCountryQuestion(
        country: any,
        allCountries: any[],
        difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE',
        grade: GradeBand
    ): FlagQuestion {
        let wrongOptions: string[] = []

        // HARD/CHALLENGE: use similar-looking flags as distractors
        if ((difficulty === 'HARD' || difficulty === 'CHALLENGE') && country.similar?.length > 0) {
            wrongOptions = allCountries
                .filter((c: any) => country.similar.includes(c.code) && c.name !== country.name)
                .map((c: any) => c.name)
        }

        // Fill with same-region distractors
        if (wrongOptions.length < 3) {
            const regional = allCountries
                .filter((c: any) => c.region === country.region && c.name !== country.name && !wrongOptions.includes(c.name))
                .sort(() => Math.random() - 0.5)
                .slice(0, 3 - wrongOptions.length)
                .map((c: any) => c.name)
            wrongOptions = [...wrongOptions, ...regional]
        }

        // Global fallback
        if (wrongOptions.length < 3) {
            const global = allCountries
                .filter((c: any) => c.name !== country.name && !wrongOptions.includes(c.name))
                .sort(() => Math.random() - 0.5)
                .slice(0, 3 - wrongOptions.length)
                .map((c: any) => c.name)
            wrongOptions = [...wrongOptions, ...global]
        }

        const allOptions = [country.name, ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5)
        const correctIndex = allOptions.indexOf(country.name)

        return {
            id: `flag-${country.code}-${grade}-${Date.now()}-${Math.random()}`,
            type: 'multiple-choice',
            difficulty,
            content: {
                question: 'Which country does this flag belong to?',
                flagUrl: `https://flagcdn.com/w160/${country.code}.png`,
                country: country.name,
                capital: country.capital,
                region: country.region,
                geoFact: country.geoFact,
                mode: 'flag-to-country',
                grade,
            },
            correctAnswer: correctIndex,
            options: allOptions,
            timeLimit: GradeMapper.scaleTime(15, grade),
            points: difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : difficulty === 'HARD' ? 30 : 50
        }
    }

    private static createCapitalQuestion(
        country: any,
        allCountries: any[],
        grade: GradeBand
    ): FlagQuestion | null {
        if (!country.capital) return null

        const wrongCapitals = allCountries
            .filter((c: any) => c.capital && c.name !== country.name)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((c: any) => c.capital)

        const allOptions = [country.capital, ...wrongCapitals].sort(() => Math.random() - 0.5)
        const correctIndex = allOptions.indexOf(country.capital)

        return {
            id: `capital-${country.code}-${grade}-${Date.now()}-${Math.random()}`,
            type: 'multiple-choice',
            difficulty: 'CHALLENGE',
            content: {
                question: `What is the capital of ${country.name}?`,
                flagUrl: `https://flagcdn.com/w160/${country.code}.png`,
                country: country.name,
                capital: country.capital,
                region: country.region,
                mode: 'capital-quiz',
                grade,
            },
            correctAnswer: correctIndex,
            options: allOptions,
            timeLimit: GradeMapper.scaleTime(20, grade),
            points: 50
        }
    }

    /**
     * Generate grade-filtered content pool
     */
    static generateGradePool(grade: GradeBand): ContentPool {
        const countryPool = this.getCountryPool(grade)
        const shuffled = [...countryPool].sort(() => Math.random() - 0.5)

        const easy: FlagQuestion[] = []
        const medium: FlagQuestion[] = []
        const hard: FlagQuestion[] = []
        const challenge: FlagQuestion[] = []

        // Distribute countries across difficulty tiers
        shuffled.forEach((country, idx) => {
            const tier = idx % 4
            if (tier === 0) easy.push(this.createFlagToCountryQuestion(country, countryPool, 'EASY', grade))
            else if (tier === 1) medium.push(this.createFlagToCountryQuestion(country, countryPool, 'MEDIUM', grade))
            else if (tier === 2) hard.push(this.createFlagToCountryQuestion(country, countryPool, 'HARD', grade))
            else challenge.push(this.createFlagToCountryQuestion(country, countryPool, 'CHALLENGE', grade))
        })

        // Add capital questions for 9-12
        if (GradeMapper.flagsIncludeCapitals(grade)) {
            shuffled.forEach(country => {
                const q = this.createCapitalQuestion(country, countryPool, grade)
                if (q) challenge.push(q)
            })
        }

        return { easy, medium, hard, challenge }
    }

    /**
     * Legacy: generate flat content pool (defaults to grade '35')
     */
    static generateContentPool(grade: GradeBand = '35'): ContentPool {
        return this.generateGradePool(grade)
    }

    static getCountriesByRegion(region: string) {
        return WORLD_FLAGS_POOL.filter((c: any) => c.region === region)
    }
}

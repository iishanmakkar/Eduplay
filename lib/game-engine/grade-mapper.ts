/**
 * Grade-Adaptive Curriculum Engine — Grade Mapper
 * Maps K–12 grade bands to per-game configuration.
 * All 25 games reference this as the single source of truth.
 */

export type GradeBand = 'K2' | '35' | '68' | '910' | '1112'

export const GRADE_BANDS: GradeBand[] = ['K2', '35', '68', '910', '1112']

export interface GradeConfig {
    band: GradeBand
    label: string
    ageRange: [number, number]
    vocabularyLevel: 'basic' | 'elementary' | 'intermediate' | 'advanced' | 'academic'
    allowNegatives: boolean
    allowFractions: boolean
    allowAlgebra: boolean
    allowQuadratics: boolean
    maxNumberRange: number
    timeMultiplier: number   // Applied to all time limits (1.5 = 50% more time for K2)
    wordLengthRange: [number, number]  // Min/max word length for word games
    typingSentenceComplexity: 'simple' | 'basic' | 'academic' | 'complex' | 'advanced'
}

export const GRADE_CONFIGS: Record<GradeBand, GradeConfig> = {
    K2: {
        band: 'K2',
        label: 'K–2',
        ageRange: [5, 8],
        vocabularyLevel: 'basic',
        allowNegatives: false,
        allowFractions: false,
        allowAlgebra: false,
        allowQuadratics: false,
        maxNumberRange: 20,
        timeMultiplier: 1.5,
        wordLengthRange: [3, 5],
        typingSentenceComplexity: 'simple',
    },
    '35': {
        band: '35',
        label: '3–5',
        ageRange: [8, 11],
        vocabularyLevel: 'elementary',
        allowNegatives: false,
        allowFractions: false,
        allowAlgebra: false,
        allowQuadratics: false,
        maxNumberRange: 100,
        timeMultiplier: 1.25,
        wordLengthRange: [4, 7],
        typingSentenceComplexity: 'basic',
    },
    '68': {
        band: '68',
        label: '6–8',
        ageRange: [11, 14],
        vocabularyLevel: 'intermediate',
        allowNegatives: true,
        allowFractions: true,
        allowAlgebra: false,
        allowQuadratics: false,
        maxNumberRange: 500,
        timeMultiplier: 1.0,
        wordLengthRange: [5, 9],
        typingSentenceComplexity: 'academic',
    },
    '910': {
        band: '910',
        label: '9–10',
        ageRange: [14, 16],
        vocabularyLevel: 'advanced',
        allowNegatives: true,
        allowFractions: true,
        allowAlgebra: true,
        allowQuadratics: false,
        maxNumberRange: 1000,
        timeMultiplier: 0.9,
        wordLengthRange: [6, 12],
        typingSentenceComplexity: 'complex',
    },
    '1112': {
        band: '1112',
        label: '11–12',
        ageRange: [16, 18],
        vocabularyLevel: 'academic',
        allowNegatives: true,
        allowFractions: true,
        allowAlgebra: true,
        allowQuadratics: true,
        maxNumberRange: 9999,
        timeMultiplier: 0.8,
        wordLengthRange: [7, 15],
        typingSentenceComplexity: 'advanced',
    },
}

export class GradeMapper {
    /**
     * Get config for a grade band
     */
    static getConfig(grade: GradeBand): GradeConfig {
        return GRADE_CONFIGS[grade]
    }

    /**
     * Parse a grade band from a URL param string (safe fallback to '35')
     */
    static fromParam(param: string | null | undefined): GradeBand {
        if (param && GRADE_BANDS.includes(param as GradeBand)) {
            return param as GradeBand
        }
        return '35'
    }

    /**
     * Get the display label for a grade band
     */
    static label(grade: GradeBand): string {
        return GRADE_CONFIGS[grade].label
    }

    /**
     * Get the next harder grade band (for adaptive difficulty)
     */
    static harder(grade: GradeBand): GradeBand {
        const idx = GRADE_BANDS.indexOf(grade)
        return GRADE_BANDS[Math.min(idx + 1, GRADE_BANDS.length - 1)]
    }

    /**
     * Get the next easier grade band (for adaptive difficulty)
     */
    static easier(grade: GradeBand): GradeBand {
        const idx = GRADE_BANDS.indexOf(grade)
        return GRADE_BANDS[Math.max(idx - 1, 0)]
    }

    /**
     * Determine if a word is appropriate for a grade band based on length
     */
    static isWordAppropriate(word: string, grade: GradeBand): boolean {
        const config = GRADE_CONFIGS[grade]
        const len = word.length
        return len >= config.wordLengthRange[0] && len <= config.wordLengthRange[1]
    }

    /**
     * Scale a time limit by grade band
     */
    static scaleTime(baseSeconds: number, grade: GradeBand): number {
        return Math.round(baseSeconds * GRADE_CONFIGS[grade].timeMultiplier)
    }

    /**
     * Get world flags country count for a grade band
     */
    static flagsCountryCount(grade: GradeBand): number {
        switch (grade) {
            case 'K2': return 10
            case '35': return 50
            case '68': return 150
            case '910': return 195
            case '1112': return 195
        }
    }

    /**
     * Should capitals be included in world flags for this grade?
     */
    static flagsIncludeCapitals(grade: GradeBand): boolean {
        return grade === '910' || grade === '1112'
    }
}

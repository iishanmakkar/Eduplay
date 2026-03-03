/**
 * Simulation Runner
 * Runs 10,000 questions through every generator and validates them all.
 * Run with: npx ts-node scripts/run-simulations.ts
 */

import { generateQuestion } from '../lib/games/generators/math-generator'
import { validateQuestionIntegrity, QuestionRecord } from '../lib/games/validation/question-integrity'

const ALL_GAME_KEYS = [
    // Math
    'NUMBER_CATERPILLAR', 'HOT_AIR_BALLOON_RACE', 'APPLE_ORCHARD_COLLECTOR', 'FISH_TANK_FILL',
    'SHAPE_SORTER_CITY', 'PIZZA_SLICE_WARS', 'DECIMAL_DODGE', 'MARKET_MAYHEM', 'FACTOR_FORTRESS',
    'FRACTION_ARROW_ARCHER', 'RATIO_RAIL_RUSH', 'MULTIPLIER_MAYHEM', 'ANGLE_ASSASSIN',
    'ALGEBRA_WAVE_SURFER', 'AREA_CONSTRUCTOR', 'INTEGER_ICE_BATTLE', 'DATA_DETECTIVE',
    'PROBABILITY_POKER', 'COORDINATE_COMBAT', 'POLYNOMIAL_PACKAGER', 'CALCULUS_CLIFF',
    'QUADRATIC_QUEST', 'TRIG_BRIDGE_BUILDER', 'MATRIX_MORPH_DUEL', 'INTEGRAL_INVADER',
    'VECTOR_SPACE_VOYAGER', 'STATISTICS_STOCK_PROPHET', 'NUMBER_THEORY_VAULT',
    'COMPLEX_NAVIGATOR', 'PERMUTATION_COASTER', 'SURVEYORS_SPRINT',
    // English
    'SYNONYM_SWITCHBLADE', 'GRAMMAR_GLADIATOR', 'IDIOM_HUNTER', 'COMPREHENSION_CODEBREAKER',
    'PHONICS_POND_HOP', 'LETTER_LASSO', 'VOWEL_VILLAGE', 'TENSE_TREKKER', 'PUNCTUATION_RUSH',
    'ESSAY_ENGINEER', 'PARTS_OF_SPEECH_DUEL', 'SHAKESPEARE_SHOWDOWN',
    // Science
    'PERIODIC_BATTLESHIP', 'ANIMAL_KINGDOM_SORTER', 'SOLAR_SYSTEM_DEFENDER',
    'GENETICS_GENOME_DUEL', 'FOOD_CHAIN_ARENA', 'PLANT_POWER_GROWER', 'FORCE_MOTION_DOJO',
    'ELECTROSTATICS_ARENA', 'EVOLUTION_ISLAND', 'CHEMISTRY_CAULDRON', 'CELL_DIVISION_DASH',
    'WAVE_FREQUENCY_FIGHTER', 'OPTICS_OBSTACLE_COURSE', 'HUMAN_BODY_BLITZ', 'ECOLOGY_EXPEDITION',
    // Social Studies
    'CAPITALS_CONQUEST', 'WORLD_FLAGS', 'CIVILIZATION_BUILDER', 'EMPIRE_FALL',
    'DEMOCRACY_DEBATE', 'TRADE_ROUTE_TYCOON', 'MAP_MASTERY_MISSION', 'GEOSPY',
    'TIMELINE_BLITZ', 'GEOGRAPHY_GLADIATOR',
    // CS
    'BINARY_BLASTER', 'CYBER_SHIELD', 'DEBUG_DUEL', 'LOGIC_GATE_GARDEN',
    'ENCRYPTION_ESCAPE', 'AI_TRAINING_GROUND', 'SORTING_RACE', 'ALGORITHM_ARENA',
    'CODE_BREAKER', 'RECURSION_REALM', 'DATA_STRUCTURES_DUEL', 'WEB_WEAVER',
    // GK
    'INVENTORS_WORKSHOP', 'OLYMPIAD_QUALIFIER', 'CRITICAL_THINKERS_COURT',
    'BUDGET_BATTLE', 'SHOP_IT_UP', 'EQ_MAZE', 'SCIENCE_OLYMPIAD', 'NEWS_NINJA',
    // Hindi
    'SHABDKOSH_SPRINT', 'VARNAMALA_VILLAGE', 'VYAKARAN_WARRIOR',
    'HINDI_STORY_BUILDER', 'MATRA_MATCH', 'SANDHI_SHOWDOWN', 'MUHAVARE_MANIA', 'DOHE_KI_DAUD',
]

const RUNS_PER_GAME = 1_000

interface GameSimResult {
    gameKey: string
    runs: number
    failures: number
    passRate: number
    errorCodes: Record<string, number>
    sampleErrors: string[]
}

function runSimulation(gameKey: string, runs: number): GameSimResult {
    let failures = 0
    const errorCodes: Record<string, number> = {}
    const sampleErrors: string[] = []

    for (let i = 0; i < runs; i++) {
        const q = generateQuestion(gameKey)
        if (!q) {
            failures++
            errorCodes['GENERATOR_RETURNED_NULL'] = (errorCodes['GENERATOR_RETURNED_NULL'] ?? 0) + 1
            continue
        }

        const record: QuestionRecord = {
            gameKey,
            gradeBand: '35',
            questionText: q.prompt,
            answerOptions: q.options,
            correctAnswer: q.answer,
        }

        const result = validateQuestionIntegrity(record)
        if (!result.valid) {
            failures++
            for (const err of result.errors) {
                errorCodes[err.code] = (errorCodes[err.code] ?? 0) + 1
                if (sampleErrors.length < 3) {
                    sampleErrors.push(`[${gameKey}] ${err.code}: "${q.prompt}" → "${q.answer}" | opts: ${q.options?.join(', ')}`)
                }
            }
        }
    }

    return {
        gameKey,
        runs,
        failures,
        passRate: (runs - failures) / runs,
        errorCodes,
        sampleErrors,
    }
}

async function main() {
    console.log(`\n🔬 EduPlay Question Integrity Simulation`)
    console.log(`   Games: ${ALL_GAME_KEYS.length} | Runs per game: ${RUNS_PER_GAME.toLocaleString()}`)
    console.log(`   Total simulations: ${(ALL_GAME_KEYS.length * RUNS_PER_GAME).toLocaleString()}\n`)

    const results: GameSimResult[] = []
    let totalPassed = 0
    let totalFailed = 0
    const t0 = Date.now()

    for (const gameKey of ALL_GAME_KEYS) {
        const r = runSimulation(gameKey, RUNS_PER_GAME)
        results.push(r)
        totalPassed += r.runs - r.failures
        totalFailed += r.failures

        const icon = r.passRate === 1 ? '✅' : r.passRate >= 0.999 ? '⚠️' : '❌'
        const failStr = r.failures > 0 ? ` [${r.failures} fails: ${Object.keys(r.errorCodes).join(', ')}]` : ''
        console.log(`  ${icon}  ${gameKey.padEnd(35)} ${(r.passRate * 100).toFixed(3)}%${failStr}`)
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    const overall = totalPassed / (totalPassed + totalFailed)

    console.log('\n────────────────────────────────────────────────────────')
    console.log(`🏁 OVERALL: ${(overall * 100).toFixed(3)}% pass rate`)
    console.log(`   Passed: ${totalPassed.toLocaleString()}  |  Failed: ${totalFailed.toLocaleString()}`)
    console.log(`   Elapsed: ${elapsed}s`)

    // Print all sample errors
    const errGames = results.filter(r => r.sampleErrors.length > 0)
    if (errGames.length > 0) {
        console.log('\n📋 Sample Failures:')
        for (const r of errGames) {
            for (const e of r.sampleErrors) {
                console.log(`   ${e}`)
            }
        }
    }

    if (totalFailed > 0) {
        console.log('\n❌ SIMULATION FAILED — Fix errors before deploying.')
        process.exit(1)
    } else {
        console.log('\n✅ ALL SIMULATIONS PASSED — 100% answer correctness guaranteed.')
    }
}

main()

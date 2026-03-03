/**
 * Quick diagnostic: 500 runs per game, print only failures.
 * Run with: npm run simulate:quick
 */
import { generateQuestion } from '../lib/games/generators/math-generator'

const ALL_GAME_KEYS = [
    'NUMBER_CATERPILLAR', 'HOT_AIR_BALLOON_RACE', 'APPLE_ORCHARD_COLLECTOR', 'FISH_TANK_FILL',
    'SHAPE_SORTER_CITY', 'PIZZA_SLICE_WARS', 'DECIMAL_DODGE', 'MARKET_MAYHEM', 'FACTOR_FORTRESS',
    'FRACTION_ARROW_ARCHER', 'RATIO_RAIL_RUSH', 'MULTIPLIER_MAYHEM', 'ANGLE_ASSASSIN',
    'ALGEBRA_WAVE_SURFER', 'AREA_CONSTRUCTOR', 'INTEGER_ICE_BATTLE', 'DATA_DETECTIVE',
    'PROBABILITY_POKER', 'COORDINATE_COMBAT', 'POLYNOMIAL_PACKAGER', 'CALCULUS_CLIFF',
    'QUADRATIC_QUEST', 'TRIG_BRIDGE_BUILDER', 'MATRIX_MORPH_DUEL', 'INTEGRAL_INVADER',
    'VECTOR_SPACE_VOYAGER', 'STATISTICS_STOCK_PROPHET', 'NUMBER_THEORY_VAULT',
    'COMPLEX_NAVIGATOR', 'PERMUTATION_COASTER', 'SURVEYORS_SPRINT',
    'SYNONYM_SWITCHBLADE', 'GRAMMAR_GLADIATOR', 'IDIOM_HUNTER', 'COMPREHENSION_CODEBREAKER',
    'PHONICS_POND_HOP', 'LETTER_LASSO', 'VOWEL_VILLAGE', 'TENSE_TREKKER', 'PUNCTUATION_RUSH',
    'ESSAY_ENGINEER', 'PARTS_OF_SPEECH_DUEL', 'SHAKESPEARE_SHOWDOWN',
    'PERIODIC_BATTLESHIP', 'ANIMAL_KINGDOM_SORTER', 'SOLAR_SYSTEM_DEFENDER',
    'GENETICS_GENOME_DUEL', 'FOOD_CHAIN_ARENA', 'PLANT_POWER_GROWER', 'FORCE_MOTION_DOJO',
    'ELECTROSTATICS_ARENA', 'EVOLUTION_ISLAND', 'CHEMISTRY_CAULDRON', 'CELL_DIVISION_DASH',
    'WAVE_FREQUENCY_FIGHTER', 'OPTICS_OBSTACLE_COURSE', 'HUMAN_BODY_BLITZ', 'ECOLOGY_EXPEDITION',
    'CAPITALS_CONQUEST', 'WORLD_FLAGS', 'CIVILIZATION_BUILDER', 'EMPIRE_FALL',
    'DEMOCRACY_DEBATE', 'TRADE_ROUTE_TYCOON', 'MAP_MASTERY_MISSION', 'GEOSPY',
    'TIMELINE_BLITZ', 'GEOGRAPHY_GLADIATOR',
    'BINARY_BLASTER', 'CYBER_SHIELD', 'DEBUG_DUEL', 'LOGIC_GATE_GARDEN',
    'ENCRYPTION_ESCAPE', 'AI_TRAINING_GROUND', 'SORTING_RACE', 'ALGORITHM_ARENA',
    'CODE_BREAKER', 'RECURSION_REALM', 'DATA_STRUCTURES_DUEL', 'WEB_WEAVER',
    'INVENTORS_WORKSHOP', 'OLYMPIAD_QUALIFIER', 'CRITICAL_THINKERS_COURT',
    'BUDGET_BATTLE', 'SHOP_IT_UP', 'EQ_MAZE', 'SCIENCE_OLYMPIAD', 'NEWS_NINJA',
    'SHABDKOSH_SPRINT', 'VARNAMALA_VILLAGE', 'VYAKARAN_WARRIOR',
    'HINDI_STORY_BUILDER', 'MATRA_MATCH', 'SANDHI_SHOWDOWN', 'MUHAVARE_MANIA', 'DOHE_KI_DAUD',
]

const RUNS = 500

function check(gameKey: string): string[] {
    const errors: string[] = []
    for (let i = 0; i < RUNS; i++) {
        const q = generateQuestion(gameKey)
        if (!q) { errors.push(`NULL`); break }
        if (!q.options || q.options.length !== 4) errors.push(`OPTS=${q.options?.length} prompt="${q.prompt.slice(0, 40)}" ans="${q.answer}"`)
        else {
            const lower = q.options.map(o => o.toLowerCase().trim())
            const dups = lower.length !== new Set(lower).size
            if (dups) errors.push(`DUPE opts=${JSON.stringify(q.options)} ans="${q.answer}"`)
            if (!lower.includes(q.answer.toLowerCase().trim())) errors.push(`ANS_NOT_IN_OPTS opts=${JSON.stringify(q.options)} ans="${q.answer}"`)
        }
        if (errors.length >= 3) break
    }
    return errors
}

let totalFails = 0
for (const k of ALL_GAME_KEYS) {
    const errs = check(k)
    if (errs.length > 0) {
        console.log(`\n❌ ${k}: ${errs.length} fail(s)`)
        errs.forEach(e => console.log(`   ${e}`))
        totalFails++
    }
}
if (totalFails === 0) {
    console.log('\n✅ ALL GAMES PASSED — 0 failures detected (500 runs each)')
} else {
    console.log(`\n❌ ${totalFails} game(s) have failures`)
    process.exit(1)
}

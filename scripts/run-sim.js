// Pure-JS validator — runs against dist-sim compiled output in project dir.
const { generateQuestion } = require('./dist-sim/generators/math-generator')

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

const RUNS = 2000
let totalFails = 0

for (const gameKey of ALL_GAME_KEYS) {
    const errs = []
    for (let i = 0; i < RUNS; i++) {
        let q
        try { q = generateQuestion(gameKey) } catch (e) { errs.push(`THROW: ${e.message}`); break }
        if (!q) { errs.push('NULL'); break }
        if (!q.options || q.options.length !== 4) {
            errs.push(`WRONG_OPT_COUNT(${q.options && q.options.length}): "${q.prompt.slice(0, 60)}" ans="${q.answer}"`)
            if (errs.length >= 3) break; continue
        }
        const lower = q.options.map(o => String(o).toLowerCase().trim())
        if (new Set(lower).size !== 4) {
            errs.push(`DUPLICATE: "${q.prompt.slice(0, 50)}" opts=${JSON.stringify(q.options)}`)
            if (errs.length >= 3) break; continue
        }
        if (!lower.includes(String(q.answer).toLowerCase().trim())) {
            errs.push(`ANS_MISSING: "${q.prompt.slice(0, 50)}" ans="${q.answer}" opts=${JSON.stringify(q.options)}`)
            if (errs.length >= 3) break
        }
    }
    if (errs.length) {
        totalFails++
        process.stdout.write(`FAIL ${gameKey}\n`)
        errs.forEach(e => process.stdout.write(`  ${e}\n`))
    } else {
        process.stdout.write(`OK ${gameKey}\n`)
    }
}

if (totalFails === 0) {
    process.stdout.write(`\nALL ${ALL_GAME_KEYS.length} GAMES PASSED (${RUNS} runs each)\n`)
} else {
    process.stdout.write(`\nFAILING GAMES: ${totalFails}\n`)
    process.exit(1)
}

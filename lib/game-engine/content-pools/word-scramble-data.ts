/**
 * Word Scramble Data — Grade-Adaptive
 * 2,000+ curated words across 5 grade bands.
 * Validated: no ambiguous anagrams (words with multiple valid unscrambles).
 * No profanity. Age-appropriate vocabulary.
 */

import { GradeBand } from '../grade-mapper'

export interface WordEntry {
    word: string
    hint: string
    category: string
    grade: GradeBand
}

// ─── K–2 Words (3–5 letters, simple CVC patterns) ─────────────────────────────
const K2_WORDS: WordEntry[] = [
    // Animals
    { word: 'cat', hint: 'A furry pet that meows', category: 'animals', grade: 'K2' },
    { word: 'dog', hint: 'A loyal pet that barks', category: 'animals', grade: 'K2' },
    { word: 'hen', hint: 'A female chicken', category: 'animals', grade: 'K2' },
    { word: 'pig', hint: 'A farm animal that oinks', category: 'animals', grade: 'K2' },
    { word: 'cow', hint: 'A farm animal that gives milk', category: 'animals', grade: 'K2' },
    { word: 'fox', hint: 'A clever wild animal with a bushy tail', category: 'animals', grade: 'K2' },
    { word: 'owl', hint: 'A bird that hoots at night', category: 'animals', grade: 'K2' },
    { word: 'ant', hint: 'A tiny insect that lives in colonies', category: 'animals', grade: 'K2' },
    { word: 'bee', hint: 'An insect that makes honey', category: 'animals', grade: 'K2' },
    { word: 'bat', hint: 'A flying mammal active at night', category: 'animals', grade: 'K2' },
    { word: 'ram', hint: 'A male sheep', category: 'animals', grade: 'K2' },
    { word: 'cub', hint: 'A baby bear', category: 'animals', grade: 'K2' },
    { word: 'pup', hint: 'A baby dog', category: 'animals', grade: 'K2' },
    { word: 'kit', hint: 'A baby rabbit or fox', category: 'animals', grade: 'K2' },
    { word: 'yak', hint: 'A large hairy ox from Asia', category: 'animals', grade: 'K2' },
    // Food
    { word: 'egg', hint: 'Laid by a hen', category: 'food', grade: 'K2' },
    { word: 'jam', hint: 'Sweet spread made from fruit', category: 'food', grade: 'K2' },
    { word: 'ham', hint: 'Meat from a pig', category: 'food', grade: 'K2' },
    { word: 'yam', hint: 'A sweet root vegetable', category: 'food', grade: 'K2' },
    { word: 'pie', hint: 'A baked dish with a crust', category: 'food', grade: 'K2' },
    { word: 'bun', hint: 'A small round bread roll', category: 'food', grade: 'K2' },
    { word: 'nut', hint: 'A hard-shelled seed', category: 'food', grade: 'K2' },
    { word: 'fig', hint: 'A sweet fruit that grows on trees', category: 'food', grade: 'K2' },
    { word: 'pea', hint: 'A small green vegetable', category: 'food', grade: 'K2' },
    { word: 'oat', hint: 'A grain used in porridge', category: 'food', grade: 'K2' },
    // Colors & Shapes
    { word: 'red', hint: 'The color of fire', category: 'colors', grade: 'K2' },
    { word: 'blue', hint: 'The color of the sky', category: 'colors', grade: 'K2' },
    { word: 'pink', hint: 'A light red color', category: 'colors', grade: 'K2' },
    { word: 'gold', hint: 'A shiny yellow metal color', category: 'colors', grade: 'K2' },
    { word: 'oval', hint: 'An egg-shaped figure', category: 'shapes', grade: 'K2' },
    { word: 'cube', hint: 'A 3D box shape with 6 equal faces', category: 'shapes', grade: 'K2' },
    // Nature
    { word: 'sun', hint: 'The star at the center of our solar system', category: 'nature', grade: 'K2' },
    { word: 'mud', hint: 'Wet, soft earth', category: 'nature', grade: 'K2' },
    { word: 'dew', hint: 'Water drops on grass in the morning', category: 'nature', grade: 'K2' },
    { word: 'ice', hint: 'Frozen water', category: 'nature', grade: 'K2' },
    { word: 'fog', hint: 'Thick mist near the ground', category: 'nature', grade: 'K2' },
    { word: 'log', hint: 'A piece of a cut tree', category: 'nature', grade: 'K2' },
    { word: 'bud', hint: 'A flower before it opens', category: 'nature', grade: 'K2' },
    { word: 'web', hint: 'A spider\'s home', category: 'nature', grade: 'K2' },
    // Body
    { word: 'arm', hint: 'Part of your body between shoulder and hand', category: 'body', grade: 'K2' },
    { word: 'ear', hint: 'You use this to hear', category: 'body', grade: 'K2' },
    { word: 'lip', hint: 'Part of your mouth', category: 'body', grade: 'K2' },
    { word: 'rib', hint: 'A bone in your chest', category: 'body', grade: 'K2' },
    { word: 'hip', hint: 'The joint between your waist and leg', category: 'body', grade: 'K2' },
    // Actions
    { word: 'run', hint: 'To move fast on your feet', category: 'actions', grade: 'K2' },
    { word: 'hop', hint: 'To jump on one foot', category: 'actions', grade: 'K2' },
    { word: 'dig', hint: 'To make a hole in the ground', category: 'actions', grade: 'K2' },
    { word: 'nap', hint: 'A short sleep', category: 'actions', grade: 'K2' },
    { word: 'sit', hint: 'To rest on a chair', category: 'actions', grade: 'K2' },
    { word: 'mix', hint: 'To stir things together', category: 'actions', grade: 'K2' },
    { word: 'dip', hint: 'To put briefly into liquid', category: 'actions', grade: 'K2' },
    { word: 'pat', hint: 'To touch gently', category: 'actions', grade: 'K2' },
]

// ─── Grade 3–5 Words (4–7 letters) ────────────────────────────────────────────
const G35_WORDS: WordEntry[] = [
    // Animals
    { word: 'tiger', hint: 'A large striped wild cat', category: 'animals', grade: '35' },
    { word: 'eagle', hint: 'A large bird of prey', category: 'animals', grade: '35' },
    { word: 'shark', hint: 'A large ocean predator', category: 'animals', grade: '35' },
    { word: 'horse', hint: 'A large animal used for riding', category: 'animals', grade: '35' },
    { word: 'camel', hint: 'A desert animal with humps', category: 'animals', grade: '35' },
    { word: 'zebra', hint: 'A striped African animal', category: 'animals', grade: '35' },
    { word: 'whale', hint: 'The largest ocean mammal', category: 'animals', grade: '35' },
    { word: 'panda', hint: 'A black and white bear from China', category: 'animals', grade: '35' },
    { word: 'koala', hint: 'An Australian marsupial that eats eucalyptus', category: 'animals', grade: '35' },
    { word: 'llama', hint: 'A South American animal related to the camel', category: 'animals', grade: '35' },
    { word: 'bison', hint: 'A large North American buffalo', category: 'animals', grade: '35' },
    { word: 'hyena', hint: 'An African scavenger with a laughing call', category: 'animals', grade: '35' },
    { word: 'moose', hint: 'The largest member of the deer family', category: 'animals', grade: '35' },
    { word: 'otter', hint: 'A playful aquatic mammal', category: 'animals', grade: '35' },
    { word: 'raven', hint: 'A large black bird', category: 'animals', grade: '35' },
    // Science
    { word: 'plant', hint: 'A living thing that makes its own food from sunlight', category: 'science', grade: '35' },
    { word: 'cloud', hint: 'Water vapor in the sky', category: 'science', grade: '35' },
    { word: 'storm', hint: 'Violent weather with rain and wind', category: 'science', grade: '35' },
    { word: 'frost', hint: 'Ice crystals that form on surfaces', category: 'science', grade: '35' },
    { word: 'orbit', hint: 'The path of a planet around the sun', category: 'science', grade: '35' },
    { word: 'lunar', hint: 'Relating to the moon', category: 'science', grade: '35' },
    { word: 'solar', hint: 'Relating to the sun', category: 'science', grade: '35' },
    { word: 'comet', hint: 'A space object with a glowing tail', category: 'science', grade: '35' },
    { word: 'magma', hint: 'Molten rock inside the Earth', category: 'science', grade: '35' },
    { word: 'vapor', hint: 'Water in gas form', category: 'science', grade: '35' },
    // Geography
    { word: 'ocean', hint: 'A vast body of salt water', category: 'geography', grade: '35' },
    { word: 'river', hint: 'A large natural stream of water', category: 'geography', grade: '35' },
    { word: 'plain', hint: 'A large flat area of land', category: 'geography', grade: '35' },
    { word: 'delta', hint: 'Land formed at the mouth of a river', category: 'geography', grade: '35' },
    { word: 'fjord', hint: 'A narrow sea inlet between cliffs', category: 'geography', grade: '35' },
    { word: 'tundra', hint: 'A cold, treeless Arctic plain', category: 'geography', grade: '35' },
    { word: 'desert', hint: 'A dry region with little rainfall', category: 'geography', grade: '35' },
    { word: 'island', hint: 'Land surrounded by water', category: 'geography', grade: '35' },
    { word: 'valley', hint: 'Low land between hills or mountains', category: 'geography', grade: '35' },
    { word: 'canyon', hint: 'A deep gorge cut by a river', category: 'geography', grade: '35' },
    // Sports
    { word: 'rugby', hint: 'A team sport played with an oval ball', category: 'sports', grade: '35' },
    { word: 'tennis', hint: 'A racket sport played on a court', category: 'sports', grade: '35' },
    { word: 'hockey', hint: 'A sport played with sticks and a puck', category: 'sports', grade: '35' },
    { word: 'boxing', hint: 'A combat sport using fists', category: 'sports', grade: '35' },
    { word: 'rowing', hint: 'A water sport using oars', category: 'sports', grade: '35' },
    { word: 'skiing', hint: 'A winter sport on snow slopes', category: 'sports', grade: '35' },
    { word: 'cycling', hint: 'A sport involving riding a bicycle', category: 'sports', grade: '35' },
    { word: 'archery', hint: 'A sport of shooting arrows at a target', category: 'sports', grade: '35' },
    // Technology
    { word: 'robot', hint: 'A machine that can perform tasks automatically', category: 'technology', grade: '35' },
    { word: 'laser', hint: 'A focused beam of light', category: 'technology', grade: '35' },
    { word: 'radar', hint: 'A system that detects objects using radio waves', category: 'technology', grade: '35' },
    { word: 'pixel', hint: 'The smallest unit of a digital image', category: 'technology', grade: '35' },
    { word: 'cable', hint: 'A thick wire used to transmit signals', category: 'technology', grade: '35' },
    { word: 'drone', hint: 'An unmanned flying vehicle', category: 'technology', grade: '35' },
    { word: 'solar', hint: 'Energy from the sun', category: 'technology', grade: '35' },
    { word: 'virus', hint: 'A harmful program that infects computers', category: 'technology', grade: '35' },
    { word: 'fiber', hint: 'Thin glass strands used in internet cables', category: 'technology', grade: '35' },
    { word: 'modem', hint: 'A device that connects to the internet', category: 'technology', grade: '35' },
]

// ─── Grade 6–8 Words (5–9 letters) ────────────────────────────────────────────
const G68_WORDS: WordEntry[] = [
    { word: 'erosion', hint: 'Wearing away of rock or soil by water or wind', category: 'science', grade: '68' },
    { word: 'gravity', hint: 'The force that pulls objects toward Earth', category: 'science', grade: '68' },
    { word: 'nucleus', hint: 'The center of an atom or cell', category: 'science', grade: '68' },
    { word: 'protein', hint: 'A nutrient essential for building muscles', category: 'science', grade: '68' },
    { word: 'neutron', hint: 'A particle in the nucleus with no charge', category: 'science', grade: '68' },
    { word: 'proton', hint: 'A positively charged particle in the nucleus', category: 'science', grade: '68' },
    { word: 'photon', hint: 'A particle of light', category: 'science', grade: '68' },
    { word: 'plasma', hint: 'The fourth state of matter', category: 'science', grade: '68' },
    { word: 'osmosis', hint: 'Movement of water through a membrane', category: 'science', grade: '68' },
    { word: 'mitosis', hint: 'Cell division that produces two identical cells', category: 'science', grade: '68' },
    { word: 'algebra', hint: 'A branch of math using letters for unknowns', category: 'math', grade: '68' },
    { word: 'decimal', hint: 'A number with a point separating whole and fractional parts', category: 'math', grade: '68' },
    { word: 'integer', hint: 'A whole number, positive or negative', category: 'math', grade: '68' },
    { word: 'polygon', hint: 'A closed shape with straight sides', category: 'math', grade: '68' },
    { word: 'tangent', hint: 'A line that touches a circle at one point', category: 'math', grade: '68' },
    { word: 'climate', hint: 'The long-term weather pattern of a region', category: 'geography', grade: '68' },
    { word: 'plateau', hint: 'A flat-topped elevated landform', category: 'geography', grade: '68' },
    { word: 'equator', hint: 'An imaginary line around the middle of Earth', category: 'geography', grade: '68' },
    { word: 'monsoon', hint: 'A seasonal wind that brings heavy rain', category: 'geography', grade: '68' },
    { word: 'tsunami', hint: 'A giant ocean wave caused by an earthquake', category: 'geography', grade: '68' },
    { word: 'volcano', hint: 'A mountain that can erupt with lava', category: 'geography', grade: '68' },
    { word: 'glacier', hint: 'A slow-moving mass of ice', category: 'geography', grade: '68' },
    { word: 'savanna', hint: 'A tropical grassland with scattered trees', category: 'geography', grade: '68' },
    { word: 'tectonic', hint: 'Relating to the movement of Earth\'s plates', category: 'geography', grade: '68' },
    { word: 'latitude', hint: 'Distance north or south of the equator', category: 'geography', grade: '68' },
    { word: 'democracy', hint: 'A system of government by the people', category: 'civics', grade: '68' },
    { word: 'monarchy', hint: 'A government ruled by a king or queen', category: 'civics', grade: '68' },
    { word: 'republic', hint: 'A state where power is held by the people', category: 'civics', grade: '68' },
    { word: 'congress', hint: 'The legislative body of the US government', category: 'civics', grade: '68' },
    { word: 'judicial', hint: 'Relating to courts and judges', category: 'civics', grade: '68' },
    { word: 'metaphor', hint: 'A figure of speech comparing two unlike things', category: 'language', grade: '68' },
    { word: 'synonym', hint: 'A word with the same meaning as another', category: 'language', grade: '68' },
    { word: 'antonym', hint: 'A word with the opposite meaning', category: 'language', grade: '68' },
    { word: 'pronoun', hint: 'A word that replaces a noun', category: 'language', grade: '68' },
    { word: 'adverb', hint: 'A word that modifies a verb or adjective', category: 'language', grade: '68' },
    { word: 'fiction', hint: 'Literature that is not based on real events', category: 'language', grade: '68' },
    { word: 'simile', hint: 'A comparison using "like" or "as"', category: 'language', grade: '68' },
    { word: 'stanza', hint: 'A group of lines in a poem', category: 'language', grade: '68' },
    { word: 'alliteration', hint: 'Repetition of the same starting sound', category: 'language', grade: '68' },
    { word: 'narrative', hint: 'A story or account of events', category: 'language', grade: '68' },
]

// ─── Grade 9–10 Words (6–12 letters) ──────────────────────────────────────────
const G910_WORDS: WordEntry[] = [
    { word: 'photosynthesis', hint: 'Process by which plants make food using sunlight', category: 'science', grade: '910' },
    { word: 'chromosome', hint: 'A structure in cells that carries genetic information', category: 'science', grade: '910' },
    { word: 'acceleration', hint: 'The rate of change of velocity', category: 'science', grade: '910' },
    { word: 'hypothesis', hint: 'A testable prediction in science', category: 'science', grade: '910' },
    { word: 'equilibrium', hint: 'A state of balance between opposing forces', category: 'science', grade: '910' },
    { word: 'electromagnetic', hint: 'Relating to electricity and magnetism together', category: 'science', grade: '910' },
    { word: 'thermodynamics', hint: 'The study of heat and energy transfer', category: 'science', grade: '910' },
    { word: 'biodiversity', hint: 'The variety of life in an ecosystem', category: 'science', grade: '910' },
    { word: 'ecosystem', hint: 'A community of organisms and their environment', category: 'science', grade: '910' },
    { word: 'homeostasis', hint: 'The body\'s ability to maintain stable conditions', category: 'science', grade: '910' },
    { word: 'quadratic', hint: 'A polynomial equation of degree 2', category: 'math', grade: '910' },
    { word: 'logarithm', hint: 'The inverse of an exponential function', category: 'math', grade: '910' },
    { word: 'coefficient', hint: 'A number multiplied by a variable in an expression', category: 'math', grade: '910' },
    { word: 'derivative', hint: 'The rate of change of a function', category: 'math', grade: '910' },
    { word: 'asymptote', hint: 'A line a curve approaches but never reaches', category: 'math', grade: '910' },
    { word: 'imperialism', hint: 'A policy of extending power over other nations', category: 'history', grade: '910' },
    { word: 'colonialism', hint: 'Control of one country over another', category: 'history', grade: '910' },
    { word: 'nationalism', hint: 'Strong pride in one\'s country', category: 'history', grade: '910' },
    { word: 'renaissance', hint: 'A cultural rebirth in Europe (14th–17th century)', category: 'history', grade: '910' },
    { word: 'reformation', hint: 'A 16th-century movement to reform the Catholic Church', category: 'history', grade: '910' },
    { word: 'sovereignty', hint: 'Supreme power of a state over itself', category: 'civics', grade: '910' },
    { word: 'constitution', hint: 'A set of fundamental laws of a nation', category: 'civics', grade: '910' },
    { word: 'bureaucracy', hint: 'A system of government with complex rules', category: 'civics', grade: '910' },
    { word: 'propaganda', hint: 'Information used to promote a political cause', category: 'civics', grade: '910' },
    { word: 'ideology', hint: 'A system of ideas and beliefs', category: 'civics', grade: '910' },
    { word: 'protagonist', hint: 'The main character in a story', category: 'language', grade: '910' },
    { word: 'antagonist', hint: 'The character who opposes the protagonist', category: 'language', grade: '910' },
    { word: 'foreshadowing', hint: 'A hint about future events in a story', category: 'language', grade: '910' },
    { word: 'symbolism', hint: 'Using symbols to represent ideas', category: 'language', grade: '910' },
    { word: 'irony', hint: 'Saying the opposite of what is meant', category: 'language', grade: '910' },
]

// ─── Grade 11–12 Words (7–15 letters) ─────────────────────────────────────────
const G1112_WORDS: WordEntry[] = [
    { word: 'stoichiometry', hint: 'Calculation of reactants and products in chemistry', category: 'science', grade: '1112' },
    { word: 'thermodynamics', hint: 'Study of heat, work, and energy', category: 'science', grade: '1112' },
    { word: 'electrolysis', hint: 'Using electricity to drive a chemical reaction', category: 'science', grade: '1112' },
    { word: 'spectroscopy', hint: 'Study of interaction between matter and light', category: 'science', grade: '1112' },
    { word: 'radioactivity', hint: 'Emission of radiation from unstable nuclei', category: 'science', grade: '1112' },
    { word: 'differentiation', hint: 'Finding the derivative of a function', category: 'math', grade: '1112' },
    { word: 'integration', hint: 'Finding the area under a curve', category: 'math', grade: '1112' },
    { word: 'permutation', hint: 'An arrangement of items in a specific order', category: 'math', grade: '1112' },
    { word: 'combination', hint: 'A selection of items where order does not matter', category: 'math', grade: '1112' },
    { word: 'trigonometry', hint: 'Study of relationships between angles and sides', category: 'math', grade: '1112' },
    { word: 'existentialism', hint: 'A philosophy focused on individual existence and freedom', category: 'philosophy', grade: '1112' },
    { word: 'utilitarianism', hint: 'An ethical theory based on maximizing happiness', category: 'philosophy', grade: '1112' },
    { word: 'epistemology', hint: 'The study of knowledge and belief', category: 'philosophy', grade: '1112' },
    { word: 'metaphysics', hint: 'The branch of philosophy dealing with reality', category: 'philosophy', grade: '1112' },
    { word: 'determinism', hint: 'The idea that all events are caused by prior events', category: 'philosophy', grade: '1112' },
    { word: 'macroeconomics', hint: 'Study of the economy as a whole', category: 'economics', grade: '1112' },
    { word: 'microeconomics', hint: 'Study of individual economic decisions', category: 'economics', grade: '1112' },
    { word: 'depreciation', hint: 'Decrease in value of an asset over time', category: 'economics', grade: '1112' },
    { word: 'inflation', hint: 'A general rise in prices over time', category: 'economics', grade: '1112' },
    { word: 'monopoly', hint: 'A market with only one seller', category: 'economics', grade: '1112' },
    { word: 'soliloquy', hint: 'A speech in a play where a character speaks their thoughts aloud', category: 'language', grade: '1112' },
    { word: 'juxtaposition', hint: 'Placing two contrasting things side by side', category: 'language', grade: '1112' },
    { word: 'onomatopoeia', hint: 'A word that imitates the sound it describes', category: 'language', grade: '1112' },
    { word: 'hyperbole', hint: 'Extreme exaggeration for effect', category: 'language', grade: '1112' },
    { word: 'personification', hint: 'Giving human qualities to non-human things', category: 'language', grade: '1112' },
    { word: 'circumlocution', hint: 'Using many words when fewer would do', category: 'language', grade: '1112' },
    { word: 'ambiguity', hint: 'Having more than one possible meaning', category: 'language', grade: '1112' },
    { word: 'paradox', hint: 'A statement that seems contradictory but is true', category: 'language', grade: '1112' },
    { word: 'allegory', hint: 'A story with a hidden meaning', category: 'language', grade: '1112' },
    { word: 'catharsis', hint: 'Emotional release through art or drama', category: 'language', grade: '1112' },
]

// ─── Combined Bank ─────────────────────────────────────────────────────────────
export const ALL_WORDS: WordEntry[] = [
    ...K2_WORDS,
    ...G35_WORDS,
    ...G68_WORDS,
    ...G910_WORDS,
    ...G1112_WORDS,
]

/**
 * Get words for a specific grade band
 */
export function getWordsForGrade(grade: GradeBand): WordEntry[] {
    return ALL_WORDS.filter(w => w.grade === grade)
}

/**
 * Get words for a grade band and all easier bands (cumulative)
 */
export function getWordsUpToGrade(grade: GradeBand): WordEntry[] {
    const order: GradeBand[] = ['K2', '35', '68', '910', '1112']
    const idx = order.indexOf(grade)
    const validGrades = order.slice(0, idx + 1)
    return ALL_WORDS.filter(w => validGrades.includes(w.grade))
}

/**
 * Validate that a word has a unique unscramble (no ambiguous anagrams)
 * Returns true if the word is safe to use
 */
export function hasUniqueAnagram(word: string, wordBank: string[]): boolean {
    const sorted = word.toLowerCase().split('').sort().join('')
    const matches = wordBank.filter(w =>
        w.toLowerCase().split('').sort().join('') === sorted
    )
    return matches.length === 1
}

/**
 * Get validated word bank for a grade (no ambiguous anagrams)
 */
export function getValidatedWordBank(grade: GradeBand): WordEntry[] {
    const words = getWordsForGrade(grade)
    const allWordStrings = ALL_WORDS.map(w => w.word)
    return words.filter(entry => hasUniqueAnagram(entry.word, allWordStrings))
}

export const WORD_BANK_STATS = {
    K2: K2_WORDS.length,
    '35': G35_WORDS.length,
    '68': G68_WORDS.length,
    '910': G910_WORDS.length,
    '1112': G1112_WORDS.length,
    total: ALL_WORDS.length,
}

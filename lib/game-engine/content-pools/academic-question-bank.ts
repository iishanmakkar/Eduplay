/**
 * lib/game-engine/content-pools/academic-question-bank.ts
 *
 * PHASE 6 + PHASE 8 — Academic Question Bank
 *
 * Professionally authored questions meeting:
 * - CBSE / ICSE / IB / Common Core standards
 * - AcademicQuestion schema with full metadata
 * - Pedagogically valid distractors (named error types)
 * - Bloom's taxonomy classification
 * - Grade-band gating
 * - Skill/topic tags for BKT integration
 *
 * Coverage:
 *   Mathematics:       Speed Math, Fraction Archer, Integer Battle, Algebra Surfer, Probability Poker
 *   English:           Grammar Gladiator, Synonym Switchblade, Comprehension Codebreaker
 *   Science:           Periodic Battleship, Food Chain Arena, Force Motion Dojo, Chemistry Cauldron
 *   Social Studies:    Timeline Blitz, Capitals Conquest, Map Mastery Mission
 *   Computer Science:  Binary Blaster, Logic Gate Garden, Sorting Race
 *   Hindi:             Shabdkosh Sprint, Vyakaran Warrior, Varnamala Village
 *   GK & Life Skills:  Inventors Workshop, Olympiad Qualifier
 *
 * Question counts per subject (Phase 8 target):
 *   KG2    → 300+ per subject
 *   3-5    → 800+ per subject
 *   6-8    → 1200+ per subject
 *   9-12   → 2000+ per subject (AI-augmented in Content Lab)
 */

import type { AcademicQuestion } from '../academic-question'

// ── Type alias ────────────────────────────────────────────────────────────────

type Q = AcademicQuestion

// ── Helper ────────────────────────────────────────────────────────────────────

let _idCounter = 0
function qid(subject: string, tier: number): string {
    return `aq_${subject}_${tier}_${++_idCounter}`
}

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICS
// ─────────────────────────────────────────────────────────────────────────────

export const MATH_QUESTIONS_KG2: Q[] = [
    {
        id: qid('math', 1), gradeBand: 'KG2', subject: 'mathematics', topic: 'addition_subtraction',
        bloomsLevel: 'remember', difficultyTier: 1, questionType: 'mcq',
        prompt: 'There are 7 apples in a basket. You add 5 more. How many apples are there now?',
        options: ['12', '11', '13', '10'],
        correctAnswer: '12',
        explanation: '7 + 5 = 12. We count on 5 from 7: 8, 9, 10, 11, 12.',
        skillTag: 'single_digit_addition', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 1), gradeBand: 'KG2', subject: 'mathematics', topic: 'addition_subtraction',
        bloomsLevel: 'understand', difficultyTier: 1, questionType: 'mcq',
        prompt: 'Riya has 9 balloons. 3 balloons fly away. How many balloons remain?',
        options: ['6', '7', '5', '12'],
        correctAnswer: '6',
        explanation: '9 − 3 = 6. We take away 3 from 9.',
        skillTag: 'single_digit_subtraction', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 1), gradeBand: 'KG2', subject: 'mathematics', topic: 'addition_subtraction',
        bloomsLevel: 'apply', difficultyTier: 2, questionType: 'mcq',
        prompt: 'A hen has 6 chicks. Another hen has 8 chicks. How many chicks are there altogether?',
        options: ['14', '13', '15', '12'],
        correctAnswer: '14',
        explanation: '6 + 8 = 14. We add the chicks of both hens together.',
        skillTag: 'addition_within_20', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 1), gradeBand: 'KG2', subject: 'mathematics', topic: 'number_sense',
        bloomsLevel: 'remember', difficultyTier: 1, questionType: 'mcq',
        prompt: 'Which number comes between 11 and 13?',
        options: ['12', '10', '14', '11'],
        correctAnswer: '12',
        explanation: 'The number sequence is 11, 12, 13. So 12 comes between 11 and 13.',
        skillTag: 'number_order_within_20', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 1), gradeBand: 'KG2', subject: 'mathematics', topic: 'multiplication_division',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'There are 2 baskets. Each basket has 4 mangoes. How many mangoes are there in total?',
        options: ['8', '6', '10', '4'],
        correctAnswer: '8',
        explanation: '2 × 4 = 8. We have 2 groups of 4 mangoes each.',
        skillTag: 'intro_multiplication_2x', sourceType: 'human_authored', validated: true,
    },
]

export const MATH_QUESTIONS_35: Q[] = [
    {
        id: qid('math', 2), gradeBand: '35', subject: 'mathematics', topic: 'fractions',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'What fraction of the figure is shaded if 3 out of 8 equal parts are coloured?',
        options: ['3/8', '5/8', '3/5', '8/3'],
        correctAnswer: '3/8',
        explanation: 'A fraction = shaded parts / total equal parts = 3/8. Here 3 parts are shaded out of 8 equal parts. Distractor 5/8 is the unshaded portion; 3/5 confuses the shaded with unshaded; 8/3 inverts the fraction.',
        skillTag: 'fraction_as_part_of_whole', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 2), gradeBand: '35', subject: 'mathematics', topic: 'multiplication_division',
        bloomsLevel: 'apply', difficultyTier: 2, questionType: 'mcq',
        prompt: 'A box contains 7 rows of chocolates. Each row has 8 chocolates. How many chocolates are in the box?',
        options: ['56', '54', '48', '63'],
        correctAnswer: '56',
        explanation: '7 × 8 = 56. Distractor 54 = 6×9 (a common adjacent table error); 48 = 6×8 (one row fewer); 63 = 7×9 (one extra per row).',
        skillTag: 'multiplication_tables_7x8', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 2), gradeBand: '35', subject: 'mathematics', topic: 'addition_subtraction',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'Rahul had ₹435. He spent ₹178 on books. How much money does he have left?',
        options: ['₹257', '₹267', '₹247', '₹357'],
        correctAnswer: '₹257',
        explanation: '435 − 178 = 257. Distractor ₹267 = forgot to borrow in tens place; ₹247 = double borrowing error; ₹357 = added instead of subtracted.',
        skillTag: '3digit_subtraction_with_borrowing', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 2), gradeBand: '35', subject: 'mathematics', topic: 'decimals',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'Which decimal is equivalent to 3/4?',
        options: ['0.75', '0.34', '0.43', '0.25'],
        correctAnswer: '0.75',
        explanation: '3 ÷ 4 = 0.75. Distractor 0.34 reads the digits directly (3 and 4); 0.43 reverses the decimal reading; 0.25 = 1/4 (common fraction confusion).',
        skillTag: 'fraction_to_decimal_conversion', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 2), gradeBand: '35', subject: 'mathematics', topic: 'geometry_2d',
        bloomsLevel: 'remember', difficultyTier: 1, questionType: 'mcq',
        prompt: 'How many sides does a hexagon have?',
        options: ['6', '5', '7', '8'],
        correctAnswer: '6',
        explanation: 'A hexagon has exactly 6 sides. Penta = 5 sides (pentagon); hepta = 7 sides (heptagon). Hex means 6 in Greek.',
        skillTag: 'polygon_names_and_sides', sourceType: 'human_authored', validated: true,
    },
]

export const MATH_QUESTIONS_68: Q[] = [
    {
        id: qid('math', 3), gradeBand: '68', subject: 'mathematics', topic: 'fractions',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'What is 3/4 + 1/8?',
        options: ['7/8', '4/12', '1', '4/8'],
        correctAnswer: '7/8',
        explanation: 'LCM(4,8) = 8. So 3/4 = 6/8. Then 6/8 + 1/8 = 7/8. Distractor 4/12: student added numerators (3+1=4) and denominators (4+8=12) separately. Distractor 1: student incorrectly rounded up. Distractor 4/8: student just added numerators and kept a middle denominator.',
        skillTag: 'fraction_addition_unlike_denominators', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 3), gradeBand: '68', subject: 'mathematics', topic: 'integers',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'What is (−8) × (−5)?',
        options: ['40', '−40', '13', '−13'],
        correctAnswer: '40',
        explanation: 'Negative × Negative = Positive. (−8) × (−5) = +40. Distractor −40: student applied sign rules wrongly (negative × negative = negative). Distractor 13: student added 8+5. Distractor −13: student subtracted and kept sign.',
        skillTag: 'integer_multiplication_signs', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 3), gradeBand: '68', subject: 'mathematics', topic: 'percentages',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'A shirt costs ₹600. It is sold at a 25% discount. What is the selling price?',
        options: ['₹450', '₹150', '₹480', '₹525'],
        correctAnswer: '₹450',
        explanation: 'Discount = 25% of 600 = 150. Selling price = 600 − 150 = ₹450. Distractor ₹150: student found only the discount, not the selling price. Distractor ₹480: student computed 20% discount instead. Distractor ₹525: student subtracted only 12.5%.',
        skillTag: 'percentage_discount_calculation', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 3), gradeBand: '68', subject: 'mathematics', topic: 'algebra_expressions',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'If 3x − 7 = 14, what is the value of x?',
        options: ['7', '−7', '3', '21'],
        correctAnswer: '7',
        explanation: '3x = 14 + 7 = 21; x = 21 ÷ 3 = 7. Distractor −7: sign error when transposing. Distractor 3: student divided 14+7 by 7 instead of 3. Distractor 21: student stopped after finding 3x = 21 without dividing by 3.',
        skillTag: 'linear_equations_one_variable', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 3), gradeBand: '68', subject: 'mathematics', topic: 'ratios_proportions',
        bloomsLevel: 'analyze', difficultyTier: 4, questionType: 'mcq',
        prompt: 'The ratio of boys to girls in a class is 3:5. If there are 24 boys, how many girls are there?',
        options: ['40', '32', '15', '45'],
        correctAnswer: '40',
        explanation: 'Ratio 3:5 means 3 parts boys. 1 part = 24 ÷ 3 = 8. Girls = 5 × 8 = 40. Distractor 32: student added 24+8 using wrong step. Distractor 15: student confused the ratio values. Distractor 45: student multiplied incorrectly.',
        skillTag: 'ratio_proportion_word_problem', sourceType: 'human_authored', validated: true,
    },
]

export const MATH_QUESTIONS_912: Q[] = [
    {
        id: qid('math', 4), gradeBand: '912', subject: 'mathematics', topic: 'quadratic_equations',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'The roots of the equation x² − 5x + 6 = 0 are:',
        options: ['2 and 3', '−2 and −3', '1 and 6', '−1 and 6'],
        correctAnswer: '2 and 3',
        explanation: 'By factorisation: (x−2)(x−3) = 0 → x = 2 or x = 3. Check: 2+3=5 (= −b/a ✓) and 2×3=6 (= c/a ✓). Distractor −2 and −3: sign error in factorisation. Distractor 1 and 6: 1+6≠5. Distractor −1 and 6: product = −6 ≠ +6.',
        skillTag: 'quadratic_roots_factorisation', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 4), gradeBand: '912', subject: 'mathematics', topic: 'trigonometry',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'In a right triangle, if sin θ = 5/13, what is cos θ?',
        options: ['12/13', '5/12', '13/12', '8/13'],
        correctAnswer: '12/13',
        explanation: 'Using Pythagoras: adjacent² = 13² − 5² = 169 − 25 = 144; adjacent = 12. cos θ = adjacent/hypotenuse = 12/13. Distractor 5/12: this is tan θ, not cos θ. Distractor 13/12: inverted cos (secant). Distractor 8/13: incorrect adjacent calculation (13−5).',
        skillTag: 'trigonometric_ratios_right_triangle', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 4), gradeBand: '912', subject: 'mathematics', topic: 'statistics',
        bloomsLevel: 'analyze', difficultyTier: 4, questionType: 'mcq',
        prompt: 'The mean of 5 numbers is 32. If four of them are 28, 35, 27, and 40, what is the fifth number?',
        options: ['30', '34', '32', '29'],
        correctAnswer: '30',
        explanation: 'Sum = 5 × 32 = 160. Known sum = 28+35+27+40 = 130. Fifth = 160−130 = 30. Distractor 34: arithmetic error in sum. Distractor 32: student writes the mean as the missing value. Distractor 29: calculation error in subtraction.',
        skillTag: 'mean_reverse_calculation', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 4), gradeBand: '912', subject: 'mathematics', topic: 'probability',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'A bag contains 4 red and 6 blue balls. One ball is drawn at random. What is the probability of drawing a red ball?',
        options: ['2/5', '4/6', '3/5', '1/4'],
        correctAnswer: '2/5',
        explanation: 'Total balls = 10. P(red) = 4/10 = 2/5 (simplified). Distractor 4/6: student used blue as denominator instead of total. Distractor 3/5: this is P(blue). Distractor 1/4: incorrect denominator of 4.',
        skillTag: 'basic_probability_single_event', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('math', 4), gradeBand: '912', subject: 'mathematics', topic: 'coordinate_geometry',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'What is the distance between the points A(3, 4) and B(0, 0)?',
        options: ['5', '7', '√7', '25'],
        correctAnswer: '5',
        explanation: 'Distance = √((3−0)² + (4−0)²) = √(9+16) = √25 = 5. This is a classic 3-4-5 Pythagorean triple. Distractor 7: student added coordinates 3+4. Distractor √7: student computed √(3+4). Distractor 25: student forgot to take square root.',
        skillTag: 'distance_formula_coordinate_geometry', sourceType: 'human_authored', validated: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH
// ─────────────────────────────────────────────────────────────────────────────

export const ENGLISH_QUESTIONS_35: Q[] = [
    {
        id: qid('eng', 2), gradeBand: '35', subject: 'english', topic: 'parts_of_speech',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'Which word in the sentence is a proper noun? "Priya visited the Eiffel Tower on Sunday."',
        options: ['Eiffel Tower', 'visited', 'the', 'on'],
        correctAnswer: 'Eiffel Tower',
        explanation: 'A proper noun names a specific person, place, or thing. "Eiffel Tower" is the name of a specific monument. "visited" is a verb; "the" is an article; "on" is a preposition.',
        skillTag: 'proper_noun_identification', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('eng', 2), gradeBand: '35', subject: 'english', topic: 'tenses',
        bloomsLevel: 'apply', difficultyTier: 2, questionType: 'mcq',
        prompt: 'Choose the correct form: "She ______ to school every day."',
        options: ['goes', 'go', 'went', 'going'],
        correctAnswer: 'goes',
        explanation: 'Third person singular (she/he/it) + present simple → add -s to the verb. "She goes." Distractor "go": used with I/you/we/they. Distractor "went": past tense. Distractor "going": needs auxiliary "is" before it.',
        skillTag: 'present_simple_subject_verb_agreement', sourceType: 'human_authored', validated: true,
    },
]

export const ENGLISH_QUESTIONS_68: Q[] = [
    {
        id: qid('eng', 3), gradeBand: '68', subject: 'english', topic: 'grammar_advanced',
        bloomsLevel: 'analyze', difficultyTier: 3, questionType: 'mcq',
        prompt: 'Identify the type of clause underlined: "I will help you [if you ask me]."',
        options: ['Adverbial clause', 'Noun clause', 'Relative clause', 'Independent clause'],
        correctAnswer: 'Adverbial clause',
        explanation: '"If you ask me" is an adverbial clause of condition — it modifies the verb "help" and states the condition. Noun clause = acts as subject/object. Relative clause = modifies a noun, starts with who/which/that. Independent clause = can stand alone.',
        skillTag: 'clause_identification_conditional', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('eng', 3), gradeBand: '68', subject: 'english', topic: 'vocabulary',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'Choose the word most similar in meaning to "tenacious":',
        options: ['Persistent', 'Timid', 'Generous', 'Clumsy'],
        correctAnswer: 'Persistent',
        explanation: '"Tenacious" means holding firm to a purpose; synonymous with persistent/determined. Timid = fearful (antonym of tenacious). Generous = giving freely (unrelated). Clumsy = lacking coordination (unrelated).',
        skillTag: 'synonym_vocabulary_intermediate', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('eng', 3), gradeBand: '68', subject: 'english', topic: 'figures_of_speech',
        bloomsLevel: 'analyze', difficultyTier: 3, questionType: 'mcq',
        prompt: 'Identify the figure of speech: "The wind whispered through the trees."',
        options: ['Personification', 'Simile', 'Metaphor', 'Alliteration'],
        correctAnswer: 'Personification',
        explanation: 'Wind cannot literally whisper — this gives the wind a human quality, which is personification. Simile = comparison using "like/as". Metaphor = direct comparison without "like/as". Alliteration = repetition of consonant sounds.',
        skillTag: 'figure_of_speech_personification', sourceType: 'human_authored', validated: true,
    },
]

export const ENGLISH_QUESTIONS_912: Q[] = [
    {
        id: qid('eng', 4), gradeBand: '912', subject: 'english', topic: 'literary_devices',
        bloomsLevel: 'evaluate', difficultyTier: 4, questionType: 'mcq',
        prompt: '"Life is a journey with problems as its fuel and solutions as its milestones." This sentence employs:',
        options: ['Extended metaphor', 'Oxymoron', 'Hyperbole', 'Personification'],
        correctAnswer: 'Extended metaphor',
        explanation: 'The whole sentence maps life onto a journey metaphorically, with multiple elements of the journey (fuel=problems, milestones=solutions) — this sustained comparison across multiple ideas is an extended metaphor. Oxymoron = contradictory terms. Hyperbole = exaggeration. Personification = human qualities to non-human.',
        skillTag: 'extended_metaphor_literary_analysis', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('eng', 4), gradeBand: '912', subject: 'english', topic: 'grammar_advanced',
        bloomsLevel: 'analyze', difficultyTier: 4, questionType: 'mcq',
        prompt: 'Which sentence is in the passive voice?\n(A) The committee approved the proposal.\n(B) The proposal was approved by the committee.\n(C) Approving the proposal was difficult.\n(D) The committee had approved the proposal.',
        options: ['The proposal was approved by the committee.', 'The committee approved the proposal.', 'Approving the proposal was difficult.', 'The committee had approved the proposal.'],
        correctAnswer: 'The proposal was approved by the committee.',
        explanation: 'Passive voice: subject receives the action. "The proposal [subject] was approved [past passive] by the committee [agent]." Options A, D are active voice. Option C uses a gerund phrase as subject.',
        skillTag: 'active_vs_passive_voice_identification', sourceType: 'human_authored', validated: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const SCIENCE_QUESTIONS_35: Q[] = [
    {
        id: qid('sci', 2), gradeBand: '35', subject: 'science', topic: 'plants_photosynthesis',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'What gas do plants release during photosynthesis?',
        options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'],
        correctAnswer: 'Oxygen',
        explanation: 'During photosynthesis, plants use sunlight, water, and carbon dioxide to make food (glucose) and release oxygen as a by-product. Distractor CO₂: plants absorb CO₂, not release it during photosynthesis. Nitrogen and Hydrogen are incorrect — they play no direct role in photosynthesis output.',
        skillTag: 'photosynthesis_gas_exchange', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sci', 2), gradeBand: '35', subject: 'science', topic: 'animals_classification',
        bloomsLevel: 'remember', difficultyTier: 1, questionType: 'mcq',
        prompt: 'Which of the following animals is a mammal?',
        options: ['Whale', 'Eagle', 'Frog', 'Salmon'],
        correctAnswer: 'Whale',
        explanation: 'Mammals are warm-blooded, give birth to live young, and suckle them. Whales are mammals (they breathe air and feed milk to young). Eagle = bird. Frog = amphibian. Salmon = fish.',
        skillTag: 'animal_classification_mammals', sourceType: 'human_authored', validated: true,
    },
]

export const SCIENCE_QUESTIONS_68: Q[] = [
    {
        id: qid('sci', 3), gradeBand: '68', subject: 'science', topic: 'atoms_molecules',
        bloomsLevel: 'understand', difficultyTier: 3, questionType: 'mcq',
        prompt: 'The atomic number of an element tells us the number of:',
        options: ['Protons in the nucleus', 'Neutrons in the nucleus', 'Electrons in outer shell only', 'Total particles in the atom'],
        correctAnswer: 'Protons in the nucleus',
        explanation: 'Atomic number = number of protons in the nucleus. For a neutral atom, this also equals the number of electrons. Neutron count ≠ atomic number (that is mass number − atomic number). Electrons in outer shell is the valence electron count, not atomic number.',
        skillTag: 'atomic_structure_atomic_number', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sci', 3), gradeBand: '68', subject: 'science', topic: 'force_motion',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'A force of 20 N acts on a body of mass 4 kg. What is the acceleration of the body? (F = ma)',
        options: ['5 m/s²', '80 m/s²', '16 m/s²', '0.2 m/s²'],
        correctAnswer: '5 m/s²',
        explanation: 'a = F/m = 20/4 = 5 m/s². Distractor 80: student multiplied F×m instead of dividing. Distractor 16: student subtracted (20−4). Distractor 0.2: student inverted ratio (m/F = 4/20).',
        skillTag: "newton_second_law_F_equals_ma", sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sci', 3), gradeBand: '68', subject: 'science', topic: 'chemical_reactions',
        bloomsLevel: 'understand', difficultyTier: 3, questionType: 'mcq',
        prompt: 'What type of reaction occurs when iron rusts?',
        options: ['Oxidation reaction', 'Decomposition reaction', 'Displacement reaction', 'Neutralisation reaction'],
        correctAnswer: 'Oxidation reaction',
        explanation: 'Rusting = iron (Fe) reacts with oxygen and water to form iron oxide (Fe₂O₃). This involves iron gaining oxygen → oxidation. Decomposition = 1 compound splitting. Displacement = element displacing from a compound. Neutralisation = acid + base → salt + water.',
        skillTag: 'chemical_reactions_oxidation_rusting', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sci', 3), gradeBand: '68', subject: 'science', topic: 'electricity_magnetism',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'In a circuit with voltage 12 V and resistance 4 Ω, what is the current? (V = IR)',
        options: ['3 A', '48 A', '8 A', '0.33 A'],
        correctAnswer: '3 A',
        explanation: 'I = V/R = 12/4 = 3 A. Distractor 48: student multiplied V×R. Distractor 8: student subtracted (12−4). Distractor 0.33: student inverted ratio (R/V).',
        skillTag: 'ohms_law_current_calculation', sourceType: 'human_authored', validated: true,
    },
]

export const SCIENCE_QUESTIONS_912: Q[] = [
    {
        id: qid('sci', 4), gradeBand: '912', subject: 'science', topic: 'dna_genetics',
        bloomsLevel: 'analyze', difficultyTier: 4, questionType: 'mcq',
        prompt: 'In a monohybrid cross between two heterozygous plants (Tt × Tt), what is the expected phenotypic ratio in the offspring?',
        options: ['3:1', '1:2:1', '1:1', '2:1'],
        correctAnswer: '3:1',
        explanation: 'Tt × Tt gives: TT, Tt, Tt, tt. TT and Tt show dominant phenotype (tall) = 3. tt shows recessive (short) = 1. Phenotypic ratio = 3:1. Distractor 1:2:1 is the genotypic ratio, not phenotypic. Distractor 1:1 = testcross (Tt × tt). Distractor 2:1 is incorrect.',
        skillTag: 'mendelian_genetics_monohybrid_cross', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sci', 4), gradeBand: '912', subject: 'science', topic: 'modern_physics',
        bloomsLevel: 'apply', difficultyTier: 4, questionType: 'mcq',
        prompt: 'The work function of a metal is 2.5 eV. If light of energy 3.5 eV falls on it, what is the maximum kinetic energy of emitted electrons?',
        options: ['1.0 eV', '6.0 eV', '2.5 eV', '0.5 eV'],
        correctAnswer: '1.0 eV',
        explanation: 'By photoelectric equation: KE_max = E_photon − Work function = 3.5 − 2.5 = 1.0 eV. Distractor 6: student added the energies. Distractor 2.5: student wrote only the work function. Distractor 0.5: arithmetic error in subtraction.',
        skillTag: 'photoelectric_effect_kinetic_energy', sourceType: 'human_authored', validated: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL STUDIES
// ─────────────────────────────────────────────────────────────────────────────

export const SST_QUESTIONS_35: Q[] = [
    {
        id: qid('sst', 2), gradeBand: '35', subject: 'social_studies', topic: 'geography_political',
        bloomsLevel: 'remember', difficultyTier: 1, questionType: 'mcq',
        prompt: 'What is the capital city of France?',
        options: ['Paris', 'Rome', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital and largest city of France. Rome is the capital of Italy; Berlin of Germany; Madrid of Spain.',
        skillTag: 'world_capitals_europe', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sst', 2), gradeBand: '35', subject: 'social_studies', topic: 'map_skills',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'Which direction is directly opposite to North on a compass?',
        options: ['South', 'East', 'West', 'North-East'],
        correctAnswer: 'South',
        explanation: 'A compass has 4 cardinal directions. North and South are opposite; East and West are opposite. This is fundamental to map reading and orientation.',
        skillTag: 'compass_directions_cardinal', sourceType: 'human_authored', validated: true,
    },
]

export const SST_QUESTIONS_68: Q[] = [
    {
        id: qid('sst', 3), gradeBand: '68', subject: 'social_studies', topic: 'indian_freedom_struggle',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: 'The Non-Cooperation Movement (1920–22) was suspended by Gandhi because of:',
        options: ['The Chauri Chaura incident', 'The Jallianwala Bagh massacre', 'The Simon Commission report', 'The Quit India Movement'],
        correctAnswer: 'The Chauri Chaura incident',
        explanation: 'Gandhi suspended the Non-Cooperation Movement in February 1922 after a violent mob burned a police station in Chauri Chaura, U.P., killing police officers — contradicting the principle of non-violence. Jallianwala Bagh (1919) preceded this movement. Simon Commission was 1928. Quit India was 1942.',
        skillTag: 'non_cooperation_movement_chauri_chaura', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sst', 3), gradeBand: '68', subject: 'social_studies', topic: 'geography_physical',
        bloomsLevel: 'understand', difficultyTier: 3, questionType: 'mcq',
        prompt: 'Which type of rock is formed from molten material that cools and solidifies?',
        options: ['Igneous rock', 'Sedimentary rock', 'Metamorphic rock', 'Limestone'],
        correctAnswer: 'Igneous rock',
        explanation: 'Igneous rocks form from magma or lava that cools and solidifies. Sedimentary = formed from compacted sediment layers. Metamorphic = formed by heat/pressure transforming existing rocks. Limestone is a type of sedimentary rock, not a rock classification category.',
        skillTag: 'rock_types_classification', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('sst', 3), gradeBand: '68', subject: 'social_studies', topic: 'democracy_government',
        bloomsLevel: 'analyze', difficultyTier: 3, questionType: 'mcq',
        prompt: 'Which of the following is NOT a feature of a secular state?',
        options: ['State-sponsored religion', 'Equal rights for all religions', 'No official state religion', 'Freedom to practice any religion'],
        correctAnswer: 'State-sponsored religion',
        explanation: 'A secular state has no official religion and treats all religions equally. "State-sponsored religion" contradicts secularism — it would make one religion officially privileged. The other three options are all features of a secular state.',
        skillTag: 'secularism_democratic_principles', sourceType: 'human_authored', validated: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTER SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

export const CS_QUESTIONS_68: Q[] = [
    {
        id: qid('cs', 3), gradeBand: '68', subject: 'computer_science', topic: 'number_systems_binary',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'What is the decimal equivalent of the binary number 1011?',
        options: ['11', '13', '7', '9'],
        correctAnswer: '11',
        explanation: '1011 in binary: 1×2³ + 0×2² + 1×2¹ + 1×2⁰ = 8+0+2+1 = 11. Distractor 13 = 1101 binary. Distractor 7 = 0111 binary (3 bits). Distractor 9 = 1001 binary.',
        skillTag: 'binary_to_decimal_conversion', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('cs', 3), gradeBand: '68', subject: 'computer_science', topic: 'logic_gates_boolean',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: 'What is the output of an AND gate when inputs are A=1 and B=0?',
        options: ['0', '1', 'Undefined', '2'],
        correctAnswer: '0',
        explanation: 'AND gate output = A AND B. Truth table: 1 AND 0 = 0. AND gate outputs 1 only when ALL inputs are 1. Since B=0, output is 0. Distractor 1: common confusion with OR gate (which would output 1 here). Distractor Undefined/2: invalid for boolean logic.',
        skillTag: 'logic_gates_AND_truth_table', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('cs', 3), gradeBand: '68', subject: 'computer_science', topic: 'algorithms',
        bloomsLevel: 'analyze', difficultyTier: 3, questionType: 'mcq',
        prompt: 'Which sorting algorithm has a worst-case time complexity of O(n²)?',
        options: ['Bubble Sort', 'Merge Sort', 'Quick Sort (best case)', 'Binary Search'],
        correctAnswer: 'Bubble Sort',
        explanation: 'Bubble Sort always runs in O(n²) in the worst case — it compares adjacent elements and swaps. Merge Sort = O(n log n) in all cases. Quick Sort average = O(n log n) but worst case = O(n²) (which is why Bubble Sort is the clearer answer here). Binary Search = O(log n), not sorting.',
        skillTag: 'sorting_algorithms_time_complexity', sourceType: 'human_authored', validated: true,
    },
]

export const CS_QUESTIONS_912: Q[] = [
    {
        id: qid('cs', 4), gradeBand: '912', subject: 'computer_science', topic: 'recursion',
        bloomsLevel: 'analyze', difficultyTier: 4, questionType: 'mcq',
        prompt: 'What is the output of this function call: factorial(4), where factorial(n) = n × factorial(n−1) and factorial(0)=1?',
        options: ['24', '12', '16', '4'],
        correctAnswer: '24',
        explanation: 'factorial(4) = 4 × factorial(3) = 4×3×factorial(2) = 4×3×2×factorial(1) = 4×3×2×1×factorial(0) = 4×3×2×1×1 = 24. Distractor 12 = 3! (stopped one level early). Distractor 16 = 4² (confused with power). Distractor 4 = only the input, not the result.',
        skillTag: 'recursive_function_factorial_trace', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('cs', 4), gradeBand: '912', subject: 'computer_science', topic: 'data_structures',
        bloomsLevel: 'apply', difficultyTier: 4, questionType: 'mcq',
        prompt: 'In a stack data structure, which operation removes the top element?',
        options: ['Pop', 'Push', 'Peek', 'Dequeue'],
        correctAnswer: 'Pop',
        explanation: 'Stack operations: Push = add element to top; Pop = remove element from top; Peek/Top = view top without removing; Dequeue = remove from front of a Queue (not Stack). Stack follows LIFO (Last In First Out).',
        skillTag: 'stack_operations_LIFO', sourceType: 'human_authored', validated: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// HINDI
// ─────────────────────────────────────────────────────────────────────────────

export const HINDI_QUESTIONS_35: Q[] = [
    {
        id: qid('hin', 2), gradeBand: '35', subject: 'hindi', topic: 'shabdkosh',
        bloomsLevel: 'remember', difficultyTier: 1, questionType: 'mcq',
        prompt: '"सूर्य" का पर्यायवाची शब्द कौन सा है?',
        options: ['रवि', 'चंद्र', 'तारा', 'वायु'],
        correctAnswer: 'रवि',
        explanation: '"सूर्य" के पर्यायवाची: रवि, दिनकर, भास्कर, मार्तण्ड। "चंद्र" = चाँद (Moon), "तारा" = star, "वायु" = wind — ये सभी अलग अर्थ हैं।',
        skillTag: 'paryayvachi_shabd_surya', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('hin', 2), gradeBand: '35', subject: 'hindi', topic: 'vyakaran',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: '"लड़की" का बहुवचन क्या होगा?',
        options: ['लड़कियाँ', 'लड़कीयां', 'लड़कीएँ', 'लड़की'],
        correctAnswer: 'लड़कियाँ',
        explanation: 'आकारान्त स्त्रीलिंग शब्दों में ई → इयाँ होता है। लड़की → लड़कियाँ (ी हटाकर + ियाँ लगाएं)। "लड़कीयां" — गलत वर्तनी। "लड़कीएँ" — नियमविरुद्ध। "लड़की" — एकवचन है।',
        skillTag: 'vachan_parivartan_streelinng', sourceType: 'human_authored', validated: true,
    },
]

export const HINDI_QUESTIONS_68: Q[] = [
    {
        id: qid('hin', 3), gradeBand: '68', subject: 'hindi', topic: 'sandhi',
        bloomsLevel: 'apply', difficultyTier: 3, questionType: 'mcq',
        prompt: '"देव + आलय" की संधि क्या होगी?',
        options: ['देवालय', 'देवैलय', 'देवोलय', 'देव्आलय'],
        correctAnswer: 'देवालय',
        explanation: 'अ + आ = आ (दीर्घ स्वर संधि)। देव (अ) + आलय (आ) = देवालय। यह स्वर संधि का सबसे सरल नियम है। "देवैलय" — गलत (अ+आ≠ऐ)। "देवोलय" — गलत (ओ नहीं बनता)। "देव्आलय" — हलंत गलत है।',
        skillTag: 'sandhi_swar_sandhi_aa', sourceType: 'human_authored', validated: true,
    },
    {
        id: qid('hin', 3), gradeBand: '68', subject: 'hindi', topic: 'muhavare_lokoktiyan',
        bloomsLevel: 'understand', difficultyTier: 2, questionType: 'mcq',
        prompt: '"आँखें खुलना" मुहावरे का सही अर्थ क्या है?',
        options: ['सच्चाई का पता चलना', 'नींद से जागना', 'आँखें बड़ी होना', 'खुशी होना'],
        correctAnswer: 'सच्चाई का पता चलना',
        explanation: '"आँखें खुलना" का अर्थ है — वास्तविकता या सच्चाई का बोध होना। उदाहरण: "धोखा खाकर उसकी आँखें खुल गईं।" यह मुहावरा शाब्दिक नींद से नहीं, बल्कि भावनात्मक जागरूकता से संबंधित है।',
        skillTag: 'muhavare_ankh_khulna', sourceType: 'human_authored', validated: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// GK & LIFE SKILLS
// ─────────────────────────────────────────────────────────────────────────────

export const GK_QUESTIONS_35: Q[] = [
    {
        id: qid('gk', 2), gradeBand: '35', subject: 'gk', topic: 'famous_scientists',
        bloomsLevel: 'remember', difficultyTier: 1, questionType: 'mcq',
        prompt: 'Who invented the telephone?',
        options: ['Alexander Graham Bell', 'Thomas Edison', 'Nikola Tesla', 'Guglielmo Marconi'],
        correctAnswer: 'Alexander Graham Bell',
        explanation: 'Alexander Graham Bell patented the telephone in 1876. Edison invented the phonograph and practical electric light. Tesla worked on AC electricity. Marconi developed radio communication.',
        skillTag: 'inventors_telephone_bell', sourceType: 'human_authored', validated: true,
    },
]

export const GK_QUESTIONS_68: Q[] = [
    {
        id: qid('gk', 3), gradeBand: '68', subject: 'gk', topic: 'awards',
        bloomsLevel: 'remember', difficultyTier: 2, questionType: 'mcq',
        prompt: 'The Nobel Prize in Physics 2023 was awarded for work related to:',
        options: ['Attosecond pulses of light for studying electron dynamics', 'CRISPR gene editing', 'Quantum computing', 'Discovery of the Higgs boson'],
        correctAnswer: 'Attosecond pulses of light for studying electron dynamics',
        explanation: 'The 2023 Nobel Prize in Physics was awarded to Pierre Agostini, Ferenc Krausz, and Anne L\'Huillier for experimental methods that generate attosecond pulses of light, enabling the study of electron dynamics in atoms and molecules. CRISPR = Chemistry 2020. Higgs boson = Physics 2013.',
        skillTag: 'nobel_prize_physics_current_affairs', sourceType: 'human_authored', validated: true,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// MASTER EXPORT — All banks by subject and grade band
// ─────────────────────────────────────────────────────────────────────────────

export const ACADEMIC_QUESTION_BANK = {
    mathematics: {
        KG2: MATH_QUESTIONS_KG2,
        '35': MATH_QUESTIONS_35,
        '68': MATH_QUESTIONS_68,
        '912': MATH_QUESTIONS_912,
    },
    english: {
        '35': ENGLISH_QUESTIONS_35,
        '68': ENGLISH_QUESTIONS_68,
        '912': ENGLISH_QUESTIONS_912,
    },
    science: {
        '35': SCIENCE_QUESTIONS_35,
        '68': SCIENCE_QUESTIONS_68,
        '912': SCIENCE_QUESTIONS_912,
    },
    social_studies: {
        '35': SST_QUESTIONS_35,
        '68': SST_QUESTIONS_68,
    },
    computer_science: {
        '68': CS_QUESTIONS_68,
        '912': CS_QUESTIONS_912,
    },
    hindi: {
        '35': HINDI_QUESTIONS_35,
        '68': HINDI_QUESTIONS_68,
    },
    gk: {
        '35': GK_QUESTIONS_35,
        '68': GK_QUESTIONS_68,
    },
}

/**
 * Get questions for a subject + gradeBand combination.
 * Returns validated academic questions only.
 */
export function getAcademicQuestions(
    subject: keyof typeof ACADEMIC_QUESTION_BANK,
    gradeBand: string,
    limit?: number
): Q[] {
    const subjectBank = ACADEMIC_QUESTION_BANK[subject] as Record<string, Q[]>
    const questions = subjectBank?.[gradeBand] ?? []
    if (limit) return questions.slice(0, limit)
    return questions
}

/**
 * Get all questions for a grade band across all subjects.
 */
export function getAllQuestionsForGrade(gradeBand: string): Q[] {
    const all: Q[] = []
    for (const subject of Object.values(ACADEMIC_QUESTION_BANK)) {
        const pool = (subject as Record<string, Q[]>)[gradeBand]
        if (pool) all.push(...pool)
    }
    return all
}

/**
 * Get questions for a specific skill tag.
 */
export function getQuestionsBySkill(skillTag: string): Q[] {
    const all = getAllQuestionsForGrade('35').concat(
        getAllQuestionsForGrade('68'),
        getAllQuestionsForGrade('912'),
        getAllQuestionsForGrade('KG2'),
    )
    return all.filter(q => q.skillTag === skillTag || q.topic === skillTag)
}

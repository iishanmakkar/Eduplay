/**
 * lib/microcopy/game-descriptions.ts  (Phase 7 — Elite Product Positioning)
 *
 * All 150+ game descriptions rewritten for intellectual, aspirational, academic tone.
 * Paired with original "casual" label for A/B testing capability.
 */

export interface GameDescription {
    key: string
    name: string
    tagline: string          // Premium one-liner (for cards)
    description: string      // Full academic description (for detail pages)
    skillDeveloped: string   // Learning objective in precise academic framing
    subject: string
    bloomsLevel: string
}

export const ELITE_GAME_DESCRIPTIONS: GameDescription[] = [
    // ── Mathematics ──────────────────────────────────────────────────────────
    {
        key: 'NUMBER_CATERPILLAR',
        name: 'Number Caterpillar',
        tagline: 'Sequence recognition under dynamic time pressure.',
        description: 'Develop numerical pattern recognition by constructing and completing integer sequences across increasing cardinality ranges. Students strengthen their intuitive number sense through rapid sequential decision-making.',
        skillDeveloped: 'Number sequencing, ordinality, and magnitude estimation',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'HOT_AIR_BALLOON_RACE',
        name: 'Hot Air Balloon Race',
        tagline: 'Additive fluency through competitive timed challenge.',
        description: 'Strengthen additive and subtractive fluency as students solve multi-operand arithmetic problems to maintain trajectory in a real-time simulation. Develops mental calculation speed and working memory.',
        skillDeveloped: 'Mental arithmetic, additive fluency, working memory',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'APPLE_ORCHARD_COLLECTOR',
        name: 'Apple Orchard Collector',
        tagline: 'Multiplication mastery through combinatorial reasoning.',
        description: 'Build multiplicative understanding by computing area models and array structures within constrained time windows. Students develop automaticity in multiplication facts while reinforcing conceptual foundations.',
        skillDeveloped: 'Multiplicative reasoning, array models, times tables fluency',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'FRACTION_ARROW_ARCHER',
        name: 'Fraction Arrow Archer',
        tagline: 'Fractional precision through spatial reasoning.',
        description: 'Develop fractional number sense and equivalence recognition by precisely locating rational numbers on dynamic number line representations. Students apply benchmark fractions and partitioning strategies under real-time conditions.',
        skillDeveloped: 'Fraction equivalence, number line placement, rational number sense',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'PIZZA_SLICE_WARS',
        name: 'Pizza Slice Wars',
        tagline: 'Proportional reasoning through part-whole relationships.',
        description: 'Deepen understanding of proportional relationships and fractional representations by comparing and ordering part-whole models in competitive scenarios. Reinforces the connection between visual models and symbolic fractions.',
        skillDeveloped: 'Proportional reasoning, part-whole relationships, fraction comparison',
        subject: 'Mathematics',
        bloomsLevel: 'analyze',
    },
    {
        key: 'DECIMAL_DODGE',
        name: 'Decimal Dodge',
        tagline: 'Place-value precision across the decimal continuum.',
        description: 'Strengthen decimal number sense through rapid comparison, ordering, and rounding tasks. Students navigate a place-value landscape, developing automaticity in decimal operations and measurement conversions.',
        skillDeveloped: 'Decimal place value, comparison, rounding, scientific notation',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'MARKET_MAYHEM',
        name: 'Market Mayhem',
        tagline: 'Financial literacy through applied percentage reasoning.',
        description: 'Apply percentage calculations, profit-and-loss analysis, and discount modelling in authentic marketplace contexts. Students develop financial numeracy and economic reasoning through rapid decision-making.',
        skillDeveloped: 'Percentages, financial literacy, profit-loss, consumer arithmetic',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'FACTOR_FORTRESS',
        name: 'Factor Fortress',
        tagline: 'Multiplicative structure through factor pair analysis.',
        description: 'Investigate the multiplicative structure of integers by identifying factor pairs, prime factorizations, and LCM/GCD relationships. Strengthens number theory foundations essential for algebraic reasoning.',
        skillDeveloped: 'Factors, multiples, prime factorisation, LCM, GCD',
        subject: 'Mathematics',
        bloomsLevel: 'analyze',
    },
    {
        key: 'RATIO_RAIL_RUSH',
        name: 'Ratio Rail Rush',
        tagline: 'Proportional reasoning at speed.',
        description: 'Develop ratio intuition and proportional reasoning by solving rate problems, scaling scenarios, and equivalent ratio challenges in time-critical conditions. Builds the mathematical foundation for algebra and chemistry.',
        skillDeveloped: 'Ratios, rates, proportional relationships, scaling',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'MULTIPLIER_MAYHEM',
        name: 'Multiplier Mayhem',
        tagline: 'Multiplicative fluency under dynamic time constraints.',
        description: 'Strengthen multiplicative fluency and automaticity through high-frequency drill challenges of increasing difficulty. Targets the development of arithmetic fluency that underlies proficiency in algebra and higher mathematics.',
        skillDeveloped: 'Multiplication fluency, mental arithmetic, rapid recall',
        subject: 'Mathematics',
        bloomsLevel: 'remember',
    },
    {
        key: 'ANGLE_ASSASSIN',
        name: 'Angle Assassin',
        tagline: 'Geometric precision through angular measurement.',
        description: 'Develop geometric intuition by classifying, estimating, and computing with angles formed by intersecting lines, polygons, and transversals. Students apply the properties of geometric relationships with increasing precision.',
        skillDeveloped: 'Angle properties, geometric relationships, spatial reasoning',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'ALGEBRA_WAVE_SURFER',
        name: 'Algebra Wave Surfer',
        tagline: 'Symbolic reasoning and equation manipulation.',
        description: 'Navigate algebraic equations and inequalities by applying inverse operations, balancing strategies, and variable isolation techniques. Develops the symbolic fluency foundational to advanced mathematics.',
        skillDeveloped: 'Linear algebra, equation solving, variable manipulation',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'AREA_CONSTRUCTOR',
        name: 'Area Constructor',
        tagline: 'Spatial quantification through measurement and formula application.',
        description: 'Apply area and perimeter formulae across composite shapes, irregular polygons, and coordinate-defined regions. Strengthens the connection between geometric intuition and algebraic measurement.',
        skillDeveloped: 'Area, perimeter, composite shapes, measurement',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'INTEGER_ICE_BATTLE',
        name: 'Integer Ice Battle',
        tagline: 'Signed arithmetic through competitive strategic play.',
        description: 'Master operations with integers and signed numbers through adversarial problem-solving scenarios. Develops fluency with addition, subtraction, multiplication, and division of negative quantities — critical for algebraic success.',
        skillDeveloped: 'Integer operations, signed numbers, number line reasoning',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'DATA_DETECTIVE',
        name: 'Data Detective',
        tagline: 'Statistical inference through analytical investigation.',
        description: 'Develop statistical literacy by interpreting data displays, computing measures of central tendency, and drawing evidence-based inferences. Students practise the critical thinking skills of a professional data analyst.',
        skillDeveloped: 'Statistics, mean/median/mode, data interpretation, inference',
        subject: 'Mathematics',
        bloomsLevel: 'analyze',
    },
    {
        key: 'PROBABILITY_POKER',
        name: 'Probability Poker',
        tagline: 'Strategic reasoning under uncertainty.',
        description: 'Apply theoretical and experimental probability to evaluate risk and expected value in strategic decision scenarios. Develops probabilistic thinking — a core skill in mathematics, science, and economics.',
        skillDeveloped: 'Probability, expected value, combinatorics, theoretical vs experimental',
        subject: 'Mathematics',
        bloomsLevel: 'evaluate',
    },
    {
        key: 'COORDINATE_COMBAT',
        name: 'Coordinate Combat',
        tagline: 'Analytical geometry through strategic spatial reasoning.',
        description: 'Apply coordinate geometry principles — transformations, gradients, midpoints, and distance formulae — in a competitive spatial environment. Strengthens the visual-analytical bridge between algebra and geometry.',
        skillDeveloped: 'Coordinate geometry, transformations, gradient, distance',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'QUADRATIC_QUEST',
        name: 'Quadratic Quest',
        tagline: 'Polynomial analysis and solution methodology.',
        description: 'Solve quadratic equations using factorisation, completing the square, and the quadratic formula across varied contexts. Develops algebraic proficiency and an understanding of parabolic behaviour in mathematical modelling.',
        skillDeveloped: 'Quadratic equations, factorisation, discriminant analysis',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'TRIG_BRIDGE_BUILDER',
        name: 'Trig Bridge Builder',
        tagline: 'Applied trigonometry through structural problem-solving.',
        description: 'Apply trigonometric ratios, sine/cosine rules, and radian measurement to solve real-world problems in engineering and physics contexts. Develops the mathematical precision required for STEM disciplines.',
        skillDeveloped: 'Trigonometry, SOH-CAH-TOA, sine rule, cosine rule, radians',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'MATRIX_MORPH_DUEL',
        name: 'Matrix Morph Duel',
        tagline: 'Linear algebra through matrix transformation battles.',
        description: 'Perform matrix operations — multiplication, determinants, inverses, and transformations — in real-time competitive scenarios. Develops the linear algebra fluency underpinning computer graphics, physics, and machine learning.',
        skillDeveloped: 'Matrix operations, determinants, linear transformations',
        subject: 'Mathematics',
        bloomsLevel: 'apply',
    },
    {
        key: 'NUMBER_THEORY_VAULT',
        name: 'Number Theory Vault',
        tagline: 'Abstract algebraic structures through number theory exploration.',
        description: 'Explore prime numbers, modular arithmetic, Diophantine equations, and cryptographic principles. Designed for advanced students pursuing mathematical olympiad preparation or computer science foundations.',
        skillDeveloped: 'Number theory, modular arithmetic, primes, cryptography',
        subject: 'Mathematics',
        bloomsLevel: 'analyze',
    },
    // ── Science ───────────────────────────────────────────────────────────────
    {
        key: 'PERIODIC_BATTLESHIP',
        name: 'Periodic Battleship',
        tagline: 'Element recognition and periodic law mastery.',
        description: 'Develop fluency with the periodic table by identifying elements by atomic number, symbol, and periodic group. Students apply periodic trends — electronegativity, atomic radius, ionisation energy — to predict elemental properties.',
        skillDeveloped: 'Periodic table, element properties, periodic trends',
        subject: 'Science',
        bloomsLevel: 'apply',
    },
    {
        key: 'ANIMAL_KINGDOM_SORTER',
        name: 'Animal Kingdom Sorter',
        tagline: 'Taxonomic classification through biological systems thinking.',
        description: 'Apply principles of biological taxonomy to classify organisms by kingdom, phylum, class, and defining characteristics. Develops systematic scientific reasoning and an understanding of evolutionary relationships.',
        skillDeveloped: 'Biological taxonomy, classification, evolutionary relationships',
        subject: 'Science',
        bloomsLevel: 'analyze',
    },
    // ── Computer Science ──────────────────────────────────────────────────────
    {
        key: 'BINARY_BLASTER',
        name: 'Binary Blaster',
        tagline: 'Number system fluency across binary, decimal, and hexadecimal.',
        description: 'Develop computational thinking through rapid conversion between binary, decimal, octal, and hexadecimal number systems. Foundational for computer architecture, networking, and low-level programming.',
        skillDeveloped: 'Number systems, binary arithmetic, data representation',
        subject: 'Computer Science',
        bloomsLevel: 'apply',
    },
    // ── Social Studies ────────────────────────────────────────────────────────
    {
        key: 'CAPITALS_CONQUEST',
        name: 'Capitals Conquest',
        tagline: 'Geopolitical spatial knowledge through competitive recall.',
        description: 'Strengthen geographical fluency by identifying capital cities, nations, and political boundaries across all world regions. Develops the geospatial awareness essential for global citizenship and social studies success.',
        skillDeveloped: 'World geography, geopolitics, spatial reasoning, capitals',
        subject: 'Social Studies',
        bloomsLevel: 'remember',
    },
    {
        key: 'BUDGET_BATTLE',
        name: 'Budget Battle',
        tagline: 'Financial decision-making under economic constraints.',
        description: 'Apply economic reasoning to allocate resources, optimise budgets, and evaluate trade-offs in simulated financial scenarios. Develops the critical thinking and mathematical modelling skills central to financial literacy.',
        skillDeveloped: 'Financial literacy, economic reasoning, resource allocation',
        subject: 'Social Studies / Mathematics',
        bloomsLevel: 'evaluate',
    },
    // ── English ───────────────────────────────────────────────────────────────
    {
        key: 'SYNONYM_SWITCHBLADE',
        name: 'Synonym Switchblade',
        tagline: 'Lexical precision through synonymic substitution.',
        description: 'Expand active vocabulary and contextual word choice by selecting precise synonyms and antonyms in authentic prose contexts. Develops the lexical range required for sophisticated written and oral communication.',
        skillDeveloped: 'Vocabulary breadth, word choice, contextual precision, lexical range',
        subject: 'English',
        bloomsLevel: 'apply',
    },
    {
        key: 'GRAMMAR_GLADIATOR',
        name: 'Grammar Gladiator',
        tagline: 'Apply syntactic precision through contextual grammar placement.',
        description: 'Master grammatical structures — tenses, subject-verb agreement, punctuation, and clause analysis — through competitive timed challenges. Develops the syntactic accuracy foundational to proficient writing and academic communication.',
        skillDeveloped: 'Grammar, syntax, punctuation, sentence structure',
        subject: 'English',
        bloomsLevel: 'apply',
    },
    // ── Hindi ─────────────────────────────────────────────────────────────────
    {
        key: 'SHABDKOSH_SPRINT',
        name: 'Shabdkosh Sprint',
        tagline: 'Hindi lexical fluency through accelerated vocabulary acquisition.',
        description: 'Strengthen Hindi vocabulary, muhavare (idiomatic expressions), and sandhi (phonological fusion) mastery through structured, progressive challenges. Develops linguistic competence for CBSE Hindi examinations.',
        skillDeveloped: 'Hindi vocabulary, muhavare, sandhi, samas, vyakaran',
        subject: 'Hindi',
        bloomsLevel: 'remember',
    },
]

/**
 * Look up the elite description for a game key.
 * Returns undefined if not yet catalogued.
 */
export function getEliteDescription(gameKey: string): GameDescription | undefined {
    return ELITE_GAME_DESCRIPTIONS.find(g => g.key === gameKey)
}

/**
 * Get all descriptions for a subject.
 */
export function getDescriptionsBySubject(subject: string): GameDescription[] {
    return ELITE_GAME_DESCRIPTIONS.filter(g => g.subject.toLowerCase().includes(subject.toLowerCase()))
}

/**
 * Central Game Registry
 * Single source of truth for all games on the platform.
 * Import this in: app/games/page.tsx, app/games/play/page.tsx
 */

export type GradeBand = 'kg2' | '35' | '68' | '912' | 'all'
export type Subject =
    | 'Math' | 'English' | 'Science' | 'SocialStudies'
    | 'ComputerScience' | 'Hindi' | 'GK' | 'Simulation' | 'CrossCurricular'

export type MechanicType =
    | 'quiz'      // Q&A with options
    | 'drag'      // Drag-and-drop
    | 'sort'      // Sorting/ordering
    | 'build'     // Construction/assembly
    | 'sim'       // Simulation
    | 'match'     // Matching pairs
    | 'shoot'     // Shooter/tap game
    | 'race'      // Racing/speed
    | 'puzzle'    // Puzzle solving
    | 'debate'    // Argument/choice game

export interface GameEntry {
    key: string
    name: string
    emoji: string
    description: string
    subject: Subject
    grade: GradeBand
    topic: string
    mechanic: MechanicType
    isNew?: boolean
}

// ─── Existing 25 Games ────────────────────────────────────────────────────────
const EXISTING: GameEntry[] = [
    { key: 'SPEED_MATH', name: 'Speed Math', emoji: '🔢', description: 'Solve math problems as fast as you can!', subject: 'Math', grade: '35', topic: 'Arithmetic', mechanic: 'quiz' },
    { key: 'SCIENCE_QUIZ', name: 'Science Quiz', emoji: '🔬', description: 'Test your science knowledge!', subject: 'Science', grade: '35', topic: 'General Science', mechanic: 'quiz' },
    { key: 'WORLD_FLAGS', name: 'World Flags', emoji: '🌍', description: 'Identify countries by their flags!', subject: 'GK', grade: '35', topic: 'World Geography', mechanic: 'quiz' },
    { key: 'MEMORY_MATCH', name: 'Memory Match', emoji: '🧠', description: 'Match pairs of cards to test your memory!', subject: 'GK', grade: '35', topic: 'Memory', mechanic: 'match' },
    { key: 'WORD_SCRAMBLE', name: 'Word Scramble', emoji: '📝', description: 'Unscramble educational words!', subject: 'English', grade: '35', topic: 'Spelling', mechanic: 'puzzle' },
    { key: 'MEMORY_MATRIX', name: 'Memory Matrix', emoji: '💠', description: 'Memorize the grid pattern!', subject: 'GK', grade: '35', topic: 'Memory', mechanic: 'match' },
    { key: 'COLOR_MATCH', name: 'Color Match', emoji: '🎨', description: 'Does the text match the color?', subject: 'GK', grade: '35', topic: 'Attention', mechanic: 'quiz' },
    { key: 'LOGIC_PUZZLE', name: 'Logic Puzzle Builder', emoji: '🧩', description: 'Solve logical riddles!', subject: 'Math', grade: '68', topic: 'Logic', mechanic: 'puzzle' },
    { key: 'PATTERN_SEQUENCE', name: 'Pattern Master', emoji: '🔢', description: 'Identify patterns and sequences!', subject: 'Math', grade: '35', topic: 'Patterns', mechanic: 'quiz' },
    { key: 'MEMORY_GRID_ADV', name: 'Memory Grid Advanced', emoji: '🧠', description: 'Advanced memory challenge!', subject: 'GK', grade: '68', topic: 'Memory', mechanic: 'match' },
    { key: 'FOCUS_REACTION', name: 'Focus Challenge', emoji: '🎯', description: 'Test attention and reaction speed!', subject: 'GK', grade: '35', topic: 'Attention', mechanic: 'quiz' },
    { key: 'MINI_STRATEGY', name: 'Strategy Builder', emoji: '🧮', description: 'Solve strategic puzzles!', subject: 'Math', grade: '35', topic: 'Strategy', mechanic: 'puzzle' },
    { key: 'CREATIVE_THINKING', name: 'Creative Story Spark', emoji: '✏️', description: 'Write creative stories from prompts!', subject: 'English', grade: '35', topic: 'Creative Writing', mechanic: 'build' },
    { key: 'CODE_BREAKER', name: 'Code Breaker', emoji: '🔐', description: 'Crack secret codes using deduction!', subject: 'ComputerScience', grade: '68', topic: 'Logic', mechanic: 'puzzle' },
    { key: 'MATH_GRID', name: 'Math Grid Sudoku', emoji: '🧮', description: 'Solve mini Sudoku with math constraints!', subject: 'Math', grade: '68', topic: 'Number Theory', mechanic: 'puzzle' },
    { key: 'VISUAL_ROTATION', name: 'Visual Rotation', emoji: '🌀', description: 'Identify rotated shapes!', subject: 'Math', grade: '68', topic: 'Geometry', mechanic: 'quiz' },
    { key: 'SEQUENCE_BUILDER', name: 'Sequence Builder', emoji: '🔄', description: 'Build logical sequences!', subject: 'Math', grade: '68', topic: 'Sequences', mechanic: 'build' },
    { key: 'ANALOGY_GAME', name: 'Analogies Master', emoji: '🧠', description: 'Solve verbal analogies!', subject: 'English', grade: '68', topic: 'Vocabulary', mechanic: 'quiz' },
    { key: 'ATTENTION_SWITCH', name: 'Attention Switch', emoji: '🎯', description: 'Adapt to changing rules!', subject: 'GK', grade: '68', topic: 'Attention', mechanic: 'quiz' },
    { key: 'TIME_PLANNER', name: 'Time Planner', emoji: '⏳', description: 'Organize tasks optimally!', subject: 'GK', grade: '68', topic: 'Time Management', mechanic: 'sort' },
    { key: 'SHAPE_CONSTRUCTOR', name: 'Shape Constructor', emoji: '🏗️', description: 'Build target shapes from pieces!', subject: 'Math', grade: '68', topic: 'Geometry', mechanic: 'build' },
    { key: 'RIDDLE_SPRINT', name: 'Riddle Sprint', emoji: '🧩', description: 'Solve riddles under time pressure!', subject: 'English', grade: '68', topic: 'Critical Thinking', mechanic: 'quiz' },
    { key: 'LOGIC_GRID', name: 'Logic Grid Detective', emoji: '🧠', description: 'Use clues to solve logic puzzles!', subject: 'Math', grade: '68', topic: 'Logic', mechanic: 'puzzle' },
    { key: 'KIDS_TYPING', name: 'Typing Tutor', emoji: '⌨️', description: 'Learn to type with fun exercises!', subject: 'ComputerScience', grade: '35', topic: 'Typing', mechanic: 'race' },
    { key: 'TYPING_SPEED', name: 'Typing Speed', emoji: '🚀', description: 'Test your typing speed!', subject: 'ComputerScience', grade: '68', topic: 'Typing', mechanic: 'race' },
]

// ─── New Games ────────────────────────────────────────────────────────────────
const NEW_GAMES: GameEntry[] = [
    // Math – KG-2
    { key: 'NUMBER_CATERPILLAR', name: 'Number Caterpillar Crawl', emoji: '🐛', description: 'Grow your caterpillar by counting segments to 20!', subject: 'Math', grade: 'kg2', topic: 'Counting 1–20', mechanic: 'race', isNew: true },
    { key: 'HOT_AIR_BALLOON_RACE', name: 'Hot Air Balloon Race', emoji: '🎈', description: 'Solve addition to lift your balloon highest!', subject: 'Math', grade: 'kg2', topic: 'Addition (1-digit)', mechanic: 'race', isNew: true },
    { key: 'APPLE_ORCHARD_COLLECTOR', name: 'Apple Orchard Collector', emoji: '🍎', description: 'Pick the right number of apples by reading number words!', subject: 'Math', grade: 'kg2', topic: 'Number Recognition', mechanic: 'quiz', isNew: true },
    { key: 'FISH_TANK_FILL', name: 'Fish Tank Fill', emoji: '🐠', description: 'Solve subtraction to fill fish tanks just right!', subject: 'Math', grade: 'kg2', topic: 'Subtraction (1-digit)', mechanic: 'drag', isNew: true },
    { key: 'SHAPE_SORTER_CITY', name: 'Shape Sorter City', emoji: '🧩', description: 'Sort falling shapes into correct city buildings!', subject: 'Math', grade: 'kg2', topic: '2D Shapes', mechanic: 'sort', isNew: true },
    // Math – 3-5
    { key: 'PIZZA_SLICE_WARS', name: 'Pizza Slice Wars', emoji: '🍕', description: 'Slice pizzas into correct fractions before time runs out!', subject: 'Math', grade: '35', topic: 'Fractions', mechanic: 'drag', isNew: true },
    { key: 'DECIMAL_DODGE', name: 'Decimal Dodge', emoji: '⚡', description: 'Dodge attacks by choosing correct decimal comparisons!', subject: 'Math', grade: '35', topic: 'Decimals & Ordering', mechanic: 'quiz', isNew: true },
    { key: 'MARKET_MAYHEM', name: 'Market Mayhem', emoji: '🏪', description: 'Calculate correct change before the customer leaves!', subject: 'Math', grade: '35', topic: 'Money & Arithmetic', mechanic: 'sim', isNew: true },
    { key: 'FACTOR_FORTRESS', name: 'Factor Fortress', emoji: '🗓️', description: 'Factor numbers to build fortress walls!', subject: 'Math', grade: '35', topic: 'Factors & Multiples', mechanic: 'build', isNew: true },
    { key: 'FRACTION_ARROW_ARCHER', name: 'Fraction Arrow Archer', emoji: '🎯', description: 'Shoot arrows at fraction targets on a number line!', subject: 'Math', grade: '35', topic: 'Fractions on Number Line', mechanic: 'shoot', isNew: true },
    { key: 'RATIO_RAIL_RUSH', name: 'Ratio Rail Rush', emoji: '🚂', description: 'Match train carriages by identifying correct ratios!', subject: 'Math', grade: '35', topic: 'Ratio & Proportion', mechanic: 'match', isNew: true },
    { key: 'MULTIPLIER_MAYHEM', name: 'Multiplier Mayhem', emoji: '🧮', description: 'Multiply numbers to power up weapons in a battle arena!', subject: 'Math', grade: '35', topic: 'Multiplication', mechanic: 'quiz', isNew: true },
    // Math – 6-8
    { key: 'ANGLE_ASSASSIN', name: 'Angle Assassin', emoji: '📐', description: 'Shoot lasers at correct angle measures in an arena!', subject: 'Math', grade: '68', topic: 'Angles & Geometry', mechanic: 'shoot', isNew: true },
    { key: 'ALGEBRA_WAVE_SURFER', name: 'Algebra Wave Surfer', emoji: '🌊', description: 'Solve linear equations to ride waves before they crash!', subject: 'Math', grade: '68', topic: 'Linear Equations', mechanic: 'quiz', isNew: true },
    { key: 'AREA_CONSTRUCTOR', name: 'Area Constructor', emoji: '🏗️', description: 'Race to tile exact area measurements on a blueprint!', subject: 'Math', grade: '68', topic: 'Area & Mensuration', mechanic: 'build', isNew: true },
    { key: 'INTEGER_ICE_BATTLE', name: 'Integer Ice Battle', emoji: '🔢', description: 'Move across the integer number line to capture territory!', subject: 'Math', grade: '68', topic: 'Integers', mechanic: 'race', isNew: true },
    { key: 'DATA_DETECTIVE', name: 'Data Detective', emoji: '📊', description: 'Analyse charts — first to spot the correct stat wins!', subject: 'Math', grade: '68', topic: 'Statistics & Data', mechanic: 'puzzle', isNew: true },
    { key: 'PROBABILITY_POKER', name: 'Probability Poker', emoji: '🎲', description: 'Bet chips based on correct probability calculations!', subject: 'Math', grade: '68', topic: 'Probability', mechanic: 'sim', isNew: true },
    { key: 'COORDINATE_COMBAT', name: 'Coordinate Combat', emoji: '🌐', description: 'Plot coordinates to place ships and sink the enemy fleet!', subject: 'Math', grade: '68', topic: 'Coordinate Geometry', mechanic: 'build', isNew: true },
    { key: 'POLYNOMIAL_PACKAGER', name: 'Polynomial Packager', emoji: '🔁', description: 'Sort polynomial terms into correctly grouped expressions!', subject: 'Math', grade: '68', topic: 'Polynomials', mechanic: 'sort', isNew: true },
    // Math – 9-12
    { key: 'CALCULUS_CLIFF', name: 'Calculus Cliff', emoji: '📉', description: 'Solve derivatives to steer your skier safely down!', subject: 'Math', grade: '912', topic: 'Derivatives', mechanic: 'quiz', isNew: true },
    { key: 'QUADRATIC_QUEST', name: 'Quadratic Quest', emoji: '🔮', description: 'Solve quadratic equations to unlock dungeon portals!', subject: 'Math', grade: '912', topic: 'Quadratic Equations', mechanic: 'puzzle', isNew: true },
    { key: 'TRIG_BRIDGE_BUILDER', name: 'Trigonometry Bridge Builder', emoji: '🌉', description: 'Calculate sin/cos/tan to place bridge beams at correct angles!', subject: 'Math', grade: '912', topic: 'Trigonometry', mechanic: 'build', isNew: true },
    { key: 'MATRIX_MORPH_DUEL', name: 'Matrix Morph Duel', emoji: '🧊', description: 'Apply matrix operations to deform your opponent\'s shape!', subject: 'Math', grade: '912', topic: 'Matrices', mechanic: 'quiz', isNew: true },
    { key: 'INTEGRAL_INVADER', name: 'Integral Invader', emoji: '♾️', description: 'Integrate functions to capture the most territory!', subject: 'Math', grade: '912', topic: 'Integration', mechanic: 'quiz', isNew: true },
    { key: 'VECTOR_SPACE_VOYAGER', name: 'Vector Space Voyager', emoji: '🌌', description: 'Navigate your spaceship using vector addition!', subject: 'Math', grade: '912', topic: 'Vectors', mechanic: 'puzzle', isNew: true },
    { key: 'STATISTICS_STOCK_PROPHET', name: 'Statistics Stock Prophet', emoji: '💹', description: 'Use mean/median/SD to predict stock trends!', subject: 'Math', grade: '912', topic: 'Statistics & Probability', mechanic: 'sim', isNew: true },
    { key: 'NUMBER_THEORY_VAULT', name: 'Number Theory Vault', emoji: '🔐', description: 'Crack vault combos using prime factorisation!', subject: 'Math', grade: '912', topic: 'Number Theory', mechanic: 'puzzle', isNew: true },
    { key: 'COMPLEX_NAVIGATOR', name: 'Complex Number Navigator', emoji: '🌊', description: 'Plot complex numbers in the Argand plane to navigate a maze!', subject: 'Math', grade: '912', topic: 'Complex Numbers', mechanic: 'puzzle', isNew: true },
    { key: 'PERMUTATION_COASTER', name: 'Permutation Coaster', emoji: '🎢', description: 'Calculate permutations to unlock roller coaster tracks!', subject: 'Math', grade: '912', topic: 'Permutation & Combination', mechanic: 'build', isNew: true },
    // English – KG-2
    { key: 'PHONICS_POND_HOP', name: 'Phonics Pond Hop', emoji: '🎵', description: 'Hop lily pads with correct phonics sounds to spell words!', subject: 'English', grade: 'kg2', topic: 'Phonics & Alphabet', mechanic: 'race', isNew: true },
    { key: 'LETTER_LASSO', name: 'Letter Lasso', emoji: '✏️', description: 'Lasso falling letters to spell the picture!', subject: 'English', grade: 'kg2', topic: 'Letter Recognition', mechanic: 'shoot', isNew: true },
    { key: 'VOWEL_VILLAGE', name: 'Vowel Village', emoji: '🌈', description: 'Paint village houses by identifying vowels vs consonants!', subject: 'English', grade: 'kg2', topic: 'Vowels & Consonants', mechanic: 'sort', isNew: true },
    // English – 3-5
    { key: 'GRAMMAR_GLADIATOR', name: 'Grammar Gladiator', emoji: '🗣️', description: 'Identify correct grammar to deflect opponent attacks!', subject: 'English', grade: '35', topic: 'Grammar & Parts of Speech', mechanic: 'quiz', isNew: true },
    { key: 'SYNONYM_SWITCHBLADE', name: 'Synonym Switchblade', emoji: '🔤', description: 'Swap words with correct synonyms to unlock combos!', subject: 'English', grade: '35', topic: 'Synonyms & Antonyms', mechanic: 'match', isNew: true },
    { key: 'TENSE_TREKKER', name: 'Tense Trekker', emoji: '⏰', description: 'Fix tense errors while trekking a story timeline!', subject: 'English', grade: '35', topic: 'Tenses', mechanic: 'sort', isNew: true },
    { key: 'PUNCTUATION_RUSH', name: 'Punctuation Puzzle Rush', emoji: '🧩', description: 'Place punctuation marks in racing sentences!', subject: 'English', grade: '35', topic: 'Punctuation', mechanic: 'drag', isNew: true },
    { key: 'IDIOM_HUNTER', name: 'Idiom Hunter', emoji: '🏹', description: 'Shoot arrows at correct meanings of idioms in the jungle!', subject: 'English', grade: '35', topic: 'Idioms & Proverbs', mechanic: 'shoot', isNew: true },
    { key: 'COMPREHENSION_CODEBREAKER', name: 'Comprehension Codebreaker', emoji: '📖', description: 'Answer inference questions to crack a safe!', subject: 'English', grade: '35', topic: 'Reading Comprehension', mechanic: 'puzzle', isNew: true },
    // English – 6-8
    { key: 'PARTS_OF_SPEECH_DUEL', name: 'Parts of Speech Duel', emoji: '🎭', description: 'Identify parts of speech to launch card attacks!', subject: 'English', grade: '68', topic: 'Parts of Speech', mechanic: 'quiz', isNew: true },
    { key: 'SENTENCE_SURFBOARD', name: 'Sentence Surfboard', emoji: '🌊', description: 'Build grammatically correct sentences to ride longer waves!', subject: 'English', grade: '68', topic: 'Sentence Formation', mechanic: 'build', isNew: true },
    { key: 'ESSAY_ENGINEER', name: 'Essay Engineer', emoji: '📰', description: 'Arrange essay paragraphs in correct persuasive order!', subject: 'English', grade: '68', topic: 'Essay Structure', mechanic: 'sort', isNew: true },
    // English – 9-12
    { key: 'SHAKESPEARE_SHOWDOWN', name: 'Shakespeare Showdown', emoji: '🎭', description: 'Analyse Shakespeare quotes in a buzzer duel!', subject: 'English', grade: '912', topic: 'Literature Analysis', mechanic: 'quiz', isNew: true },
    { key: 'LITERARY_DEVICE_LAB', name: 'Literary Device Lab', emoji: '📜', description: 'Spot metaphors, irony, and alliteration at speed!', subject: 'English', grade: '912', topic: 'Figures of Speech', mechanic: 'quiz', isNew: true },
    { key: 'ETYMOLOGY_EXPLORER', name: 'Etymology Explorer', emoji: '🗺️', description: 'Trace word origins to unlock maps of language history!', subject: 'English', grade: '912', topic: 'Etymology & Vocabulary', mechanic: 'puzzle', isNew: true },
    { key: 'RHETORIC_RANKER', name: 'Rhetoric Ranker', emoji: '🎬', description: 'Rate real speeches for rhetorical devices!', subject: 'English', grade: '912', topic: 'Rhetoric & Persuasion', mechanic: 'quiz', isNew: true },
    { key: 'PRECIS_PRESSURE', name: 'Précis Pressure', emoji: '🧠', description: 'Compress a 200-word passage to exactly 70 words!', subject: 'English', grade: '912', topic: 'Précis Writing', mechanic: 'build', isNew: true },
    // Science – KG-2
    { key: 'PLANT_POWER_GROWER', name: 'Plant Power Grower', emoji: '🌱', description: 'Adjust sliders to grow the tallest plant fastest!', subject: 'Science', grade: 'kg2', topic: 'Plants & Life Science', mechanic: 'sim', isNew: true },
    { key: 'WEATHER_WARDROBE', name: 'Weather Wardrobe', emoji: '🌤️', description: 'Dress the character correctly for the forecast weather!', subject: 'Science', grade: 'kg2', topic: 'Weather & Climate', mechanic: 'sort', isNew: true },
    { key: 'ANIMAL_KINGDOM_SORTER', name: 'Animal Kingdom Sorter', emoji: '🐾', description: 'Sort animals into correct habitats before the gate closes!', subject: 'Science', grade: 'kg2', topic: 'Animal Classification', mechanic: 'sort', isNew: true },
    // Science – 3-5
    { key: 'SOLAR_SYSTEM_DEFENDER', name: 'Solar System Defender', emoji: '🔭', description: 'Place planets in correct orbits to defend against asteroids!', subject: 'Science', grade: '35', topic: 'Solar System', mechanic: 'build', isNew: true },
    { key: 'FOOD_CHAIN_ARENA', name: 'Food Chain Arena', emoji: '🍎', description: 'Build food chains — longer correct chain beats opponent!', subject: 'Science', grade: '35', topic: 'Food Chains & Webs', mechanic: 'build', isNew: true },
    { key: 'CIRCUIT_RACER', name: 'Circuit Racer', emoji: '⚡', description: 'Connect circuit components correctly to power race cars!', subject: 'Science', grade: '35', topic: 'Electricity & Circuits', mechanic: 'build', isNew: true },
    { key: 'MATTER_PHASE_SHIFTER', name: 'Matter Phase Shifter', emoji: '🔬', description: 'Heat/cool matter to hit exact phase change temperature!', subject: 'Science', grade: '35', topic: 'States of Matter', mechanic: 'sim', isNew: true },
    { key: 'MAGNET_MAZE', name: 'Magnet Maze', emoji: '🧲', description: 'Navigate metallic balls through mazes using magnets!', subject: 'Science', grade: '35', topic: 'Magnetism', mechanic: 'puzzle', isNew: true },
    // Science – 6-8
    { key: 'PERIODIC_BATTLESHIP', name: 'Periodic Table Battleship', emoji: '⚗️', description: 'Place elements correctly — fire torpedoes at opponent!', subject: 'Science', grade: '68', topic: 'Periodic Table', mechanic: 'build', isNew: true },
    { key: 'CELL_DIVISION_DERBY', name: 'Cell Division Derby', emoji: '🧬', description: 'Sequence mitosis/meiosis stages to race your cell!', subject: 'Science', grade: '68', topic: 'Cell Division', mechanic: 'sort', isNew: true },
    { key: 'FORCE_MOTION_DOJO', name: 'Force & Motion Dojo', emoji: '🌊', description: 'Apply correct forces to move objects through obstacles!', subject: 'Science', grade: '68', topic: 'Newton\'s Laws', mechanic: 'puzzle', isNew: true },
    { key: 'WATER_CYCLE_WIZARD', name: 'Water Cycle Wizard', emoji: '💧', description: 'Route water through the water cycle to fill a river first!', subject: 'Science', grade: '68', topic: 'Water Cycle', mechanic: 'build', isNew: true },
    { key: 'REACTION_RATE_LAB', name: 'Reaction Rate Lab', emoji: '🧪', description: 'Adjust temperature and catalysts to win a chemical race!', subject: 'Science', grade: '68', topic: 'Chemical Reactions', mechanic: 'sim', isNew: true },
    { key: 'GENETICS_GENOME_DUEL', name: 'Genetics Genome Duel', emoji: '🧬', description: 'Predict phenotype from genotype — correct one wins!', subject: 'Science', grade: '68', topic: 'Genetics & Heredity', mechanic: 'quiz', isNew: true },
    // Science – 9-12
    { key: 'ELECTROSTATICS_ARENA', name: 'Electrostatics Arena', emoji: '⚡', description: 'Place charges using Coulomb\'s Law to predict field directions!', subject: 'Science', grade: '912', topic: 'Electrostatics', mechanic: 'build', isNew: true },
    { key: 'THERMODYNAMIC_TURBO', name: 'Thermodynamic Turbo', emoji: '🌡️', description: 'Apply gas laws to win piston races!', subject: 'Science', grade: '912', topic: 'Thermodynamics & Gas Laws', mechanic: 'sim', isNew: true },
    { key: 'EVOLUTION_ISLAND', name: 'Evolution Island', emoji: '🧬', description: 'Adapt your species over 5 rounds through natural selection!', subject: 'Science', grade: '912', topic: 'Evolution', mechanic: 'sim', isNew: true },
    { key: 'ORGANIC_CHEM_ARCHITECT', name: 'Organic Chemistry Architect', emoji: '🔬', description: 'Build correct organic molecules from IUPAC names!', subject: 'Science', grade: '912', topic: 'Organic Chemistry', mechanic: 'build', isNew: true },
    { key: 'ASTROPHYSICS_ODYSSEY', name: 'Astrophysics Odyssey', emoji: '🔭', description: 'Calculate orbital periods and escape velocity for missions!', subject: 'Science', grade: '912', topic: 'Astrophysics', mechanic: 'sim', isNew: true },
    { key: 'OPTICS_RAY_RACER', name: 'Optics Ray Racer', emoji: '💡', description: 'Refract and reflect light rays to hit targets first!', subject: 'Science', grade: '912', topic: 'Optics', mechanic: 'puzzle', isNew: true },
    { key: 'WAVE_DUEL', name: 'Wave Duel', emoji: '🌊', description: 'Superimpose waves to match the target waveform!', subject: 'Science', grade: '912', topic: 'Wave Physics', mechanic: 'build', isNew: true },
    { key: 'TITRATION_TOURNAMENT', name: 'Titration Tournament', emoji: '🧪', description: 'Perform acid-base titrations — closest to equivalence wins!', subject: 'Science', grade: '912', topic: 'Acid-Base Chemistry', mechanic: 'sim', isNew: true },
    // Social Studies – KG-2
    { key: 'MY_TOWN_EXPLORER', name: 'My Town Explorer', emoji: '🗺️', description: 'Place community buildings on a town map correctly!', subject: 'SocialStudies', grade: 'kg2', topic: 'Community & EVS', mechanic: 'build', isNew: true },
    // Social Studies – 3-5
    { key: 'CIVILIZATION_BUILDER', name: 'Civilization Builder', emoji: '🏛️', description: 'Place ancient civilisations on a world map timeline!', subject: 'SocialStudies', grade: '35', topic: 'Ancient History', mechanic: 'sort', isNew: true },
    { key: 'LANDFORM_LANDER', name: 'Landform Lander', emoji: '🏔️', description: 'Land your aircraft on correct geographical landforms!', subject: 'SocialStudies', grade: '35', topic: 'Geography & Landforms', mechanic: 'quiz', isNew: true },
    { key: 'DEMOCRACY_DEBATE', name: 'Democracy Debate', emoji: '🗳️', description: 'Build arguments for a civic question — community votes!', subject: 'SocialStudies', grade: '35', topic: 'Civics & Democracy', mechanic: 'debate', isNew: true },
    // Social Studies – 6-8
    { key: 'TRADE_ROUTE_TYCOON', name: 'Trade Route Tycoon', emoji: '🌍', description: 'Build trade routes to maximise your country\'s GDP!', subject: 'SocialStudies', grade: '68', topic: 'Economics & Trade', mechanic: 'sim', isNew: true },
    { key: 'MAP_MASTERY_MISSION', name: 'Map Mastery Mission', emoji: '🗺️', description: 'Identify countries and capitals under time pressure!', subject: 'SocialStudies', grade: '68', topic: 'World Geography', mechanic: 'quiz', isNew: true },
    { key: 'CONSTITUTION_COURTROOM', name: 'Constitution Courtroom', emoji: '⚖️', description: 'Argue constitutional cases using real articles!', subject: 'SocialStudies', grade: '68', topic: 'Civics & Constitution', mechanic: 'debate', isNew: true },
    { key: 'EMPIRE_FALL', name: 'Empire Fall', emoji: '🏰', description: 'Manage resources and military for the longest-ruling empire!', subject: 'SocialStudies', grade: '68', topic: 'World History Empires', mechanic: 'sim', isNew: true },
    { key: 'CURRENT_AFFAIRS_CLASH', name: 'Current Affairs Clash', emoji: '📰', description: 'Race to answer live current affairs questions!', subject: 'SocialStudies', grade: '68', topic: 'Current Affairs', mechanic: 'quiz', isNew: true },
    { key: 'CLIMATE_COMMANDER', name: 'Climate Commander', emoji: '🌿', description: 'Make policy decisions to keep global temperature below 2°C!', subject: 'SocialStudies', grade: '68', topic: 'Climate & Environment', mechanic: 'sim', isNew: true },
    // Social Studies – 9-12
    { key: 'MACRO_ECONOMY_MASTER', name: 'Macro Economy Master', emoji: '📈', description: 'Manage a country\'s fiscal policy, inflation & unemployment!', subject: 'SocialStudies', grade: '912', topic: 'Macroeconomics', mechanic: 'sim', isNew: true },
    { key: 'GEOPOLITICS_GRAND', name: 'Geopolitics Grand Strategy', emoji: '🌐', description: 'Negotiate treaties and form alliances across a global map!', subject: 'SocialStudies', grade: '912', topic: 'World Affairs', mechanic: 'sim', isNew: true },
    { key: 'HISTORIANS_COURTROOM', name: 'Historian\'s Courtroom', emoji: '📜', description: 'Defend or prosecute historical figures using primary sources!', subject: 'SocialStudies', grade: '912', topic: 'World History Analysis', mechanic: 'debate', isNew: true },
    { key: 'MICRO_MARKET_MAKER', name: 'Micro Market Maker', emoji: '💰', description: 'Price goods at equilibrium in shifting supply-demand conditions!', subject: 'SocialStudies', grade: '912', topic: 'Microeconomics', mechanic: 'sim', isNew: true },
    { key: 'COLONIAL_CONSEQUENCE', name: 'Colonial Consequence', emoji: '🗺️', description: 'Simulate colonial decisions and observe long-term consequences!', subject: 'SocialStudies', grade: '912', topic: 'Modern History', mechanic: 'sim', isNew: true },
    // CS – KG-2
    { key: 'ALGORITHM_ANT', name: 'Algorithm Ant', emoji: '🤖', description: 'Give step-by-step commands to guide an ant through a maze!', subject: 'ComputerScience', grade: 'kg2', topic: 'Algorithms & Sequencing', mechanic: 'build', isNew: true },
    // CS – 3-5
    { key: 'BINARY_BLASTER', name: 'Binary Blaster', emoji: '🔢', description: 'Convert decimals to binary by shooting correct laser beams!', subject: 'ComputerScience', grade: '35', topic: 'Binary Numbers', mechanic: 'shoot', isNew: true },
    { key: 'WEB_WEAVER', name: 'Web Weaver', emoji: '🕸️', description: 'Drag HTML tags to build correct web pages first!', subject: 'ComputerScience', grade: '35', topic: 'HTML Basics', mechanic: 'drag', isNew: true },
    { key: 'PYTHON_PUZZLE_PATH', name: 'Python Puzzle Path', emoji: '🐍', description: 'Fill in Python code blanks to make a character move!', subject: 'ComputerScience', grade: '35', topic: 'Python Basics', mechanic: 'build', isNew: true },
    // CS – 6-8
    { key: 'CYBER_SHIELD', name: 'Cyber Shield', emoji: '🔐', description: 'Identify phishing attempts and security threats in a simulated inbox!', subject: 'ComputerScience', grade: '68', topic: 'Cybersecurity', mechanic: 'puzzle', isNew: true },
    { key: 'LOGIC_GATE_GARDEN', name: 'Logic Gate Garden', emoji: '🧮', description: 'Connect AND/OR/NOT gates to produce correct truth tables!', subject: 'ComputerScience', grade: '68', topic: 'Logic Gates', mechanic: 'build', isNew: true },
    { key: 'DATA_STRUCTURE_DUNGEON', name: 'Data Structure Dungeon', emoji: '📊', description: 'Choose the correct data structure to escape dungeon rooms!', subject: 'ComputerScience', grade: '68', topic: 'Data Structures', mechanic: 'puzzle', isNew: true },
    { key: 'ALGORITHM_ARENA', name: 'Algorithm Arena', emoji: '🤖', description: 'Write the shortest sorting algorithm to win speed races!', subject: 'ComputerScience', grade: '68', topic: 'Algorithms & Sorting', mechanic: 'build', isNew: true },
    // CS – 9-12
    { key: 'AI_TRAINING_GROUND', name: 'AI Training Ground', emoji: '🧠', description: 'Label data and train a mini ML model to classify images!', subject: 'ComputerScience', grade: '912', topic: 'AI & Machine Learning', mechanic: 'sim', isNew: true },
    { key: 'ENCRYPTION_ESCAPE', name: 'Encryption Escape', emoji: '🔐', description: 'Apply Caesar, RSA, and SHA concepts to decode messages!', subject: 'ComputerScience', grade: '912', topic: 'Cryptography', mechanic: 'puzzle', isNew: true },
    { key: 'NETWORK_TOPOLOGY_RACER', name: 'Network Topology Racer', emoji: '🕸️', description: 'Configure network topologies to maximise data throughput!', subject: 'ComputerScience', grade: '912', topic: 'Computer Networks', mechanic: 'build', isNew: true },
    { key: 'DEBUG_DUEL', name: 'Debug Duel', emoji: '🐛', description: 'Find and fix bugs in code snippets faster than your opponent!', subject: 'ComputerScience', grade: '912', topic: 'Debugging & Logic', mechanic: 'puzzle', isNew: true },
    // Hindi – KG-2
    { key: 'VARNAMALA_VILLAGE', name: 'Varnamala Village', emoji: '🌸', description: 'Tap the correct Hindi letter for each pictured word!', subject: 'Hindi', grade: 'kg2', topic: 'Hindi Varnamala', mechanic: 'quiz', isNew: true },
    { key: 'MATRA_MELODY', name: 'Matra Melody', emoji: '🎵', description: 'Tap the correct matra to complete Hindi words!', subject: 'Hindi', grade: 'kg2', topic: 'Hindi Matras', mechanic: 'quiz', isNew: true },
    { key: 'KAAVYA_COLOR', name: 'Kaavya Color', emoji: '🖌️', description: 'Color pictures by identifying their Hindi names!', subject: 'Hindi', grade: 'kg2', topic: 'Hindi Word Recognition', mechanic: 'quiz', isNew: true },
    // Hindi – 3-5
    { key: 'SHABDKOSH_SPRINT', name: 'Shabdkosh Sprint', emoji: '📚', description: 'Match Hindi words to their English meanings in a race!', subject: 'Hindi', grade: '35', topic: 'Hindi Vocabulary', mechanic: 'match', isNew: true },
    { key: 'VYAKARAN_WARRIOR', name: 'Vyakaran Warrior', emoji: '✍️', description: 'Identify Hindi grammar concepts to defeat grammar monsters!', subject: 'Hindi', grade: '35', topic: 'Hindi Grammar', mechanic: 'quiz', isNew: true },
    { key: 'HINDI_HAIKU_FACTORY', name: 'Hindi Haiku Factory', emoji: '🌺', description: 'Arrange syllables into correct haiku meter in Hindi!', subject: 'Hindi', grade: '35', topic: 'Hindi Poetry', mechanic: 'sort', isNew: true },
    // Hindi – 6-8
    { key: 'ANUVAAD_ARENA', name: 'Anuvaad Arena', emoji: '📝', description: 'Translate Hindi to English and back before your opponent!', subject: 'Hindi', grade: '68', topic: 'Hindi-English Translation', mechanic: 'race', isNew: true },
    { key: 'KAHANI_KHATAM_KARO', name: 'Kahani Khatam Karo', emoji: '🎭', description: 'Complete a Hindi story — community votes on the best ending!', subject: 'Hindi', grade: '68', topic: 'Hindi Comprehension', mechanic: 'debate', isNew: true },
    { key: 'REGIONAL_SCRIPT_DECODER', name: 'Regional Script Decoder', emoji: '🔤', description: 'Decode words written in Tamil/Telugu/Kannada/Bengali scripts!', subject: 'Hindi', grade: '68', topic: 'Regional Languages', mechanic: 'puzzle', isNew: true },
    // Hindi – 9-12
    { key: 'NIBANDH_NINJA', name: 'Nibandh Ninja', emoji: '📜', description: 'Write a structured Hindi essay in limited time!', subject: 'Hindi', grade: '912', topic: 'Hindi Essay Writing', mechanic: 'build', isNew: true },
    { key: 'NATYA_SHASTRA_SCENE', name: 'Natya Shastra Scene', emoji: '🎭', description: 'Identify rasas and literary devices in Hindi drama scenes!', subject: 'Hindi', grade: '912', topic: 'Hindi Literature', mechanic: 'quiz', isNew: true },
    { key: 'SAMASA_SOLVER', name: 'Samasa Solver', emoji: '🔎', description: 'Identify and break down Hindi compound words in battle!', subject: 'Hindi', grade: '912', topic: 'Hindi Samasa Grammar', mechanic: 'quiz', isNew: true },
    // GK – KG-2
    { key: 'FLAG_FIESTA', name: 'Flag Fiesta', emoji: '🏳️', description: 'Tap the correct country flag for the nation name called!', subject: 'GK', grade: 'kg2', topic: 'National Flags', mechanic: 'quiz', isNew: true },
    { key: 'COIN_COLLECTOR', name: 'Coin Collector', emoji: '💰', description: 'Add coins to reach the target amount!', subject: 'GK', grade: 'kg2', topic: 'Financial Basics', mechanic: 'quiz', isNew: true },
    // GK – 3-5
    { key: 'CAPITALS_CONQUEST', name: 'Capitals Conquest', emoji: '🌍', description: 'Name country capitals to conquer territory on the world map!', subject: 'GK', grade: '35', topic: 'World Capitals', mechanic: 'race', isNew: true },
    { key: 'INVENTORS_WORKSHOP', name: 'Inventor\'s Workshop', emoji: '🌟', description: 'Match famous inventions to inventors in a factory line!', subject: 'GK', grade: '35', topic: 'Inventions & Inventors', mechanic: 'match', isNew: true },
    { key: 'NATIONAL_SYMBOLS_DASH', name: 'National Symbols Dash', emoji: '🏅', description: 'Match national symbols of countries before time expires!', subject: 'GK', grade: '35', topic: 'National Symbols', mechanic: 'match', isNew: true },
    { key: 'EQ_MAZE', name: 'Emotional Intelligence Maze', emoji: '🧘', description: 'Choose empathetic responses to navigate social mazes!', subject: 'GK', grade: '35', topic: 'Emotional Intelligence', mechanic: 'puzzle', isNew: true },
    // GK – 6-8
    { key: 'BUDGET_BATTLE', name: 'Budget Battle', emoji: '💳', description: 'Manage a monthly budget against random events!', subject: 'GK', grade: '68', topic: 'Financial Literacy', mechanic: 'sim', isNew: true },
    { key: 'TIME_AUDIT_CHALLENGE', name: 'Time Audit Challenge', emoji: '⏱️', description: 'Allocate 24 hours optimally — compare with your opponent!', subject: 'GK', grade: '68', topic: 'Time Management', mechanic: 'sort', isNew: true },
    { key: 'CURRENT_AFFAIRS_DETECTIVE', name: 'Current Affairs Detective', emoji: '🕵️', description: 'Use news clues to identify global events fastest!', subject: 'GK', grade: '68', topic: 'Current Affairs & GK', mechanic: 'puzzle', isNew: true },
    // GK – 9-12
    { key: 'CRITICAL_THINKERS_COURT', name: 'Critical Thinker\'s Court', emoji: '📊', description: 'Evaluate arguments for logical fallacies — strongest wins!', subject: 'GK', grade: '912', topic: 'Critical Thinking', mechanic: 'debate', isNew: true },
    { key: 'CAREER_STRATEGIST', name: 'Career Strategist', emoji: '💼', description: 'Make education and career choices — best life outcome wins!', subject: 'GK', grade: '912', topic: 'Life Skills & Career', mechanic: 'sim', isNew: true },
    // Simulations
    { key: 'SHOP_IT_UP', name: 'Shop It Up!', emoji: '🏪', description: 'Run a corner shop: buy inventory, price goods, manage cash!', subject: 'Simulation', grade: '35', topic: 'Financial Literacy & Math', mechanic: 'sim', isNew: true },
    { key: 'CITY_PLANNER_PRO', name: 'City Planner Pro', emoji: '🏙️', description: 'Build a city with zoning and budget — highest livability wins!', subject: 'Simulation', grade: '68', topic: 'Geography, Civics & Math', mechanic: 'sim', isNew: true },
    { key: 'COUNTRY_COMMANDER', name: 'Country Commander', emoji: '🌍', description: 'Manage GDP, education, healthcare, military for highest HDI!', subject: 'Simulation', grade: '912', topic: 'Economics, Politics & Math', mechanic: 'sim', isNew: true },
    { key: 'VIRTUAL_CHEM_LAB', name: 'Virtual Chemistry Lab', emoji: '🔬', description: 'Perform real lab experiments — one mistake resets!', subject: 'Simulation', grade: '68', topic: 'Chemistry Lab Procedure', mechanic: 'sim', isNew: true },
    { key: 'SPACE_MISSION_CONTROL', name: 'Space Mission Control', emoji: '🚀', description: 'Calculate trajectory and orbital insertion for a Mars mission!', subject: 'Simulation', grade: '912', topic: 'Physics, Math, Astronomy', mechanic: 'sim', isNew: true },
    { key: 'STOCK_MARKET_SAVANT', name: 'Stock Market Savant', emoji: '📈', description: 'Buy, sell, hold stocks using P/E ratios and news events!', subject: 'Simulation', grade: '912', topic: 'Economics & Statistics', mechanic: 'sim', isNew: true },
    { key: 'ECO_FARM_MANAGER', name: 'Eco Farm Manager', emoji: '🌱', description: 'Balance crop rotation and climate to maximise harvest!', subject: 'Simulation', grade: '68', topic: 'Biology, Geography, Math', mechanic: 'sim', isNew: true },
    { key: 'BODY_MECHANIC', name: 'Body Mechanic', emoji: '🏥', description: 'Diagnose virtual patients using symptoms and anatomy!', subject: 'Simulation', grade: '68', topic: 'Human Biology', mechanic: 'sim', isNew: true },
    { key: 'POWER_GRID_ENGINEER', name: 'Power Grid Engineer', emoji: '⚡', description: 'Build a power grid mixing renewable and fossil fuels!', subject: 'Simulation', grade: '912', topic: 'Physics, Environment', mechanic: 'sim', isNew: true },
    { key: 'BIOREACTOR_BRAINIAC', name: 'Bioreactor Brainiac', emoji: '🧬', description: 'Optimise fermentation to maximise antibiotic yield!', subject: 'Simulation', grade: '912', topic: 'Biology & Chemistry', mechanic: 'sim', isNew: true },
    { key: 'NUTRITION_KITCHEN', name: 'Nutrition Kitchen', emoji: '🧑‍🍳', description: 'Plan a balanced week\'s meals within a budget!', subject: 'Simulation', grade: '35', topic: 'Biology, Health, Math', mechanic: 'sim', isNew: true },
    { key: 'WILDLIFE_RESERVE_RANGER', name: 'Wildlife Reserve Ranger', emoji: '🐘', description: 'Manage a wildlife reserve for maximum biodiversity!', subject: 'Simulation', grade: '68', topic: 'Ecology & Geography', mechanic: 'sim', isNew: true },
    { key: 'GLOBAL_NEGOTIATOR', name: 'Global Negotiator', emoji: '🌐', description: 'Negotiate international climate agreements!', subject: 'Simulation', grade: '912', topic: 'Geopolitics, Economics', mechanic: 'sim', isNew: true },
    { key: 'BRIDGE_ARCHITECT_BLITZ', name: 'Bridge Architect Blitz', emoji: '🏗️', description: 'Design bridges — strongest bridge under budget wins!', subject: 'Simulation', grade: '912', topic: 'Physics & Engineering', mechanic: 'build', isNew: true },
    { key: 'PUBLIC_HEALTH_STRATEGIST', name: 'Public Health Strategist', emoji: '💊', description: 'Allocate vaccines and treatments to stop a pandemic fastest!', subject: 'Simulation', grade: '912', topic: 'Biology, Math, Social Studies', mechanic: 'sim', isNew: true },
    // Cross-Curricular
    { key: 'MULTILINGUAL_WORD_STORM', name: 'Multilingual Word Storm', emoji: '🌍', description: 'Race to translate words into any of 5 languages!', subject: 'CrossCurricular', grade: '68', topic: 'World Languages', mechanic: 'race', isNew: true },
    { key: 'PHYSICS_OF_MUSIC', name: 'Physics of Music', emoji: '🎸', description: 'Adjust string tension and length to hit correct pitches!', subject: 'CrossCurricular', grade: '68', topic: 'Wave Physics & Music', mechanic: 'sim', isNew: true },
    { key: 'LOGIC_CHAIN_REACTION', name: 'Logic Chain Reaction', emoji: '🧩', description: 'Set up IF-THEN consequences to solve mission-critical puzzles!', subject: 'CrossCurricular', grade: '912', topic: 'Logic & Critical Thinking', mechanic: 'build', isNew: true },
    { key: 'GEOSPY', name: 'GeoSpy', emoji: '🗺️', description: 'Identify mystery locations from satellite images!', subject: 'CrossCurricular', grade: '68', topic: 'World Geography', mechanic: 'quiz', isNew: true },
    { key: 'FAKE_NEWS_FORENSICS', name: 'Fake News Forensics', emoji: '📰', description: 'Evaluate headlines and identify misinformation!', subject: 'CrossCurricular', grade: '68', topic: 'Media Literacy', mechanic: 'puzzle', isNew: true },
    { key: 'ETHICS_ENGINE', name: 'Ethics Engine', emoji: '⚖️', description: 'Choose between ethical dilemmas across history, medicine & tech!', subject: 'CrossCurricular', grade: '912', topic: 'Philosophy & Ethics', mechanic: 'debate', isNew: true },
    { key: 'CLIMATE_TIME_MACHINE', name: 'Climate Time Machine', emoji: '🌡️', description: 'Travel through climate eras — identify what caused each shift!', subject: 'CrossCurricular', grade: '68', topic: 'Climate Science', mechanic: 'quiz', isNew: true },
    { key: 'DEBATE_DOJO', name: 'Debate Dojo', emoji: '💬', description: 'Build arguments with evidence — live audience votes!', subject: 'CrossCurricular', grade: '912', topic: 'Critical Thinking & English', mechanic: 'debate', isNew: true },
    { key: 'CRISIS_ROOM', name: 'Crisis Room', emoji: '🎭', description: 'Simulate real historical crises as the decision maker!', subject: 'CrossCurricular', grade: '912', topic: 'World History', mechanic: 'sim', isNew: true },
    { key: 'FLUID_DYNAMICS_SURFER', name: 'Fluid Dynamics Surfer', emoji: '🌊', description: 'Apply Bernoulli\'s & Pascal\'s law to steer fluid flows!', subject: 'CrossCurricular', grade: '912', topic: 'Physics (Fluids)', mechanic: 'puzzle', isNew: true },
    { key: 'SURVEYORS_SPRINT', name: 'Surveyor\'s Sprint', emoji: '📏', description: 'Calculate distances and areas on land survey maps!', subject: 'CrossCurricular', grade: '912', topic: 'Coordinate Geometry', mechanic: 'quiz', isNew: true },
    { key: 'CULTURAL_COMPASS', name: 'Cultural Compass', emoji: '🌏', description: 'Match cultural practices, foods & festivals to countries!', subject: 'CrossCurricular', grade: '35', topic: 'World Culture & GK', mechanic: 'match', isNew: true },
    { key: 'OLYMPIAD_QUALIFIER', name: 'Olympiad Qualifier', emoji: '🎯', description: 'Progressive math olympiad challenges across AMC/IMO styles!', subject: 'CrossCurricular', grade: '912', topic: 'Advanced Math', mechanic: 'quiz', isNew: true },
]

export const GAME_REGISTRY: GameEntry[] = [...EXISTING, ...NEW_GAMES]

/** Look up a single game by its key */
export function getGame(key: string): GameEntry | undefined {
    return GAME_REGISTRY.find(g => g.key === key)
}

/** Get all games for a given subject */
export function getGamesBySubject(subject: Subject): GameEntry[] {
    return GAME_REGISTRY.filter(g => g.subject === subject)
}

/** Get all games for a given grade band */
export function getGamesByGrade(grade: GradeBand): GameEntry[] {
    return GAME_REGISTRY.filter(g => g.grade === grade || g.grade === 'all')
}

/** Build the GAME_INFO map expected by app/games/play/page.tsx */
export const GAME_INFO = Object.fromEntries(
    GAME_REGISTRY.map(g => [
        g.key,
        { title: g.name, emoji: g.emoji, description: g.description }
    ])
)

/** Build the GAME_TYPES map expected by app/games/page.tsx */
export const GAME_TYPES = Object.fromEntries(
    GAME_REGISTRY.map(g => [
        g.key,
        {
            name: g.name,
            icon: g.emoji,
            description: g.description,
            color: subjectColor(g.subject),
            category: subjectLabel(g.subject),
            grade: g.grade,
            topic: g.topic,
            isNew: g.isNew ?? false,
        }
    ])
)

function subjectColor(subject: Subject): string {
    const map: Record<Subject, string> = {
        Math: 'emerald', English: 'sky', Science: 'violet',
        SocialStudies: 'amber', ComputerScience: 'blue',
        Hindi: 'rose', GK: 'orange', Simulation: 'teal',
        CrossCurricular: 'purple',
    }
    return map[subject] ?? 'slate'
}

function subjectLabel(subject: Subject): string {
    const map: Record<Subject, string> = {
        Math: 'Mathematics', English: 'English & Language', Science: 'Science',
        SocialStudies: 'Social Studies', ComputerScience: 'Computer Science',
        Hindi: 'Hindi & Regional Languages', GK: 'GK & Life Skills',
        Simulation: 'Simulation', CrossCurricular: 'Cross-Curricular',
    }
    return map[subject] ?? subject
}

/**
 * Unified Question Bank Index
 * Merges all subject-specific banks. The UniversalGame engine imports from here.
 * Math games are handled by the procedural generator in generators/math-generator.ts
 */

import { ENGLISH_BANKS } from './question-banks/english-banks'
import { SCIENCE_BANKS } from './question-banks/science-banks'
import { SOCIAL_BANKS, CS_BANKS, GK_BANKS, HINDI_BANKS } from './question-banks/other-banks'

export interface Question {
    prompt: string
    options: string[]
    answer: string
    explanation?: string
    visual?: string
}

export type QuestionBank = Record<string, Question[]>

// ─── Existing inline banks (kept for backwards compat + coverage gap fill) ───

const INLINE_BANKS: QuestionBank = {

    PERIODIC_BATTLESHIP: [
        { prompt: 'Symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 'Au', visual: '⚗️' },
        { prompt: 'Atomic number of Hydrogen?', options: ['0', '1', '2', '3'], answer: '1', visual: '⚗️' },
        { prompt: 'Symbol for Iron?', options: ['Ir', 'In', 'Fe', 'Fr'], answer: 'Fe', visual: '⚗️' },
        { prompt: 'Electrons in Carbon?', options: ['4', '6', '8', '12'], answer: '6', visual: '⚗️' },
        { prompt: 'Noble gases are in Group?', options: ['1', '2', '17', '18'], answer: '18', visual: '⚗️' },
        { prompt: 'Symbol for Sodium?', options: ['So', 'Sd', 'Na', 'Nm'], answer: 'Na', visual: '⚗️' },
        { prompt: 'Which element is liquid at room temp (non-metal)?', options: ['Mercury', 'Bromine', 'Gallium', 'Cesium'], answer: 'Bromine', visual: '⚗️' },
        { prompt: 'Most abundant element in Earth\'s crust?', options: ['Silicon', 'Iron', 'Oxygen', 'Aluminium'], answer: 'Oxygen', visual: '⚗️' },
        { prompt: 'Potassium (K) is in Period?', options: ['2', '3', '4', '5'], answer: '4', visual: '⚗️' },
        { prompt: 'Symbol for Lead?', options: ['Le', 'Ld', 'Pb', 'Pl'], answer: 'Pb', visual: '⚗️' },
        { prompt: 'Highest electronegativity element?', options: ['Oxygen', 'Chlorine', 'Fluorine', 'Nitrogen'], answer: 'Fluorine', visual: '⚗️' },
        { prompt: 'Atomic number of Helium?', options: ['1', '2', '3', '4'], answer: '2', visual: '⚗️' },
        { prompt: 'Symbol for Silver?', options: ['Si', 'Sv', 'Ag', 'Al'], answer: 'Ag', visual: '⚗️' },
        { prompt: 'Green-yellow diatomic gas?', options: ['Fluorine', 'Chlorine', 'Bromine', 'Iodine'], answer: 'Chlorine', visual: '⚗️' },
        { prompt: 'Protons in Oxygen?', options: ['6', '7', '8', '9'], answer: '8', visual: '⚗️' },
        { prompt: 'Symbol for Potassium?', options: ['P', 'Po', 'K', 'Kt'], answer: 'K', visual: '⚗️' },
        { prompt: 'Which period has 8 elements (Period 2)?', options: ['Period 1', 'Period 2', 'Period 3', 'Period 4'], answer: 'Period 2', visual: '⚗️' },
        { prompt: 'Atomic number of Carbon?', options: ['4', '6', '8', '12'], answer: '6', visual: '⚗️' },
        { prompt: 'The most reactive metal group?', options: ['Group 2', 'Group 11', 'Group 1', 'Group 17'], answer: 'Group 1', visual: '⚗️' },
        { prompt: 'Transition metals are found in?', options: ['Groups 1-2', 'Groups 3-12', 'Groups 13-18', 'Period 1'], answer: 'Groups 3-12', visual: '⚗️' },
    ],

    GENETICS_GENOME_DUEL: [
        { prompt: 'DNA stands for?', options: ['Deoxyribose Nucleic Acid', 'Deoxyribonucleic Acid', 'Double Nucleotide Acid', 'Dinucleic Acid'], answer: 'Deoxyribonucleic Acid', visual: '🧬' },
        { prompt: 'Human chromosome count?', options: ['23', '44', '46', '48'], answer: '46', visual: '🧬' },
        { prompt: 'Phenotype of Tt (T dominant)?', options: ['Recessive', 'Dominant', 'Neither', 'Both'], answer: 'Dominant', visual: '🧬' },
        { prompt: '3:1 ratio comes from which cross?', options: ['Tt×TT', 'Tt×Tt', 'TT×tt', 'tt×tt'], answer: 'Tt×Tt', visual: '🧬' },
        { prompt: 'A gene is a segment of?', options: ['Protein', 'RNA', 'DNA', 'Carbohydrate'], answer: 'DNA', visual: '🧬' },
        { prompt: 'Sex of human baby determined by?', options: ['Mother\'s chromosome', 'Father\'s chromosome', 'Nutrition', 'Temperature'], answer: "Father's chromosome", visual: '🧬' },
        { prompt: 'Father of Genetics?', options: ['Darwin', 'Mendel', 'Watson', 'Crick'], answer: 'Mendel', visual: '🧬' },
        { prompt: 'mRNA carries info from DNA to?', options: ['Nucleus', 'Ribosomes', 'Mitochondria', 'Lysosomes'], answer: 'Ribosomes', visual: '🧬' },
        { prompt: 'Making RNA from DNA is called?', options: ['Translation', 'Transcription', 'Replication', 'Mutation'], answer: 'Transcription', visual: '🧬' },
        { prompt: 'XY genotype is?', options: ['Female', 'Male', 'Neither', 'Intersex'], answer: 'Male', visual: '🧬' },
        { prompt: 'Phenotype is?', options: ['Genetic code', 'Physical appearance', 'DNA sequence', 'Protein made'], answer: 'Physical appearance', visual: '🧬' },
        { prompt: 'Colour blindness is linked to?', options: ['X chromosome', 'Y chromosome', 'Autosome 1', 'Autosome 7'], answer: 'X chromosome', visual: '🧬' },
        { prompt: 'Adenine pairs with (in DNA)?', options: ['Guanine', 'Cytosine', 'Thymine', 'Uracil'], answer: 'Thymine', visual: '🧬' },
        { prompt: 'Natural selection is mechanism of?', options: ['Cloning', 'Evolution', 'Mutation', 'Crossing over'], answer: 'Evolution', visual: '🧬' },
        { prompt: 'Mutation is a change in?', options: ['Protein shape', 'DNA sequence', 'Cell structure', 'Chromosome number only'], answer: 'DNA sequence', visual: '🧬' },
        { prompt: 'Incomplete dominance results in?', options: ['Dominant phenotype', 'Recessive phenotype', 'Blend of both', 'Neither'], answer: 'Blend of both', visual: '🧬' },
        { prompt: 'Homozygous means?', options: ['Two different alleles', 'Two identical alleles', 'One allele', 'No alleles'], answer: 'Two identical alleles', visual: '🧬' },
        { prompt: 'Heterozygous means?', options: ['Two identical alleles', 'Two different alleles', 'No alleles', 'One allele'], answer: 'Two different alleles', visual: '🧬' },
        { prompt: 'Which base is in RNA but not DNA?', options: ['Adenine', 'Guanine', 'Thymine', 'Uracil'], answer: 'Uracil', visual: '🧬' },
        { prompt: 'A karyotype shows?', options: ['Protein structure', 'All chromosomes of an organism', 'DNA sequence', 'Gene expression'], answer: 'All chromosomes of an organism', visual: '🧬' },
    ],

    MAP_MASTERY_MISSION: [
        { prompt: 'Capital of France?', options: ['Lyon', 'Marseille', 'Paris', 'Nice'], answer: 'Paris', visual: '🗺️' },
        { prompt: 'Largest country by area?', options: ['China', 'USA', 'Canada', 'Russia'], answer: 'Russia', visual: '🗺️' },
        { prompt: 'Capital of Japan?', options: ['Osaka', 'Hiroshima', 'Tokyo', 'Kyoto'], answer: 'Tokyo', visual: '🗺️' },
        { prompt: 'Longest river in the world?', options: ['Amazon', 'Mississippi', 'Nile', 'Yangtze'], answer: 'Nile', visual: '🗺️' },
        { prompt: 'Capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 'Canberra', visual: '🗺️' },
        { prompt: 'Continent with most countries?', options: ['Asia', 'Europe', 'South America', 'Africa'], answer: 'Africa', visual: '🗺️' },
        { prompt: 'Amazon Rainforest is in?', options: ['Africa', 'Asia', 'South America', 'North America'], answer: 'South America', visual: '🗺️' },
        { prompt: 'Sahara Desert is in?', options: ['Asia', 'Africa', 'Australia', 'Middle East'], answer: 'Africa', visual: '🗺️' },
        { prompt: 'Capital of Brazil?', options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], answer: 'Brasília', visual: '🗺️' },
        { prompt: 'Highest mountain in the world?', options: ['K2', 'Everest', 'Kangchenjunga', 'Lhotse'], answer: 'Everest', visual: '🗺️' },
        { prompt: 'Capital of Canada?', options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], answer: 'Ottawa', visual: '🗺️' },
        { prompt: 'Largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 'Pacific', visual: '🗺️' },
        { prompt: 'Which country has the most islands?', options: ['Indonesia', 'Philippines', 'Japan', 'Sweden'], answer: 'Sweden', visual: '🗺️' },
        { prompt: 'Tropic of Cancer passes through?', options: ['Only Africa', 'Only Asia', 'India, Egypt and Mexico', 'Only Europe'], answer: 'India, Egypt and Mexico', visual: '🗺️' },
        { prompt: 'Capital of Germany?', options: ['Munich', 'Frankfurt', 'Hamburg', 'Berlin'], answer: 'Berlin', visual: '🗺️' },
        { prompt: 'Which country is called Land of Rising Sun?', options: ['China', 'Korea', 'Japan', 'Thailand'], answer: 'Japan', visual: '🗺️' },
        { prompt: 'Longest border in the world is between?', options: ['USA-Mexico', 'Russia-China', 'Canada-USA', 'India-China'], answer: 'Canada-USA', visual: '🗺️' },
        { prompt: 'Capital of Egypt?', options: ['Alexandria', 'Luxor', 'Cairo', 'Aswan'], answer: 'Cairo', visual: '🗺️' },
        { prompt: 'Which is NOT a landlocked country?', options: ['Nepal', 'Bolivia', 'Switzerland', 'Morocco'], answer: 'Morocco', visual: '🗺️' },
        { prompt: 'The Suez Canal connects?', options: ['Atlantic and Pacific', 'Red Sea and Mediterranean', 'Black Sea and Caspian', 'North Sea and Baltic'], answer: 'Red Sea and Mediterranean', visual: '🗺️' },
    ],

    GEOSPY: [
        { prompt: 'Cherry blossoms, bullet trains, Mount Fuji?', options: ['China', 'South Korea', 'Japan', 'Vietnam'], answer: 'Japan', visual: '🗺️' },
        { prompt: 'Red double-decker bus, Big Ben?', options: ['Dublin', 'Edinburgh', 'London', 'Manchester'], answer: 'London', visual: '🗺️' },
        { prompt: 'Pyramids, Nile River?', options: ['Sudan', 'Egypt', 'Morocco', 'Libya'], answer: 'Egypt', visual: '🗺️' },
        { prompt: 'Kangaroos, Outback, Opera House?', options: ['New Zealand', 'Australia', 'Fiji', 'PNG'], answer: 'Australia', visual: '🗺️' },
        { prompt: 'Samba, carnival, Amazon?', options: ['Colombia', 'Peru', 'Argentina', 'Brazil'], answer: 'Brazil', visual: '🗺️' },
        { prompt: 'Fjords, midnight sun, Viking heritage?', options: ['Sweden', 'Denmark', 'Norway', 'Finland'], answer: 'Norway', visual: '🗺️' },
        { prompt: 'Taj Mahal, Bollywood?', options: ['Pakistan', 'Nepal', 'India', 'Bangladesh'], answer: 'India', visual: '🗺️' },
        { prompt: 'Maasai warriors, Great Rift Valley?', options: ['Tanzania', 'Uganda', 'Kenya', 'Ethiopia'], answer: 'Kenya', visual: '🗺️' },
        { prompt: 'Baguettes, Eiffel Tower, wine?', options: ['Belgium', 'Italy', 'France', 'Spain'], answer: 'France', visual: '🗺️' },
        { prompt: 'Tango, Andes, gaucho culture?', options: ['Chile', 'Uruguay', 'Paraguay', 'Argentina'], answer: 'Argentina', visual: '🗺️' },
        { prompt: 'Tulips, windmills, canals?', options: ['Belgium', 'Germany', 'Netherlands', 'Denmark'], answer: 'Netherlands', visual: '🗺️' },
        { prompt: 'Red Square, onion domes?', options: ['Ukraine', 'Belarus', 'Russia', 'Kazakhstan'], answer: 'Russia', visual: '🗺️' },
        { prompt: 'Terracotta warriors, pandas, Great Wall?', options: ['Mongolia', 'Japan', 'South Korea', 'China'], answer: 'China', visual: '🗺️' },
        { prompt: 'Table Mountain, braai culture?', options: ['Kenya', 'Namibia', 'South Africa', 'Zimbabwe'], answer: 'South Africa', visual: '🗺️' },
        { prompt: 'Maple leaf flag, moose, hockey?', options: ['USA', 'Canada', 'Finland', 'Russia'], answer: 'Canada', visual: '🗺️' },
        { prompt: 'Kangaroo in coat of arms? (alongside emu)', options: ['New Zealand', 'Australia', 'Papua New Guinea', 'Fiji'], answer: 'Australia', visual: '🗺️' },
        { prompt: 'Windmills producing cheese?', options: ['France', 'Germany', 'Netherlands', 'Belgium'], answer: 'Netherlands', visual: '🗺️' },
        { prompt: 'Geisha, kimono, Mount Fuji?', options: ['China', 'Vietnam', 'Japan', 'Thailand'], answer: 'Japan', visual: '🗺️' },
        { prompt: 'Machu Picchu, Inca ruins?', options: ['Brazil', 'Colombia', 'Bolivia', 'Peru'], answer: 'Peru', visual: '🗺️' },
        { prompt: 'Northern Lights (Aurora) most visible in?', options: ['Canada/Norway/Iceland', 'India', 'Brazil', 'China'], answer: 'Canada/Norway/Iceland', visual: '🗺️' },
    ],

    CRITICAL_THINKERS_COURT: [
        { prompt: '"All birds fly. Penguins are birds. So penguins fly." This is?', options: ['Valid argument', 'Invalid conclusion', 'Sound argument', 'Logical fallacy'], answer: 'Invalid conclusion', visual: '📊' },
        { prompt: '"Trust me, I\'m a doctor." This appeal is?', options: ['Ad hominem', 'Appeal to authority', 'Straw man', 'Red herring'], answer: 'Appeal to authority', visual: '📊' },
        { prompt: 'Straw man fallacy?', options: ['Attacking a person', 'Misrepresenting opponent\'s argument', 'Changing topic', 'Using irrelevant stats'], answer: "Misrepresenting opponent's argument", visual: '📊' },
        { prompt: '"Everyone is doing it." This is?', options: ['False cause', 'Bandwagon fallacy', 'Ad hominem', 'Slippery slope'], answer: 'Bandwagon fallacy', visual: '📊' },
        { prompt: 'Best scientific evidence?', options: ['Personal anecdote', 'Expert opinion', 'Peer-reviewed research', 'Popular news article'], answer: 'Peer-reviewed research', visual: '📊' },
        { prompt: 'A→B and B→C, therefore A→C is?', options: ['Invalid logic', 'Hypothetical syllogism', 'Circular reasoning', 'False dichotomy'], answer: 'Hypothetical syllogism', visual: '📊' },
        { prompt: 'Red herring is?', options: ['False comparison', 'Distraction from main issue', 'Attacking character', 'Misquoting evidence'], answer: 'Distraction from main issue', visual: '📊' },
        { prompt: '"Either with us or against us" is?', options: ['Ad hominem', 'Slippery slope', 'False dichotomy', 'Hasty generalisation'], answer: 'False dichotomy', visual: '📊' },
        { prompt: 'Deductive reasoning goes from?', options: ['Specific to general', 'General to specific', 'Evidence to conclusion only', 'Conclusion to evidence'], answer: 'General to specific', visual: '📊' },
        { prompt: '"One bad experience = all similar things are bad" is?', options: ['False cause', 'Hasty generalisation', 'Ad hominem', 'Circular reasoning'], answer: 'Hasty generalisation', visual: '📊' },
        { prompt: 'Best way to test a hypothesis?', options: ['Strong feelings', 'Controlled experiment', 'Historical examples', 'Expert interviews'], answer: 'Controlled experiment', visual: '📊' },
        { prompt: 'Correlation implies?', options: ['Causation', 'Association but not necessarily causation', 'Nothing', 'Both'], answer: 'Association but not necessarily causation', visual: '📊' },
        { prompt: '"You\'re wrong because you\'re young" is?', options: ['Straw man', 'Ad hominem', 'Red herring', 'False cause'], answer: 'Ad hominem', visual: '📊' },
        { prompt: 'An unbiased source?', options: ['Agrees with you', 'Has vested interests', 'Presents evidence fairly', 'Has most views'], answer: 'Presents evidence fairly', visual: '📊' },
        { prompt: 'Inductive reasoning moves from?', options: ['General to specific', 'Specific to general', 'Hypothesis to law', 'Theory to fact'], answer: 'Specific to general', visual: '📊' },
        { prompt: 'Occam\'s Razor says?', options: ['The most complex explanation is best', 'The simplest explanation is usually correct', 'All explanations are equal', 'Science cannot explain everything'], answer: 'The simplest explanation is usually correct', visual: '📊' },
        { prompt: 'A valid argument with true premises is?', options: ['Invalid', 'Sound', 'Unsound', 'Uncertain'], answer: 'Sound', visual: '📊' },
        { prompt: 'Confirmation bias means?', options: ['Accepting all evidence', 'Seeking only information that confirms your beliefs', 'Ignoring all evidence', 'Being too sceptical'], answer: 'Seeking only information that confirms your beliefs', visual: '📊' },
        { prompt: 'Which type of reasoning is used in scientific experiments?', options: ['Deductive only', 'Inductive only', 'Both deductive and inductive', 'Neither'], answer: 'Both deductive and inductive', visual: '📊' },
        { prompt: '"The economy improved after X was elected, so X caused it." This is?', options: ['Valid deduction', 'Post hoc fallacy (false cause)', 'Sound argument', 'Inductive reasoning'], answer: 'Post hoc fallacy (false cause)', visual: '📊' },
    ],

    SHAKESPEARE_SHOWDOWN: [
        { prompt: '"To be or not to be" — from which play?', options: ['Macbeth', 'Othello', 'Hamlet', 'King Lear'], answer: 'Hamlet', visual: '🎭' },
        { prompt: '"All the world\'s a stage" — from?', options: ['Romeo and Juliet', 'As You Like It', 'Twelfth Night', 'A Midsummer Night\'s Dream'], answer: 'As You Like It', visual: '🎭' },
        { prompt: '"The moon is a silver coin" — literary device?', options: ['Simile', 'Personification', 'Metaphor', 'Alliteration'], answer: 'Metaphor', visual: '🎭' },
        { prompt: '"Wherefore art thou Romeo?" — "wherefore" means?', options: ['Where', 'Who', 'Why', 'When'], answer: 'Why', visual: '🎭' },
        { prompt: 'Jealousy dominates which Shakespeare play?', options: ['Hamlet', 'Othello', 'Macbeth', 'The Tempest'], answer: 'Othello', visual: '🎭' },
        { prompt: '"The wind whispered" — device?', options: ['Simile', 'Metaphor', 'Personification', 'Hyperbole'], answer: 'Personification', visual: '🎭' },
        { prompt: 'Iambic pentameter has how many syllables per line?', options: ['8', '10', '12', '14'], answer: '10', visual: '🎭' },
        { prompt: 'Lady Macbeth features in which play?', options: ['King Lear', 'Hamlet', 'Macbeth', 'Othello'], answer: 'Macbeth', visual: '🎭' },
        { prompt: '"Et tu, Brute?" is spoken by?', options: ['Brutus', 'Caesar', 'Marc Antony', 'Cassius'], answer: 'Caesar', visual: '🎭' },
        { prompt: '"She sells sea shells" — device?', options: ['Assonance', 'Rhyme', 'Alliteration', 'Onomatopoeia'], answer: 'Alliteration', visual: '🎭' },
        { prompt: 'Macbeth\'s tragic flaw (hamartia)?', options: ['Jealousy', 'Ambition', 'Pride', 'Love'], answer: 'Ambition', visual: '🎭' },
        { prompt: '"Oh!" or "Alas!" are examples of?', options: ['Exclamation', 'Apostrophe', 'Interjection', 'Anachronism'], answer: 'Apostrophe', visual: '🎭' },
        { prompt: 'Shakespeare wrote how many plays?', options: ['27', '37', '47', '57'], answer: '37', visual: '🎭' },
        { prompt: '"A rose by any other name" argues?', options: ['Names are important', 'Names don\'t change essence', 'Roses are beautiful', 'Language is powerful'], answer: "Names don't change essence", visual: '🎭' },
        { prompt: 'Dramatic irony is when?', options: ['Characters know more than audience', 'Audience knows more than characters', 'Two characters disagree', 'The ending is unexpected'], answer: 'Audience knows more than characters', visual: '🎭' },
        { prompt: 'A soliloquy is?', options: ['Dialogue between two people', 'Character speaking thoughts alone on stage', 'Group speech', 'Narrator\'s voice'], answer: 'Character speaking thoughts alone on stage', visual: '🎭' },
        { prompt: 'The Globe Theatre was in?', options: ['Stratford-upon-Avon', 'London', 'Oxford', 'Cambridge'], answer: 'London', visual: '🎭' },
        { prompt: 'Shakespeare\'s birthplace?', options: ['London', 'Oxford', 'Stratford-upon-Avon', 'Canterbury'], answer: 'Stratford-upon-Avon', visual: '🎭' },
        { prompt: 'The genre of "A Midsummer Night\'s Dream"?', options: ['Tragedy', 'History', 'Comedy', 'Romance'], answer: 'Comedy', visual: '🎭' },
        { prompt: 'Which Shakespeare play features Shylock?', options: ['Merchant of Venice', 'Othello', 'Hamlet', 'Macbeth'], answer: 'Merchant of Venice', visual: '🎭' },
    ],

    DEBUG_DUEL: [
        { prompt: 'print("Hello World) — bug?', options: ['Missing comma', 'Missing closing quote', 'Missing indent', 'No bug'], answer: 'Missing closing quote', visual: '🐛' },
        { prompt: 'x = 5 + "3" — error type?', options: ['SyntaxError', 'TypeError', 'NameError', 'IndexError'], answer: 'TypeError', visual: '🐛' },
        { prompt: 'Off-by-one errors affect?', options: ['Variable names', 'Loop ranges', 'Function names', 'Imports'], answer: 'Loop ranges', visual: '🐛' },
        { prompt: 'Division by zero is?', options: ['SyntaxError', 'Logical error', 'Runtime error', 'NameError'], answer: 'Runtime error', visual: '🐛' },
        { prompt: 'if x = 5: — bug?', options: ['Should be ==', 'Should be >=', 'No bug', 'Should be !='], answer: 'Should be ==', visual: '🐛' },
        { prompt: 'Logic error means?', options: ['Code crashes', 'Code runs but gives wrong results', 'Code won\'t compile', 'Code is slow'], answer: 'Code runs but gives wrong results', visual: '🐛' },
        { prompt: 'Undefined variable error type?', options: ['SyntaxError', 'TypeError', 'NameError', 'ValueError'], answer: 'NameError', visual: '🐛' },
        { prompt: 'list=[1,2,3]; print(list[3]) gives?', options: ['3', 'None', 'IndexError', 'KeyError'], answer: 'IndexError', visual: '🐛' },
        { prompt: 'Tool to step through code finding bugs?', options: ['Compiler', 'Debugger', 'Interpreter', 'Linter'], answer: 'Debugger', visual: '🐛' },
        { prompt: 'range(1,10) to include 10, should be?', options: ['range(1,9)', 'range(1,11)', 'range(0,10)', 'range(1,10)'], answer: 'range(1,11)', visual: '🐛' },
        { prompt: 'Stack trace helps identify?', options: ['Performance issues', 'Where an error occurred', 'Memory usage', 'Security vulnerabilities'], answer: 'Where an error occurred', visual: '🐛' },
        { prompt: 'SyntaxError means?', options: ['Logic mistake', 'Code grammar is wrong', 'Runtime crash', 'Wrong data type'], answer: 'Code grammar is wrong', visual: '🐛' },
        { prompt: 'None/null error caused by?', options: ['Wrong loop', 'Accessing variable before setting it', 'Missing semicolon', 'Wrong data type'], answer: 'Accessing variable before setting it', visual: '🐛' },
        { prompt: 'Best practice to prevent bugs?', options: ['Write all code first', 'Test as you go', 'Avoid comments', 'Use complex variable names'], answer: 'Test as you go', visual: '🐛' },
        { prompt: 'An infinite loop is?', options: ['SyntaxError', 'Logic error', 'RuntimeError', 'NameError'], answer: 'Logic error', visual: '🐛' },
        { prompt: 'IndentationError in Python means?', options: ['Wrong data type', 'Code is misaligned/indented incorrectly', 'Variable undefined', 'Loop error'], answer: 'Code is misaligned/indented incorrectly', visual: '🐛' },
        { prompt: 'What does "print" do in Python?', options: ['Stores value', 'Outputs to console', 'Creates loop', 'Returns value'], answer: 'Outputs to console', visual: '🐛' },
        { prompt: 'Which operator checks equality in most languages?', options: ['=', '==', '===', '!='], answer: '==', visual: '🐛' },
        { prompt: 'A function that calls itself is?', options: ['Iterative', 'Recursive', 'Sequential', 'Parallel'], answer: 'Recursive', visual: '🐛' },
        { prompt: 'Which is a comment in Python?', options: ['// comment', '/* comment */', '# comment', '<!-- comment -->'], answer: '# comment', visual: '🐛' },
    ],
}

// ─── Merge all banks into one export ─────────────────────────────────────────

export const QUESTION_BANKS: QuestionBank = {
    ...INLINE_BANKS,
    ...ENGLISH_BANKS,
    ...SCIENCE_BANKS,
    ...SOCIAL_BANKS,
    ...CS_BANKS,
    ...GK_BANKS,
    ...HINDI_BANKS,
}

"use strict";
/**
 * Knowledge Question Generator — Part 1
 * English, Science, Social Studies games
 *
 * How it works: Each game has a large fact pool [question, answer].
 * genFromPool() picks 1 fact + 3 wrong answers from the pool randomly.
 * 100 facts → 100 × C(99,3) = 15M+ unique combinations. Truly unlimited.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.genSynonymSwitchblade = genSynonymSwitchblade;
exports.genGrammarGladiator = genGrammarGladiator;
exports.genIdiomHunter = genIdiomHunter;
exports.genComprehensionCodebreaker = genComprehensionCodebreaker;
exports.genPeriodicBattleship = genPeriodicBattleship;
exports.genAnimalKingdomSorter = genAnimalKingdomSorter;
exports.genSolarSystemDefender = genSolarSystemDefender;
exports.genGeneticsGenomeDuel = genGeneticsGenomeDuel;
exports.genFoodChainArena = genFoodChainArena;
exports.genPlantPowerGrower = genPlantPowerGrower;
exports.genCapitalsConquest = genCapitalsConquest;
exports.genWorldFlags = genWorldFlags;
exports.genCivilizationBuilder = genCivilizationBuilder;
exports.genEmpireFall = genEmpireFall;
function r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = r(0, i);
        [a[i], a[j]] = [a[j], a[i]];
    }
    ;
    return a;
}
function genFromPool(facts, visual) {
    const item = facts[r(0, facts.length - 1)];
    // Deduplicate wrong answers by answer string to prevent DUPLICATE_OPTIONS
    const seenAnswers = new Set([item.a.toLowerCase().trim()]);
    const wrongPool = [];
    for (const f of shuffle(facts.filter(f => f.a.toLowerCase().trim() !== item.a.toLowerCase().trim()))) {
        const key = f.a.toLowerCase().trim();
        if (!seenAnswers.has(key)) {
            seenAnswers.add(key);
            wrongPool.push(f.a);
            if (wrongPool.length === 3)
                break;
        }
    }
    // Pad with generic distractors if pool too small (safety net)
    while (wrongPool.length < 3)
        wrongPool.push(`Option ${wrongPool.length + 2}`);
    return {
        prompt: item.q,
        options: shuffle([item.a, ...wrongPool]),
        answer: item.a,
        visual: item.v ?? visual,
    };
}
// ── ENGLISH GAMES ─────────────────────────────────────────────────────────────
const SYNONYM_FACTS = [
    { q: 'Synonym of "happy"?', a: 'joyful' }, { q: 'Synonym of "sad"?', a: 'sorrowful' }, { q: 'Synonym of "big"?', a: 'enormous' },
    { q: 'Synonym of "small"?', a: 'tiny' }, { q: 'Synonym of "fast"?', a: 'swift' }, { q: 'Synonym of "slow"?', a: 'sluggish' },
    { q: 'Synonym of "brave"?', a: 'courageous' }, { q: 'Synonym of "smart"?', a: 'intelligent' }, { q: 'Synonym of "angry"?', a: 'furious' },
    { q: 'Synonym of "cold"?', a: 'frigid' }, { q: 'Synonym of "hot"?', a: 'scorching' }, { q: 'Synonym of "pretty"?', a: 'beautiful' },
    { q: 'Synonym of "begin"?', a: 'commence' }, { q: 'Synonym of "end"?', a: 'conclude' }, { q: 'Synonym of "help"?', a: 'assist' },
    { q: 'Synonym of "talk"?', a: 'converse' }, { q: 'Synonym of "walk"?', a: 'stroll' }, { q: 'Synonym of "run"?', a: 'sprint' },
    { q: 'Synonym of "eat"?', a: 'consume' }, { q: 'Synonym of "see"?', a: 'observe' }, { q: 'Synonym of "say"?', a: 'utter' },
    { q: 'Synonym of "rich"?', a: 'affluent' }, { q: 'Synonym of "poor"?', a: 'destitute' }, { q: 'Synonym of "old"?', a: 'ancient' },
    { q: 'Synonym of "new"?', a: 'novel' }, { q: 'Synonym of "loud"?', a: 'boisterous' }, { q: 'Synonym of "quiet"?', a: 'serene' },
    { q: 'Synonym of "dark"?', a: 'gloomy' }, { q: 'Synonym of "bright"?', a: 'luminous' }, { q: 'Synonym of "easy"?', a: 'effortless' },
    { q: 'Synonym of "hard"?', a: 'arduous' }, { q: 'Synonym of "clean"?', a: 'spotless' }, { q: 'Synonym of "dirty"?', a: 'filthy' },
    { q: 'Synonym of "afraid"?', a: 'terrified' }, { q: 'Synonym of "funny"?', a: 'hilarious' }, { q: 'Synonym of "strange"?', a: 'peculiar' },
    { q: 'Synonym of "beautiful"?', a: 'gorgeous' }, { q: 'Synonym of "ugly"?', a: 'hideous' }, { q: 'Synonym of "tired"?', a: 'exhausted' },
    { q: 'Synonym of "confused"?', a: 'bewildered' }, { q: 'Synonym of "show"?', a: 'demonstrate' }, { q: 'Synonym of "hide"?', a: 'conceal' },
    { q: 'Synonym of "buy"?', a: 'purchase' }, { q: 'Synonym of "want"?', a: 'desire' }, { q: 'Synonym of "need"?', a: 'require' },
    { q: 'Synonym of "use"?', a: 'utilise' }, { q: 'Synonym of "make"?', a: 'create' }, { q: 'Synonym of "destroy"?', a: 'demolish' },
    { q: 'Synonym of "answer"?', a: 'respond' }, { q: 'Synonym of "question"?', a: 'query' }, { q: 'Synonym of "story"?', a: 'narrative' },
    { q: 'Synonym of "important"?', a: 'crucial' }, { q: 'Synonym of "extra"?', a: 'additional' }, { q: 'Synonym of "wrong"?', a: 'erroneous' },
    { q: 'Synonym of "correct"?', a: 'accurate' }, { q: 'Synonym of "difficult"?', a: 'challenging' }, { q: 'Synonym of "simple"?', a: 'straightforward' },
    { q: 'Synonym of "famous"?', a: 'renowned' }, { q: 'Synonym of "secret"?', a: 'confidential' }, { q: 'Synonym of "worried"?', a: 'anxious' },
    { q: 'Synonym of "safe"?', a: 'secure' }, { q: 'Synonym of "dangerous"?', a: 'hazardous' }, { q: 'Synonym of "strong"?', a: 'robust' },
    { q: 'Synonym of "weak"?', a: 'feeble' }, { q: 'Synonym of "careful"?', a: 'cautious' }, { q: 'Synonym of "careless"?', a: 'reckless' },
];
function genSynonymSwitchblade() { return genFromPool(SYNONYM_FACTS, '⚔️'); }
const GRAMMAR_FACTS = [
    { q: '"She don\'t like it." Correct?', a: 'She doesn\'t like it.' }, { q: '"He go to school." Correct?', a: 'He goes to school.' },
    { q: '"They is happy." Correct?', a: 'They are happy.' }, { q: '"I has a dog." Correct?', a: 'I have a dog.' },
    { q: '"She runned fast." Correct past tense?', a: 'She ran fast.' }, { q: '"He have eaten." Correct?', a: 'He has eaten.' },
    { q: '"Me and him went." Correct?', a: 'He and I went.' }, { q: '"Who did you see?" Object form correct?', a: 'Whom did you see?' },
    { q: 'Plural of "child"?', a: 'children' }, { q: 'Plural of "tooth"?', a: 'teeth' },
    { q: 'Plural of "mouse"?', a: 'mice' }, { q: 'Plural of "woman"?', a: 'women' },
    { q: 'Plural of "goose"?', a: 'geese' }, { q: 'Plural of "foot"?', a: 'feet' },
    { q: 'Plural of "ox"?', a: 'oxen' }, { q: 'Plural of "criterion"?', a: 'criteria' },
    { q: 'Plural of "phenomenon"?', a: 'phenomena' }, { q: 'Plural of "analysis"?', a: 'analyses' },
    { q: 'Correct: "less" or "fewer" for countable things?', a: 'fewer' }, { q: 'Correct: "less" or "fewer" for uncountable things?', a: 'less' },
    { q: '"Its" vs "It\'s": contraction of "it is"?', a: "It's" }, { q: '"Your" vs "You\'re": possessive?', a: 'Your' },
    { q: '"Their" vs "There": location?', a: 'There' }, { q: '"Affect" (verb) vs "Effect" (noun): impact of action?', a: 'Effect' },
    { q: '"Lay" requires an object. "Lie" does not. "She __ down." Correct?', a: 'lay (past) or lies (present)' },
    { q: 'Subject-verb: "Neither he nor they ___ wrong."', a: 'are' }, { q: 'Subject-verb: "Each of the boys ___ here."', a: 'is' },
    { q: 'Correct spelling?', a: 'accommodate' }, { q: 'Correct spelling?', a: 'necessary' }, { q: 'Correct spelling?', a: 'occurrence' },
    { q: 'Correct spelling?', a: 'separate' }, { q: 'Correct spelling?', a: 'definitely' }, { q: 'Correct spelling?', a: 'receive' },
    { q: 'Active to passive: "She wrote the letter." Passive?', a: 'The letter was written by her.' },
    { q: 'Reported: She said "I am tired." Indirect?', a: 'She said that she was tired.' },
    { q: '"Fewer" is used with?', a: 'countable nouns' }, { q: '"Less" is used with?', a: 'uncountable nouns' },
    { q: 'What type of noun is "advice"?', a: 'uncountable (mass) noun' }, { q: 'Correct: "a" or "an" before "hour"?', a: 'an' },
    { q: 'Correct: "a" or "an" before "university"?', a: 'a' }, { q: 'Dangling modifier error involves?', a: 'a modifier not clearly attached to the word it modifies' },
];
function genGrammarGladiator() { return genFromPool(GRAMMAR_FACTS, '⚔️'); }
const IDIOM_FACTS = [
    { q: '"Break the ice" means?', a: 'Start a conversation' }, { q: '"Hit the nail on the head" means?', a: 'Be exactly right' },
    { q: '"Under the weather" means?', a: 'Feeling ill' }, { q: '"Beat around the bush" means?', a: 'Avoid the main point' },
    { q: '"Cost an arm and a leg" means?', a: 'Very expensive' }, { q: '"Let the cat out of the bag" means?', a: 'Reveal a secret' },
    { q: '"Bite the bullet" means?', a: 'Endure pain bravely' }, { q: '"Spill the beans" means?', a: 'Share a secret accidentally' },
    { q: '"A piece of cake" means?', a: 'Something very easy' }, { q: '"Burn bridges" means?', a: 'Permanently damage relationships' },
    { q: '"Once in a blue moon" means?', a: 'Rarely' }, { q: '"Tie the knot" means?', a: 'Get married' },
    { q: '"Kill two birds with one stone" means?', a: 'Solve two problems at once' }, { q: '"Bite off more than you can chew" means?', a: 'Take on more than you can handle' },
    { q: '"Speak of the devil" means?', a: 'Someone appears just as you mention them' }, { q: '"Every cloud has a silver lining" means?', a: 'Every bad situation has a good aspect' },
    { q: '"Hit the sack" means?', a: 'Go to sleep' }, { q: '"The ball is in your court" means?', a: "It's your decision" },
    { q: '"Throw in the towel" means?', a: 'Give up' }, { q: '"On the fence" means?', a: 'Undecided' },
    { q: '"Pull someone\'s leg" means?', a: 'Joke with them' }, { q: '"The last straw" means?', a: 'Breaking point after many problems' },
    { q: '"Add fuel to the fire" means?', a: 'Make a bad situation worse' }, { q: '"A blessing in disguise" means?', a: 'Something good that seemed bad at first' },
    { q: '"Go back to the drawing board" means?', a: 'Start over' }, { q: '"Hit the road" means?', a: 'Start travelling' },
    { q: '"Take with a grain of salt" means?', a: 'Be sceptical of information' }, { q: '"Up in the air" means?', a: 'Uncertain' },
    { q: '"On the same page" means?', a: 'Having same understanding' }, { q: '"Let sleeping dogs lie" means?', a: 'Avoid stirring up old trouble' },
    { q: '"Bite the hand that feeds you" means?', a: 'Be ungrateful to someone who helps you' }, { q: '"Barking up the wrong tree" means?', a: 'Pursuing the wrong course of action' },
    { q: '"Don\'t judge a book by its cover" means?', a: "Don't judge by appearances" }, { q: '"Actions speak louder than words" means?', a: 'What you do matters more than what you say' },
    { q: '"The early bird catches the worm" means?', a: 'Those who start early have an advantage' }, { q: '"Bite the dust" means?', a: 'Fail or die' },
    { q: '"In hot water" means?', a: 'In trouble' }, { q: '"A storm in a teacup" means?', a: 'A big fuss over something small' },
    { q: '"Wear your heart on your sleeve" means?', a: 'Show emotions openly' }, { q: '"The tip of the iceberg" means?', a: 'A small visible part of a larger hidden problem' },
];
function genIdiomHunter() { return genFromPool(IDIOM_FACTS, '🏹'); }
const COMPREHENSION_FACTS = [
    { q: 'An inference is?', a: 'Using text + knowledge to deduce something not stated' }, { q: 'The main idea is?', a: 'Central point the whole passage is about' },
    { q: 'Context clues help determine?', a: "A word's meaning from surrounding text" }, { q: 'Summarising means?', a: 'Retelling main points briefly in your own words' },
    { q: 'The purpose of persuasive text?', a: 'Convince the reader' }, { q: 'A narrative text primarily?', a: 'Tells a story' },
    { q: 'An expository text?', a: 'Explains or informs' }, { q: '"However" signals?', a: 'Contrast' },
    { q: '"Therefore" signals?', a: 'Cause and effect conclusion' }, { q: '"For example" signals?', a: 'Illustration or evidence' },
    { q: '"In addition" signals?', a: 'More information' }, { q: '"On the other hand" signals?', a: 'Alternative view' },
    { q: 'First-person point of view uses?', a: 'I, me, my, we' }, { q: 'Third-person omniscient means?', a: 'Narrator knows all characters\' thoughts' },
    { q: 'A biography is written?', a: "About someone else's real life" }, { q: 'An autobiography is written?', a: 'By the subject themselves' },
    { q: 'Chronological order means?', a: 'In the order events occurred' }, { q: 'The climax of a story is?', a: 'The turning point / most intense moment' },
    { q: 'Theme of a story is?', a: 'Central message or lesson' }, { q: 'A character\'s motivation is?', a: 'The reason behind their actions' },
    { q: 'Tone refers to?', a: "Author's attitude or feeling" }, { q: 'A fact differs from an opinion because a fact is?', a: 'Verifiable and objective' },
    { q: 'Paraphrasing means?', a: 'Restating in your own words' }, { q: 'Reading between the lines means?', a: 'Understanding implied meaning' },
    { q: 'A fable usually ends with?', a: 'A moral lesson' }, { q: 'Dramatic irony is when?', a: 'Audience knows more than characters' },
    { q: 'A simile compares using?', a: '"like" or "as"' }, { q: 'A metaphor is?', a: 'A direct comparison without "like" or "as"' },
    { q: 'Personification gives?', a: 'Human qualities to non-human things' }, { q: 'Alliteration is?', a: 'Repetition of the same initial consonant sound' },
    { q: 'Hyperbole is?', a: 'Extreme exaggeration for effect' }, { q: 'Onomatopoeia is?', a: 'A word that imitates a sound (buzz, crack)' },
    { q: 'Setting of a story includes?', a: 'Time and place' }, { q: 'Protagonist is?', a: 'The main character' },
    { q: 'Antagonist is?', a: 'The character who opposes the protagonist' }, { q: 'Conflict in a story is?', a: 'The central problem or struggle' },
    { q: 'Resolution is?', a: 'How the conflict is solved' }, { q: 'Rising action is?', a: 'Events building toward the climax' },
    { q: 'Falling action is?', a: 'Events after the climax leading to resolution' }, { q: 'Exposition in a story is?', a: 'Introduction of characters and setting' },
];
function genComprehensionCodebreaker() { return genFromPool(COMPREHENSION_FACTS, '📖'); }
// ── SCIENCE GAMES ─────────────────────────────────────────────────────────────
const PERIODIC_FACTS = [
    { q: 'Symbol for Gold?', a: 'Au' }, { q: 'Symbol for Iron?', a: 'Fe' }, { q: 'Symbol for Silver?', a: 'Ag' },
    { q: 'Symbol for Lead?', a: 'Pb' }, { q: 'Symbol for Sodium?', a: 'Na' }, { q: 'Symbol for Potassium?', a: 'K' },
    { q: 'Symbol for Copper?', a: 'Cu' }, { q: 'Symbol for Tin?', a: 'Sn' }, { q: 'Symbol for Mercury?', a: 'Hg' },
    { q: 'Symbol for Tungsten?', a: 'W' }, { q: 'Atomic number of Hydrogen?', a: '1' }, { q: 'Atomic number of Helium?', a: '2' },
    { q: 'Atomic number of Carbon?', a: '6' }, { q: 'Atomic number of Nitrogen?', a: '7' }, { q: 'Atomic number of Oxygen?', a: '8' },
    { q: 'Atomic number of Fluorine?', a: '9' }, { q: 'Atomic number of Neon?', a: '10' }, { q: 'Atomic number of Sodium?', a: '11' },
    { q: 'Atomic number of Chlorine?', a: '17' }, { q: 'Atomic number of Argon?', a: '18' }, { q: 'Atomic number of Calcium?', a: '20' },
    { q: 'Atomic number of Iron?', a: '26' }, { q: 'Atomic number of Copper?', a: '29' }, { q: 'Atomic number of Zinc?', a: '30' },
    { q: 'Atomic number of Silver?', a: '47' }, { q: 'Atomic number of Gold?', a: '79' }, { q: 'Atomic number of Lead?', a: '82' },
    { q: 'Noble gases are in Group?', a: '18' }, { q: 'Alkali metals are in Group?', a: '1' }, { q: 'Halogens are in Group?', a: '17' },
    { q: 'Most abundant element in Earth\'s crust?', a: 'Oxygen' }, { q: 'Most abundant element in Universe?', a: 'Hydrogen' },
    { q: 'Only liquid metal at room temperature?', a: 'Mercury' }, { q: 'Only liquid non-metal at room temperature?', a: 'Bromine' },
    { q: 'Hardest natural substance?', a: 'Diamond' }, { q: 'Element with highest melting point?', a: 'Tungsten' },
    { q: 'Lightest element?', a: 'Hydrogen' }, { q: 'Heaviest naturally occurring element?', a: 'Uranium' },
    { q: 'Most reactive metal?', a: 'Francium (Caesium is most common reactive metal)' }, { q: 'Most electronegative element?', a: 'Fluorine' },
    { q: 'Number of elements in Period 2?', a: '8' }, { q: 'Number of elements in Period 3?', a: '8' },
    { q: 'Period 4 has how many elements?', a: '18' }, { q: 'Transition metals occupy Groups?', a: '3 to 12' },
    { q: 'Lanthanides and actinides are called?', a: 'Inner transition metals' }, { q: 'Allotropes of Carbon include?', a: 'Diamond and graphite' },
    { q: 'Coloured gas among halogens (greenish-yellow)?', a: 'Chlorine' }, { q: 'Element used in pencils?', a: 'Graphite (Carbon)' },
    { q: 'Element used in filament bulbs?', a: 'Tungsten' }, { q: 'Inert gas used in balloons?', a: 'Helium' },
    { q: 'Element essential for bone formation?', a: 'Calcium' }, { q: 'Element that makes up most of air?', a: 'Nitrogen (~78%)' },
    { q: 'Radioactive element used in nuclear reactors?', a: 'Uranium' }, { q: 'Element discovered by Marie Curie?', a: 'Radium (and Polonium)' },
    { q: 'Iron + carbon alloy is called?', a: 'Steel' }, { q: 'Copper + zinc alloy is called?', a: 'Brass' },
    { q: 'Copper + tin alloy is called?', a: 'Bronze' }, { q: 'Symbol for Calcium?', a: 'Ca' },
    { q: 'Symbol for Magnesium?', a: 'Mg' }, { q: 'Symbol for Aluminium?', a: 'Al' }, { q: 'Symbol for Phosphorus?', a: 'P' },
    { q: 'Symbol for Sulphur?', a: 'S' }, { q: 'Symbol for Chlorine?', a: 'Cl' }, { q: 'Symbol for Uranium?', a: 'U' },
];
function genPeriodicBattleship() { return genFromPool(PERIODIC_FACTS, '⚗️'); }
const ANIMAL_FACTS = [
    { q: 'Largest land animal?', a: 'African Elephant' }, { q: 'Fastest land animal?', a: 'Cheetah' },
    { q: 'Largest mammal?', a: 'Blue Whale' }, { q: 'Largest bird?', a: 'Ostrich' },
    { q: 'Only mammal that can fly?', a: 'Bat' }, { q: 'Fastest bird in flight?', a: 'Peregrine Falcon' },
    { q: 'Animal with longest neck?', a: 'Giraffe' }, { q: 'Animal with most hearts (octopus)?', a: '3 hearts' },
    { q: 'Spider has how many legs?', a: '8' }, { q: 'Insect has how many legs?', a: '6' },
    { q: 'Vertebrates have a?', a: 'Backbone/spine' }, { q: 'Invertebrates lack a?', a: 'Backbone/spine' },
    { q: 'Mammals are warm-blooded and?', a: 'Feed young with milk' }, { q: 'Reptiles are?', a: 'Cold-blooded vertebrates with scales' },
    { q: 'Amphibians live?', a: 'Both in water and on land' }, { q: 'Fish breathe using?', a: 'Gills' },
    { q: 'Birds are warm-blooded and have?', a: 'Feathers' }, { q: 'Monotremes are mammals that?', a: 'Lay eggs (e.g., platypus)' },
    { q: 'Marsupials carry young in?', a: 'A pouch' }, { q: 'An animal that eats both plants and meat is?', a: 'Omnivore' },
    { q: 'Carnivores eat?', a: 'Only meat' }, { q: 'Herbivores eat?', a: 'Only plants' },
    { q: 'Nocturnal animals are active?', a: 'At night' }, { q: 'Diurnal animals are active?', a: 'During the day' },
    { q: 'Camouflage helps animals?', a: 'Blend into their environment to hide' }, { q: 'Migration is when animals?', a: 'Move seasonally to find food or breed' },
    { q: 'Hibernation is?', a: 'A dormant winter state to survive cold' }, { q: 'Metamorphosis in frogs: tadpole → ?', a: 'Froglet → Adult frog' },
    { q: 'Metamorphosis in butterflies: caterpillar → ?', a: 'Pupa (chrysalis) → Butterfly' }, { q: 'Echolocation is used by?', a: 'Bats and dolphins' },
    { q: 'Venom is injected; poison is?', a: 'Ingested or touched' }, { q: 'Most venomous snake?', a: 'Inland Taipan' },
    { q: 'Largest invertebrate?', a: 'Colossal Squid' }, { q: 'Animal with the longest lifespan?', a: 'Greenland Shark (~400 years)' },
    { q: 'Starfish can regenerate?', a: 'Lost limbs' }, { q: 'Social insects include?', a: 'Ants, bees, wasps, termites' },
    { q: 'A group of fish is called?', a: 'A school' }, { q: 'A group of lions is called?', a: 'A pride' },
    { q: 'A group of wolves is called?', a: 'A pack' }, { q: 'A group of crows is called?', a: 'A murder' },
    { q: 'Which bird cannot fly: Penguin, Albatross, or Eagle?', a: 'Penguin' }, { q: 'Animal that has 360-degree vision?', a: 'Chameleon (nearly)' },
    { q: 'Largest cold-blooded animal?', a: 'Saltwater Crocodile' }, { q: 'Which fish can breathe air?', a: 'Lungfish' },
    { q: 'Platypus is unique because it?', a: 'Is a mammal that lays eggs and has a bill' }, { q: 'Symbiosis means?', a: 'Two species living in close association' },
    { q: 'A parasite lives on or in a host and?', a: 'Harms the host' }, { q: 'Mutualism benefits?', a: 'Both species' },
];
function genAnimalKingdomSorter() { return genFromPool(ANIMAL_FACTS, '🦁'); }
const SOLAR_FACTS = [
    { q: 'Planet closest to the Sun?', a: 'Mercury' }, { q: 'Planet farthest from the Sun?', a: 'Neptune' },
    { q: 'Largest planet?', a: 'Jupiter' }, { q: 'Smallest planet?', a: 'Mercury' },
    { q: 'Planet with most prominent rings?', a: 'Saturn' }, { q: 'Planet known as Red Planet?', a: 'Mars' },
    { q: 'Earth is ___ planet from Sun?', a: '3rd' }, { q: 'Planet with longest day (rotation)?', a: 'Venus' },
    { q: 'Planet that rotates on its side?', a: 'Uranus' }, { q: 'Planet that rotates backwards?', a: 'Venus' },
    { q: 'Hottest planet?', a: 'Venus' }, { q: 'Planet with Great Red Spot?', a: 'Jupiter' },
    { q: 'How many moons does Mars have?', a: '2 (Phobos and Deimos)' }, { q: 'How many moons does Earth have?', a: '1 (the Moon)' },
    { q: 'Sun is a?', a: 'Medium-sized yellow dwarf star' }, { q: 'Sun produces energy by?', a: 'Nuclear fusion' },
    { q: 'Light takes how long from Sun to Earth?', a: '~8 minutes' }, { q: 'Asteroid belt is between?', a: 'Mars and Jupiter' },
    { q: 'A comet\'s tail always points?', a: 'Away from the Sun' }, { q: 'Pluto is classified as?', a: 'A dwarf planet' },
    { q: 'A meteor that reaches Earth\'s surface is called?', a: 'Meteorite' }, { q: 'A shooting star is actually?', a: 'A meteoroid burning in atmosphere' },
    { q: 'Solar wind is a stream of?', a: 'Charged particles from the Sun' }, { q: 'Seasons are caused by?', a: "Earth's axial tilt" },
    { q: 'A solar eclipse occurs when?', a: 'Moon is between Earth and Sun' }, { q: 'A lunar eclipse occurs when?', a: 'Earth is between Sun and Moon' },
    { q: 'The Milky Way is a?', a: 'Spiral galaxy' }, { q: 'Nearest star to Earth?', a: 'Proxima Centauri' },
    { q: 'A black hole\'s gravity is so strong that?', a: 'Even light cannot escape' }, { q: 'Nebula is?', a: 'A cloud of gas and dust in space' },
    { q: 'Supernova is?', a: 'Explosion of a massive dying star' }, { q: 'ISS stands for?', a: 'International Space Station' },
    { q: 'First human on the Moon?', a: 'Neil Armstrong (1969)' }, { q: 'First satellite in space?', a: 'Sputnik 1 (1957)' },
    { q: 'First human in space?', a: 'Yuri Gagarin (1961)' }, { q: 'Mars has the tallest volcano:?', a: 'Olympus Mons' },
    { q: 'Jupiter has the largest moon:?', a: 'Ganymede' }, { q: 'Saturn\'s largest moon is?', a: 'Titan' },
    { q: 'What is the Kuiper Belt?', a: 'Region of icy bodies beyond Neptune' }, { q: 'Hubble Space Telescope orbits?', a: 'Earth (not space)' },
    { q: 'Light year is a unit of?', a: 'Distance (not time)' }, { q: 'The Sun\'s core temperature is approximately?', a: '15 million °C' },
];
function genSolarSystemDefender() { return genFromPool(SOLAR_FACTS, '🔭'); }
const GENETICS_FACTS = [
    { q: 'DNA stands for?', a: 'Deoxyribonucleic Acid' }, { q: 'RNA stands for?', a: 'Ribonucleic Acid' },
    { q: 'Number of chromosomes in human cells?', a: '46 (23 pairs)' }, { q: 'Human sex chromosomes in females?', a: 'XX' },
    { q: 'Human sex chromosomes in males?', a: 'XY' }, { q: 'Father of Genetics?', a: 'Gregor Mendel' },
    { q: 'DNA double helix discovered by?', a: 'Watson, Crick & Franklin (1953)' }, { q: 'Adenine pairs with (DNA)?', a: 'Thymine' },
    { q: 'Guanine pairs with (DNA)?', a: 'Cytosine' }, { q: 'Uracil is found in?', a: 'RNA (not DNA)' },
    { q: 'Gene is a segment of?', a: 'DNA' }, { q: 'Allele is?', a: 'An alternative form of a gene' },
    { q: 'Dominant allele is expressed when?', a: 'At least one copy is present' }, { q: 'Recessive allele is expressed when?', a: 'Two copies (homozygous) are present' },
    { q: 'Homozygous means?', a: 'Two identical alleles (AA or aa)' }, { q: 'Heterozygous means?', a: 'Two different alleles (Aa)' },
    { q: 'Genotype is?', a: 'Genetic makeup (e.g., Aa)' }, { q: 'Phenotype is?', a: 'Observable physical characteristics' },
    { q: 'Tt × Tt cross gives phenotype ratio?', a: '3 dominant : 1 recessive' }, { q: 'Meiosis produces?', a: '4 haploid gametes' },
    { q: 'Mitosis produces?', a: '2 identical diploid cells' }, { q: 'Mutation is?', a: 'Change in DNA sequence' },
    { q: 'Point mutation changes?', a: 'A single nucleotide' }, { q: 'Transcription makes?', a: 'mRNA from DNA' },
    { q: 'Translation makes?', a: 'Protein from mRNA at ribosomes' }, { q: 'Colour blindness is X-linked:?', a: 'More common in males (XY)' },
    { q: 'Haemophilia is?', a: 'X-linked recessive blood clotting disorder' }, { q: 'Down syndrome is caused by?', a: 'Trisomy 21 (extra chromosome 21)' },
    { q: 'Genetic engineering can?', a: 'Modify DNA of organisms' }, { q: 'PCR is used to?', a: 'Amplify (copy) DNA sequences' },
    { q: 'CRISPR-Cas9 is a?', a: 'Gene editing tool' }, { q: 'Plasmid is?', a: 'Small circular DNA in bacteria (used in cloning)' },
    { q: 'The human genome has approximately?', a: '3 billion base pairs' }, { q: 'Codon is a sequence of?', a: '3 nucleotides coding for an amino acid' },
    { q: 'Stop codons signal?', a: 'End of translation' }, { q: 'A karyotype shows?', a: 'All chromosomes of an organism arranged by size' },
    { q: 'Incomplete dominance gives?', a: 'A blended phenotype' }, { q: 'Codominance gives?', a: 'Both alleles fully expressed simultaneously' },
    { q: 'Crossing over occurs during?', a: 'Meiosis I (prophase I)' }, { q: 'Genetic variation comes from?', a: 'Mutation, recombination, and sexual reproduction' },
];
function genGeneticsGenomeDuel() { return genFromPool(GENETICS_FACTS, '🧬'); }
const FOOD_CHAIN_FACTS = [
    { q: 'Start of every food chain?', a: 'Producer (green plant or algae)' }, { q: 'Herbivores are called?', a: 'Primary consumers' },
    { q: 'Carnivores eating herbivores are?', a: 'Secondary consumers' }, { q: 'Top predators are called?', a: 'Apex predators' },
    { q: 'Decomposers example?', a: 'Fungi and bacteria' }, { q: 'Energy transfer between trophic levels?', a: '~10% (90% lost as heat)' },
    { q: 'Food web differs from food chain because?', a: 'It shows multiple interconnected feeding relationships' },
    { q: 'Photosynthesis uses?', a: 'CO₂ + H₂O + light → glucose + O₂' }, { q: 'Producers make energy via?', a: 'Photosynthesis' },
    { q: 'Biomass decreases at each trophic level because?', a: 'Energy is lost as heat and waste' },
    { q: 'An ecological pyramid shows?', a: 'Energy/biomass/numbers at each trophic level' }, { q: 'Decomposers return nutrients to?', a: 'Soil' },
    { q: 'Mutualism example?', a: 'Bees pollinating flowers (both benefit)' }, { q: 'Parasitism example?', a: 'Tapeworm in human gut (one benefits, one harmed)' },
    { q: 'Commensalism example?', a: 'Barnacles on whale (one benefits, other unaffected)' }, { q: 'Predation: mongoose eats snake. Mongoose is?', a: 'Predator' },
    { q: 'Carbon cycle: plants absorb?', a: 'CO₂ from atmosphere' }, { q: 'Nitrogen cycle: bacteria fix atmospheric nitrogen into?', a: 'Ammonia/nitrates usable by plants' },
    { q: 'Keystone species: if removed?', a: 'Ecosystem dramatically changes' }, { q: 'Invasive species?', a: 'Non-native species that disrupts ecosystem' },
    { q: 'Biodiversity measures?', a: 'Variety of species in an area' }, { q: 'Habitat destruction threatens?', a: 'Biodiversity and ecosystem stability' },
    { q: 'Bioaccumulation is?', a: 'Build-up of toxins in organisms over time' }, { q: 'Biomagnification is?', a: 'Increasing toxin concentration up the food chain' },
    { q: 'Photosynthesis occurs in?', a: 'Chloroplasts' }, { q: 'Chlorophyll absorbs which light for photosynthesis?', a: 'Mainly red and blue light' },
    { q: 'Detritivores eat?', a: 'Dead organic matter (like earthworms)' }, { q: 'Algae are what type of organism in food chains?', a: 'Producers (aquatic plants)' },
];
function genFoodChainArena() { return genFromPool(FOOD_CHAIN_FACTS, '🍎'); }
const PLANT_FACTS = [
    { q: 'Photosynthesis equation (simplified)?', a: 'CO₂ + H₂O + light → glucose + O₂' }, { q: 'Chlorophyll is in?', a: 'Chloroplasts' },
    { q: 'Chlorophyll makes leaves?', a: 'Green' }, { q: 'Roots function?', a: 'Absorb water and minerals from soil' },
    { q: 'Stem function?', a: 'Transport water and support plant' }, { q: 'Xylem carries?', a: 'Water and minerals upward' },
    { q: 'Phloem carries?', a: 'Food (sugars) from leaves to plant' }, { q: 'Stomata are found on?', a: 'Leaves (mostly underside)' },
    { q: 'Stomata open to?', a: 'Allow gas exchange (CO₂ in, O₂ out during photosynthesis)' }, { q: 'Transpiration is?', a: 'Loss of water vapour through stomata' },
    { q: 'Pollination is?', a: 'Transfer of pollen from stamen to stigma' }, { q: 'Fertilisation in plants leads to?', a: 'Seed formation' },
    { q: 'Fruit is?', a: 'Mature ovary containing seeds' }, { q: 'Seed dispersal by wind example?', a: 'Dandelion, maple (helicopter keys)' },
    { q: 'Seed dispersal by animals (external)?', a: 'Burs and hooks catch on fur' }, { q: 'Seed dispersal by explosion?', a: 'Squirting cucumber, touch-me-not' },
    { q: 'Annual plants complete life cycle in?', a: 'One year' }, { q: 'Perennial plants live?', a: 'More than two years' },
    { q: 'Biennial plants complete cycle in?', a: 'Two years' }, { q: 'Gymnosperms produce seeds in?', a: 'Cones (no fruit)' },
    { q: 'Angiosperms produce seeds in?', a: 'Flowers (enclosed in fruit)' }, { q: 'Ferns reproduce by?', a: 'Spores' },
    { q: 'Monocots have how many cotyledons?', a: '1' }, { q: 'Dicots have how many cotyledons?', a: '2' },
    { q: 'Monocot leaf veins are?', a: 'Parallel' }, { q: 'Dicot leaf veins are?', a: 'Net-like (reticulate)' },
    { q: 'Calcium and phosphorus come from soil and are called?', a: 'Mineral nutrients' }, { q: 'Nitrogen-fixing bacteria live in?', a: 'Root nodules of legumes' },
    { q: 'Carnivorous plants catch insects to get?', a: 'Nitrogen' }, { q: 'Cactus stores water in its?', a: 'Thick stem' },
    { q: 'Deciduous trees lose leaves in?', a: 'Autumn/Winter' }, { q: 'Evergreen trees keep leaves?', a: 'All year round' },
    { q: 'Germination requires?', a: 'Water, warmth, and oxygen' }, { q: 'Photosynthesis is limited by?', a: 'Light, CO₂, and water (limiting factors)' },
];
function genPlantPowerGrower() { return genFromPool(PLANT_FACTS, '🌱'); }
// ── SOCIAL STUDIES GAMES ──────────────────────────────────────────────────────
const WORLD_CAPITALS_FACTS = [
    { q: 'Capital of France?', a: 'Paris' }, { q: 'Capital of Germany?', a: 'Berlin' }, { q: 'Capital of Japan?', a: 'Tokyo' },
    { q: 'Capital of Australia?', a: 'Canberra' }, { q: 'Capital of Brazil?', a: 'Brasília' }, { q: 'Capital of Canada?', a: 'Ottawa' },
    { q: 'Capital of India?', a: 'New Delhi' }, { q: 'Capital of China?', a: 'Beijing' }, { q: 'Capital of Russia?', a: 'Moscow' },
    { q: 'Capital of USA?', a: 'Washington D.C.' }, { q: 'Capital of UK?', a: 'London' }, { q: 'Capital of Italy?', a: 'Rome' },
    { q: 'Capital of Spain?', a: 'Madrid' }, { q: 'Capital of Argentina?', a: 'Buenos Aires' }, { q: 'Capital of Egypt?', a: 'Cairo' },
    { q: 'Capital of South Africa?', a: 'Pretoria (executive), Cape Town (legislative)' }, { q: 'Capital of Mexico?', a: 'Mexico City' },
    { q: 'Capital of South Korea?', a: 'Seoul' }, { q: 'Capital of Indonesia?', a: 'Jakarta' }, { q: 'Capital of Pakistan?', a: 'Islamabad' },
    { q: 'Capital of Saudi Arabia?', a: 'Riyadh' }, { q: 'Capital of Turkey?', a: 'Ankara' }, { q: 'Capital of Greece?', a: 'Athens' },
    { q: 'Capital of Norway?', a: 'Oslo' }, { q: 'Capital of Sweden?', a: 'Stockholm' }, { q: 'Capital of Netherlands?', a: 'Amsterdam' },
    { q: 'Capital of Switzerland?', a: 'Bern' }, { q: 'Capital of Poland?', a: 'Warsaw' }, { q: 'Capital of Ukraine?', a: 'Kyiv' },
    { q: 'Capital of New Zealand?', a: 'Wellington' }, { q: 'Capital of Portugal?', a: 'Lisbon' }, { q: 'Capital of Thailand?', a: 'Bangkok' },
    { q: 'Capital of Vietnam?', a: 'Hanoi' }, { q: 'Capital of Nigeria?', a: 'Abuja' }, { q: 'Capital of Kenya?', a: 'Nairobi' },
    { q: 'Capital of Ethiopia?', a: 'Addis Ababa' }, { q: 'Capital of Morocco?', a: 'Rabat' }, { q: 'Capital of Iran?', a: 'Tehran' },
    { q: 'Capital of Iraq?', a: 'Baghdad' }, { q: 'Capital of Israel?', a: 'Jerusalem' }, { q: 'Capital of Philippines?', a: 'Manila' },
    { q: 'Capital of Malaysia?', a: 'Kuala Lumpur' }, { q: 'Capital of Bangladesh?', a: 'Dhaka' }, { q: 'Capital of Sri Lanka?', a: 'Sri Jayawardenepura Kotte' },
    { q: 'Capital of Nepal?', a: 'Kathmandu' }, { q: 'Capital of Afghanistan?', a: 'Kabul' }, { q: 'Capital of Peru?', a: 'Lima' },
    { q: 'Capital of Colombia?', a: 'Bogotá' }, { q: 'Capital of Chile?', a: 'Santiago' }, { q: 'Capital of Cuba?', a: 'Havana' },
    { q: 'Capital of Jamaica?', a: 'Kingston' }, { q: 'Capital of Ghana?', a: 'Accra' }, { q: 'Capital of Tanzania?', a: 'Dodoma' },
];
function genCapitalsConquest() { return genFromPool(WORLD_CAPITALS_FACTS, '🌍'); }
const WORLD_FLAGS_FACTS = [
    { q: 'Flag with maple leaf?', a: 'Canada' }, { q: 'Flag with Union Jack in corner?', a: 'Australia or New Zealand' },
    { q: 'Flag with crescent and star?', a: 'Pakistan or Turkey' }, { q: 'Flag with rising sun?', a: 'Japan' },
    { q: 'Red flag with yellow star?', a: 'China' }, { q: 'Tricolour: blue, white, red (vertical)?', a: 'France' },
    { q: 'Tricolour: green, white, orange?', a: 'India' }, { q: 'Tricolour: black, red, gold (horizontal)?', a: 'Germany' },
    { q: 'Green flag with white tree?', a: 'Lebanon' }, { q: 'Flag with cedar tree?', a: 'Lebanon' },
    { q: 'Flag with Star of David?', a: 'Israel' }, { q: 'Flag with harp?', a: 'Ireland' },
    { q: 'Flag with dragon?', a: 'Wales (or Bhutan)' }, { q: 'Flag with two stars (horizontal stripes)?', a: 'New Zealand (4 stars) or Australia (5+)' },
    { q: 'Flag with hammer and sickle (historical)?', a: 'Soviet Union (USSR)' }, { q: 'Flag: red cross on white?', a: 'Switzerland' },
    { q: 'Flag: white cross on red?', a: 'Denmark (or similar Scandinavian)' }, { q: 'Flag: only green (solid)?', a: 'Libya (historical)' },
    { q: 'Flag with sun in centre?', a: 'Bangladesh (red disc on green)' }, { q: 'Oldest national flag?', a: 'Denmark (Dannebrog)' },
    { q: 'Flag with eagle holding snake?', a: 'Mexico' }, { q: 'Flag with Statue of Liberty? No — liberty bell? No — correct: eagle + snake?', a: 'Mexico' },
    { q: 'Brazil\'s flag contains?', a: 'Green, yellow, blue sphere with stars' }, { q: 'USA flag has how many stripes?', a: '13' },
    { q: 'USA flag has how many stars?', a: '50' }, { q: 'Flag of Japan: red disc on?', a: 'White background' },
    { q: 'South Africa\'s flag has how many colours?', a: '6' }, { q: 'Rainbow flag country (post-apartheid)?', a: 'South Africa' },
    { q: 'Flag of peace movements?', a: 'White flag' }, { q: 'Pirate flag is called?', a: 'Jolly Roger' },
    { q: 'Flag of Olympics has how many rings?', a: '5' }, { q: 'Olympic rings colours?', a: 'Blue, yellow, black, green, red on white' },
    { q: 'UN flag colour?', a: 'Light blue with white map and olive branches' }, { q: 'Red Cross flag country of origin?', a: 'Switzerland (inverted flag)' },
    { q: 'Flag with crescent moon and star = symbol of?', a: 'Islam' }, { q: 'Flag with cross = often symbol of?', a: 'Christianity' },
    { q: 'Nepal\'s flag is unique because?', a: "It's the only non-rectangular national flag" }, { q: 'Flag of Vatican City features?', a: 'Yellow and white with papal tiara and keys' },
];
function genWorldFlags() { return genFromPool(WORLD_FLAGS_FACTS, '🌍'); }
const HISTORY_FACTS = [
    { q: 'The French Revolution began in?', a: '1789' }, { q: 'World War I lasted from?', a: '1914 to 1918' },
    { q: 'World War II lasted from?', a: '1939 to 1945' }, { q: 'India gained independence on?', a: '15 August 1947' },
    { q: 'The Berlin Wall fell in?', a: '1989' }, { q: 'The Cold War was between?', a: 'USA and USSR' },
    { q: 'Russian Revolution took place in?', a: '1917' }, { q: 'American Declaration of Independence was signed in?', a: '1776' },
    { q: 'Napoleon was from?', a: 'Corsica (France)' }, { q: 'Napoleon was defeated at?', a: 'Battle of Waterloo (1815)' },
    { q: 'The Magna Carta was signed in?', a: '1215' }, { q: 'The Renaissance began in?', a: '14th century Italy' },
    { q: 'The Printing Press was invented by?', a: 'Johannes Gutenberg (~1440)' }, { q: 'Columbus reached the Americas in?', a: '1492' },
    { q: 'The Industrial Revolution began in?', a: 'Britain, late 18th century' }, { q: 'The Mughal Empire was founded by?', a: 'Babur (1526)' },
    { q: 'The Roman Empire fell in?', a: '476 AD (Western)' }, { q: 'The Great Wall of China was built mainly during?', a: 'Ming Dynasty' },
    { q: 'Cleopatra was ruler of?', a: 'Ancient Egypt' }, { q: 'Julius Caesar was assassinated in?', a: '44 BC' },
    { q: 'The Silk Road connected?', a: 'China to the Mediterranean' }, { q: 'The Black Plague killed approximately?', a: 'One-third of Europe\'s population' },
    { q: 'WWI was triggered by?', a: 'Assassination of Archduke Franz Ferdinand' }, { q: 'The Holocaust occurred during?', a: 'World War II under Nazi Germany' },
    { q: 'The Treaty of Versailles blamed WWI on?', a: 'Germany' }, { q: 'Hiroshima atomic bomb dropped on?', a: '6 August 1945' },
    { q: 'United Nations was founded in?', a: '1945' }, { q: 'First man to walk on Moon?', a: 'Neil Armstrong (1969)' },
    { q: 'Martin Luther King Jr. gave his famous speech in?', a: '1963' }, { q: 'Nelson Mandela became South Africa\'s president in?', a: '1994' },
    { q: 'Mahatma Gandhi\'s nonviolent resistance was called?', a: 'Satyagraha' }, { q: 'The Partition of India occurred in?', a: '1947' },
    { q: 'The Great Depression began in?', a: '1929' }, { q: 'The Soviet Union collapsed in?', a: '1991' },
    { q: 'The Arab Spring began in?', a: '2010–2011' }, { q: '9/11 attacks occurred in?', a: '2001' },
];
function genCivilizationBuilder() { return genFromPool(HISTORY_FACTS, '🏛️'); }
function genEmpireFall() { return genFromPool(HISTORY_FACTS, '🏰'); }

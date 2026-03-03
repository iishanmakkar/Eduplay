/**
 * Typing Speed Content Pool — Grade-Adaptive
 * 500+ grade-appropriate passages across 5 grade bands.
 * WPM formula: WPM = (correctChars / 5) / (elapsedSeconds / 60)
 * Accuracy: correctChars / totalChars (backspace handled by component)
 */

import { Question, ContentPool } from '../content-generator'
import { GradeBand, GradeMapper } from '../grade-mapper'
import { TYPING_DATA } from './typing-data'

export interface TypingSpeedQuestion extends Question {
    content: {
        text: string
        targetWpm: number
        grade: GradeBand
        charCount: number
    }
    correctAnswer: number // placeholder (0)
}

// ─── Grade-Appropriate Sentence Pools ─────────────────────────────────────────

const GRADE_SENTENCES: Record<GradeBand, string[]> = {
    K2: [
        'The cat sat on the mat.',
        'I like to run and play.',
        'The dog is big and brown.',
        'She has a red ball.',
        'We go to school today.',
        'The sun is hot and bright.',
        'My mom is very kind.',
        'I can see the blue sky.',
        'The bird can fly high.',
        'He has a new book.',
        'The fish swim in the sea.',
        'I eat an apple each day.',
        'The frog can jump far.',
        'We play in the park.',
        'The cow gives us milk.',
        'I love to read books.',
        'The tree has green leaves.',
        'She can run very fast.',
        'The bus is big and red.',
        'I see a star at night.',
        'The hen lays an egg.',
        'We sing a happy song.',
        'The rain falls from the sky.',
        'I have two hands and feet.',
        'The dog wags its tail.',
        'She draws a pretty flower.',
        'The baby is very small.',
        'I drink a glass of milk.',
        'The kite flies in the wind.',
        'We clean our room today.',
    ],
    '35': [
        'The library has thousands of books for students to read.',
        'Scientists study the stars and planets in our solar system.',
        'Plants need sunlight, water, and soil to grow properly.',
        'The ancient Egyptians built massive pyramids thousands of years ago.',
        'Butterflies go through four stages in their life cycle.',
        'The Pacific Ocean is the largest ocean on Earth.',
        'Fractions represent parts of a whole number.',
        'The human body has over two hundred bones.',
        'Electricity flows through wires to power our homes.',
        'Volcanoes erupt when hot magma pushes through the Earth\'s crust.',
        'The water cycle includes evaporation, condensation, and precipitation.',
        'Mammals are warm-blooded animals that feed their young with milk.',
        'The Amazon rainforest is home to millions of species.',
        'Gravity keeps the planets in orbit around the sun.',
        'Photosynthesis is the process by which plants make their own food.',
        'The Great Wall of China stretches thousands of kilometers.',
        'Sound travels as waves through the air.',
        'The moon orbits the Earth once every twenty-eight days.',
        'Fossils are the preserved remains of ancient living things.',
        'The heart pumps blood throughout the entire body.',
        'Continents are large landmasses separated by oceans.',
        'Insects have six legs and three body parts.',
        'The speed of light is about three hundred thousand kilometers per second.',
        'Earthquakes occur when tectonic plates shift beneath the surface.',
        'Rainbows form when sunlight passes through water droplets.',
        'The human brain controls all body functions.',
        'Deserts receive less than twenty-five centimeters of rain per year.',
        'Cells are the basic building blocks of all living organisms.',
        'The compass was invented in ancient China.',
        'Oxygen makes up about twenty-one percent of Earth\'s atmosphere.',
    ],
    '68': [
        'The Industrial Revolution transformed manufacturing and led to rapid urbanization across Europe.',
        'Newton\'s three laws of motion describe the relationship between force and acceleration.',
        'Photosynthesis converts carbon dioxide and water into glucose using solar energy.',
        'The French Revolution fundamentally changed the political landscape of Europe.',
        'DNA carries the genetic information that determines the traits of living organisms.',
        'The Pythagorean theorem states that the square of the hypotenuse equals the sum of the squares of the other two sides.',
        'Climate change is caused by the accumulation of greenhouse gases in the atmosphere.',
        'The periodic table organizes elements by their atomic number and chemical properties.',
        'Democracy originated in ancient Athens as a form of direct citizen participation.',
        'The human immune system defends the body against bacteria, viruses, and other pathogens.',
        'Tectonic plates move slowly over millions of years, shaping continents and oceans.',
        'Algebra uses variables and equations to solve mathematical problems.',
        'The Renaissance was a cultural movement that began in Italy during the fourteenth century.',
        'Ecosystems consist of living organisms interacting with their physical environment.',
        'The speed of sound varies depending on the medium through which it travels.',
        'Mitosis is the process by which cells divide to produce two identical daughter cells.',
        'The water cycle is driven by solar energy and gravity.',
        'Economic systems determine how resources are allocated within a society.',
        'The electromagnetic spectrum includes radio waves, microwaves, infrared, and visible light.',
        'Biodiversity refers to the variety of life forms found in a particular habitat.',
        'The Roman Empire at its peak controlled much of Europe, North Africa, and the Middle East.',
        'Chemical reactions involve the breaking and forming of bonds between atoms.',
        'The circulatory system transports oxygen and nutrients throughout the body.',
        'Probability measures the likelihood of an event occurring.',
        'The atmosphere protects Earth from harmful solar radiation.',
        'Plate tectonics explains the movement of continents over geological time.',
        'Literature reflects the values, beliefs, and experiences of a particular culture.',
        'The scientific method involves observation, hypothesis, experimentation, and conclusion.',
        'Fractions, decimals, and percentages are different ways of expressing parts of a whole.',
        'The human nervous system coordinates responses to stimuli from the environment.',
    ],
    '910': [
        'The theory of evolution by natural selection was proposed by Charles Darwin in 1859.',
        'Quadratic equations can be solved using the quadratic formula or by factoring.',
        'The French Revolution led to the rise of Napoleon Bonaparte and reshaped European politics.',
        'Cellular respiration converts glucose into ATP, the energy currency of the cell.',
        'The law of conservation of energy states that energy cannot be created or destroyed.',
        'Logarithms are the inverse of exponential functions and are used in many scientific calculations.',
        'The Industrial Revolution created new social classes and transformed economic relationships.',
        'Genetic inheritance follows patterns described by Gregor Mendel\'s laws.',
        'The speed of electromagnetic waves in a vacuum is approximately 299,792 kilometers per second.',
        'Linear equations represent straight lines when graphed on a coordinate plane.',
        'The Enlightenment emphasized reason, science, and individual rights over tradition.',
        'Oxidation-reduction reactions involve the transfer of electrons between chemical species.',
        'The central limit theorem states that the distribution of sample means approaches normal.',
        'Imperialism led to the colonization of Africa and Asia by European powers.',
        'Newton\'s law of universal gravitation describes the attractive force between masses.',
        'The human genome contains approximately three billion base pairs of DNA.',
        'Trigonometric functions relate the angles and sides of right triangles.',
        'The Cold War was a period of geopolitical tension between the United States and Soviet Union.',
        'Enzymes are biological catalysts that speed up chemical reactions in living cells.',
        'The Pythagorean theorem has applications in architecture, navigation, and engineering.',
        'Nationalism played a significant role in the unification of Germany and Italy.',
        'Electromagnetic induction is the principle behind electric generators and transformers.',
        'The binomial theorem provides a formula for expanding powers of binomials.',
        'Photosynthesis and cellular respiration are complementary processes in the carbon cycle.',
        'The American Civil War was fought over slavery and states\' rights.',
        'Probability distributions describe the likelihood of different outcomes in random experiments.',
        'The structure of DNA was discovered by Watson and Crick in 1953.',
        'Compound interest grows exponentially, making early saving extremely valuable.',
        'The French Revolution introduced the ideals of liberty, equality, and fraternity.',
        'Chemical equilibrium occurs when the rates of forward and reverse reactions are equal.',
    ],
    '1112': [
        'The fundamental theorem of calculus establishes the relationship between differentiation and integration.',
        'Quantum mechanics describes the behavior of particles at the subatomic level using probability.',
        'The French existentialist philosopher Jean-Paul Sartre argued that existence precedes essence.',
        'Stoichiometry involves calculating the quantities of reactants and products in chemical reactions.',
        'The Heisenberg uncertainty principle states that position and momentum cannot both be precisely known.',
        'Differential equations model the rate of change of quantities in physics, biology, and economics.',
        'The theory of relativity revolutionized our understanding of space, time, and gravity.',
        'Macroeconomics studies aggregate economic phenomena such as inflation, unemployment, and GDP.',
        'The human genome project mapped the complete sequence of human DNA over thirteen years.',
        'Complex numbers extend the real number system to include the square root of negative one.',
        'The second law of thermodynamics states that entropy in an isolated system always increases.',
        'Utilitarianism holds that the morally correct action is the one that maximizes overall happiness.',
        'Fourier analysis decomposes complex signals into simpler sinusoidal components.',
        'The structure of proteins is determined by the sequence of amino acids encoded in DNA.',
        'Game theory analyzes strategic interactions between rational decision-makers.',
        'The Krebs cycle is a series of chemical reactions used by cells to generate energy.',
        'Eigenvalues and eigenvectors are fundamental concepts in linear algebra and quantum mechanics.',
        'The philosophy of Immanuel Kant emphasized duty, reason, and the categorical imperative.',
        'Radioactive decay follows an exponential law characterized by the half-life of the isotope.',
        'The central dogma of molecular biology describes the flow of genetic information.',
        'Statistical inference allows conclusions about populations based on sample data.',
        'The Bohr model of the atom introduced quantized energy levels for electrons.',
        'Macbeth explores themes of ambition, guilt, and the corrupting influence of power.',
        'The Nash equilibrium is a concept in game theory where no player can benefit by changing strategy.',
        'Photovoltaic cells convert solar energy directly into electrical energy using semiconductors.',
        'The Riemann hypothesis is one of the most famous unsolved problems in mathematics.',
        'Epigenetics studies heritable changes in gene expression that do not involve DNA sequence changes.',
        'The tragedy of the commons describes how shared resources are depleted through individual self-interest.',
        'Bayesian inference updates probability estimates as new evidence becomes available.',
        'The structure of the universe is shaped by dark matter and dark energy.',
    ],
}

export class TypingSpeedContent {

    /**
     * Calculate time limit based on text length and target WPM
     * Time = (chars / 5 / targetWPM) * 60 * 1.5 buffer
     */
    private static calculateTimeLimit(text: string, targetWpm: number): number {
        const chars = text.length
        const words = chars / 5
        const minutes = words / targetWpm
        return Math.ceil(minutes * 60 * 1.5) // 1.5x buffer
    }

    /**
     * Generate grade-filtered content pool with correct WPM targets
     */
    static generateGradePool(grade: GradeBand): ContentPool {
        const gradeSentences = GRADE_SENTENCES[grade]

        // Also include sentences from typing-data.ts if available
        let extraSentences: string[] = []
        try {
            const diff = grade === 'K2' ? 'easy' : grade === '35' ? 'easy' : grade === '68' ? 'medium' : 'hard'
            extraSentences = TYPING_DATA?.sentences?.[diff] || []
        } catch { /* ignore */ }

        const allSentences = [...gradeSentences, ...extraSentences]

        // WPM targets by grade
        const wpmTargets = {
            K2: { easy: 10, medium: 15, hard: 20, challenge: 25 },
            '35': { easy: 20, medium: 30, hard: 40, challenge: 50 },
            '68': { easy: 30, medium: 45, hard: 55, challenge: 65 },
            '910': { easy: 40, medium: 55, hard: 65, challenge: 80 },
            '1112': { easy: 50, medium: 65, hard: 80, challenge: 100 },
        }

        const targets = wpmTargets[grade]

        const makeQuestion = (text: string, diff: 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE', idx: number): TypingSpeedQuestion => {
            const targetWpm = targets[diff.toLowerCase() as keyof typeof targets]
            return {
                id: `type-${grade}-${diff}-${idx}-${Date.now()}`,
                type: 'typing-speed',
                difficulty: diff,
                content: {
                    text,
                    targetWpm,
                    grade,
                    charCount: text.length,
                },
                correctAnswer: 0,
                timeLimit: GradeMapper.scaleTime(this.calculateTimeLimit(text, targetWpm), grade),
                points: diff === 'EASY' ? 10 : diff === 'MEDIUM' ? 20 : diff === 'HARD' ? 30 : 50
            }
        }

        const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5)
        const shuffled = shuffle(allSentences)
        const quarter = Math.max(1, Math.floor(shuffled.length / 4))

        return {
            easy: shuffled.slice(0, quarter).map((t, i) => makeQuestion(t, 'EASY', i)),
            medium: shuffled.slice(quarter, quarter * 2).map((t, i) => makeQuestion(t, 'MEDIUM', i)),
            hard: shuffled.slice(quarter * 2, quarter * 3).map((t, i) => makeQuestion(t, 'HARD', i)),
            challenge: shuffled.slice(quarter * 3).map((t, i) => makeQuestion(t, 'CHALLENGE', i)),
        }
    }

    /**
     * Legacy: generate flat content pool (defaults to grade '35')
     */
    static generateContentPool(grade: GradeBand = '35'): ContentPool {
        return this.generateGradePool(grade)
    }

    /**
     * Server-side WPM calculation (authoritative)
     * WPM = (correctChars / 5) / (elapsedSeconds / 60)
     */
    static calculateWPM(correctChars: number, elapsedSeconds: number): number {
        if (elapsedSeconds <= 0) return 0
        return Math.round((correctChars / 5) / (elapsedSeconds / 60))
    }

    /**
     * Server-side accuracy calculation
     * accuracy = correctChars / totalChars
     */
    static calculateAccuracy(correctChars: number, totalChars: number): number {
        if (totalChars <= 0) return 0
        return Math.round((correctChars / totalChars) * 100) / 100
    }
}

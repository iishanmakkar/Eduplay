
import { ContentPool, Question } from '../lib/game-engine/content-generator'
import { SpeedMathContent } from '../lib/game-engine/content-pools/speed-math'
import { ScienceQuizContent } from '../lib/game-engine/content-pools/science-quiz'
import { WorldFlagsContent } from '../lib/game-engine/content-pools/world-flags'
import { MemoryMatchContent } from '../lib/game-engine/content-pools/memory-match'
import { WordScrambleContent } from '../lib/game-engine/content-pools/word-scramble'
import { MemoryMatrixContent } from '../lib/game-engine/content-pools/memory-matrix'
import { ColorMatchContent } from '../lib/game-engine/content-pools/color-match'
import { LogicPuzzleContent } from '../lib/game-engine/content-pools/logic-puzzle'
import { PatternSequenceContent } from '../lib/game-engine/content-pools/pattern-sequence'
import { MemoryGridContent } from '../lib/game-engine/content-pools/memory-grid-advanced'

import { FocusChallengeContent } from '../lib/game-engine/content-pools/focus-challenge'
import { StrategyBuilderContent } from '../lib/game-engine/content-pools/strategy-builder'
import { CreativeStoryContent } from '../lib/game-engine/content-pools/creative-story'
import { CodeBreakerContent } from '../lib/game-engine/content-pools/code-breaker'
import { MathGridContent } from '../lib/game-engine/content-pools/math-grid'
import { VisualRotationContent } from '../lib/game-engine/content-pools/visual-rotation'
import { MiniStrategyContent } from '../lib/game-engine/content-pools/mini-strategy'
import { AnalogiesMasterContent } from '../lib/game-engine/content-pools/analogies-master'
import { AttentionSwitchContent } from '../lib/game-engine/content-pools/attention-switch'
import { TimePlannerContent } from '../lib/game-engine/content-pools/time-planner'
import { ShapeConstructorContent } from '../lib/game-engine/content-pools/shape-constructor'
import { RiddleSprintContent } from '../lib/game-engine/content-pools/riddle-sprint'
import { LogicGridContent } from '../lib/game-engine/content-pools/logic-grid'
import { KidsTypingTutorContent } from '../lib/game-engine/content-pools/kids-typing-tutor'
import { TypingSpeedContent } from '../lib/game-engine/content-pools/typing-speed'


// Map of [Name, Class]
const MODULES: [string, any][] = [
    ['SpeedMath', SpeedMathContent],
    ['ScienceQuiz', ScienceQuizContent],
    ['WorldFlags', WorldFlagsContent],
    ['MemoryMatch', MemoryMatchContent],
    ['WordScramble', WordScrambleContent],
    ['MemoryMatrix', MemoryMatrixContent],
    ['ColorMatch', ColorMatchContent],
    ['LogicPuzzle', LogicPuzzleContent],
    ['PatternSequence', PatternSequenceContent],
    ['MemoryGridAdvanced', MemoryGridContent],
    ['FocusChallenge', FocusChallengeContent],
    ['StrategyBuilder', StrategyBuilderContent],
    ['CreativeStory', CreativeStoryContent],
    ['CodeBreaker', CodeBreakerContent],
    ['MathGrid', MathGridContent],
    ['VisualRotation', VisualRotationContent],
    ['MiniStrategy', MiniStrategyContent],
    ['AnalogiesMaster', AnalogiesMasterContent],
    ['AttentionSwitch', AttentionSwitchContent],
    ['TimePlanner', TimePlannerContent],
    ['ShapeConstructor', ShapeConstructorContent],
    ['RiddleSprint', RiddleSprintContent],
    ['LogicGrid', LogicGridContent],
    ['KidsTypingTutor', KidsTypingTutorContent],
    ['TypingSpeed', TypingSpeedContent],
]

const ITERATIONS = 1000

async function runAudit() {
    console.log(`Starting Ruthless Audit on ${MODULES.length} modules...`)
    let totalErrors = 0

    for (const [name, Module] of MODULES) {
        console.log(`\nTesting ${name}...`)
        let moduleErrors = 0

        for (let i = 0; i < ITERATIONS; i++) {
            try {
                const pool: ContentPool = Module.generateContentPool()

                // Audit each difficulty
                for (const difficulty of ['easy', 'medium', 'hard', 'challenge'] as const) {
                    const questions = pool[difficulty] || []
                    if (questions.length === 0 && difficulty !== 'challenge') {
                        // Challenge triggers warning only
                        // console.warn(`  [${name}] No questions for ${difficulty}`)
                    }

                    for (const q of questions) {
                        const error = validateQuestion(q, name)
                        if (error) {
                            console.error(`  [FAIL] ${name} (${difficulty}): ${error}`)
                            console.error('  Payload:', JSON.stringify(q, null, 2))
                            moduleErrors++
                            totalErrors++
                            if (moduleErrors > 5) break // Stop spamming
                        }
                    }
                    if (moduleErrors > 5) break
                }
            } catch (e: any) {
                console.error(`  [CRASH] ${name} crashed during generation: ${e.message}`)
                moduleErrors++
                totalErrors++
            }
            if (moduleErrors > 5) break
        }

        if (moduleErrors === 0) {
            console.log(`  ✅ ${name} passed ${ITERATIONS} iterations safely.`)
        } else {
            console.log(`  ❌ ${name} FAILED with ${moduleErrors} errors.`)
        }
    }

    console.log(`\n--- Audit Complete ---`)
    console.log(`Total Errors Found: ${totalErrors}`)
    if (totalErrors > 0) process.exit(1)
}

function validateQuestion(q: Question, moduleName: string): string | null {
    // 1. Check for Null/Undefined in critical fields
    if (!q.id) return 'Missing ID'
    if (!q.type) return 'Missing Type'
    if (!q.content) return 'Missing Content'
    if (q.correctAnswer === undefined || q.correctAnswer === null) return 'Missing Correct Answer'

    // 2. Check for NaN in numerical fields
    if (typeof q.correctAnswer === 'number' && isNaN(q.correctAnswer)) return 'Correct Answer is NaN'

    // 3. Check for duplicates in options
    if (q.options && Array.isArray(q.options)) {
        if (new Set(q.options).size !== q.options.length) return 'Duplicate options detected'

        // 4. Check if correct answer is in options
        // If correctAnswer is an index (number)
        if (typeof q.correctAnswer === 'number' && q.type === 'multiple-choice') {
            if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
                return `Correct Answer index (${q.correctAnswer}) out of bounds (options: ${q.options.length})`
            }
        }

        // If correctAnswer is a value (string/number) matches option? 
        // Usually schema is index for multiple choice, value for others.
        // Let's assume standardized index for 'multiple-choice'.
        // Some games might use value matching.
    }

    // 5. Check content text for [object Object] or placeholders
    const contentStr = JSON.stringify(q.content)
    if (contentStr.includes('[object Object]')) return 'Content contains [object Object]'
    if (contentStr.includes('undefined')) return 'Content contains "undefined" string'
    if (contentStr.includes('NaN')) return 'Content contains "NaN" string'

    return null
}

runAudit().catch(console.error)

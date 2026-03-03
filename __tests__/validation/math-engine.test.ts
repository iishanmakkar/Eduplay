
import { MathEngine } from '../../lib/game-engine/math-engine';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'CHALLENGE'] as const;
// On CI use 50 iterations per difficulty (200 total); locally use 1000 (4000 total)
const ITERATIONS = process.env.CI === 'true' ? 50 : 1000;

describe('MathEngine Robustness Validation', () => {

    DIFFICULTIES.forEach(diff => {
        test(`should generate valid ${diff} problems (${ITERATIONS} runs)`, () => {
            let errors = 0;
            const allowNegatives = diff === 'ADVANCED' || diff === 'CHALLENGE';

            for (let i = 0; i < ITERATIONS; i++) {
                try {
                    const problem = MathEngine.generateProblem({
                        difficulty: diff,
                        allowNegatives: allowNegatives
                    });

                    // 1. Basic Type Checks
                    if (!problem || typeof problem.expression !== 'string' || typeof problem.answer !== 'number') {
                        console.error(`[FAIL] Invalid format`, problem);
                        errors++;
                        continue;
                    }

                    // 2. NaN / Infinity Check
                    if (!Number.isFinite(problem.answer)) {
                        console.error(`[FAIL] Non-finite answer: ${problem.answer} for ${problem.expression}`);
                        errors++;
                        continue;
                    }

                    // 3. Verify Calculation
                    const evalExpr = problem.expression
                        .replace(/×/g, '*')
                        .replace(/÷/g, '/');

                    // eslint-disable-next-line no-eval
                    const calculated = eval(evalExpr);

                    if (Math.abs(calculated - problem.answer) > 0.001) {
                        console.error(`[FAIL] Mismatch: ${problem.expression} = ${problem.answer}, calculated: ${calculated}`);
                        errors++;
                    }

                    // 4. Formatting Checks
                    if (problem.expression.includes('--')) {
                        console.error(`[FAIL] Double negative: ${problem.expression}`);
                        errors++;
                    }

                    if (/[\+\-\*\/]$/.test(evalExpr)) {
                        console.error(`[FAIL] Trailing operator: ${problem.expression}`);
                        errors++;
                    }

                } catch (e) {
                    console.error(`[CRITICAL] Exception generating problem for ${diff}:`, e);
                    errors++;
                }
            }

            expect(errors).toBe(0);
        });
    });
});

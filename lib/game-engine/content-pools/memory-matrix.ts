/**
 * Memory Matrix Content Pool
 * Progressive grid patterns with increasing difficulty
 */

import { Question, ContentPool } from '../content-generator'

export interface MemoryMatrixPattern extends Question {
    content: {
        gridSize: 3 | 4 | 5 | 6
        pattern: number[] // Indices of highlighted cells
        displayTime: number // milliseconds
        patternType: 'random' | 'sequence' | 'shape' | 'symmetric'
    }
    correctAnswer: number[]
}

export class MemoryMatrixContent {
    static generateContentPool(): ContentPool {
        return {
            easy: this.generatePatterns(3, 3, 'random'),
            medium: this.generatePatterns(4, 4, 'sequence'),
            hard: this.generatePatterns(5, 5, 'shape'),
            challenge: this.generatePatterns(6, 6, 'symmetric')
        }
    }

    private static generatePatterns(
        gridSize: 3 | 4 | 5 | 6,
        cellCount: number,
        patternType: 'random' | 'sequence' | 'shape' | 'symmetric'
    ): MemoryMatrixPattern[] {
        const patterns: MemoryMatrixPattern[] = []
        const totalCells = gridSize * gridSize
        const patternsToGenerate = 10

        for (let i = 0; i < patternsToGenerate; i++) {
            let pattern: number[] = []

            switch (patternType) {
                case 'random':
                    pattern = this.generateRandomPattern(totalCells, cellCount)
                    break
                case 'sequence':
                    pattern = this.generateSequencePattern(gridSize, cellCount)
                    break
                case 'shape':
                    pattern = this.generateShapePattern(gridSize)
                    break
                case 'symmetric':
                    pattern = this.generateSymmetricPattern(gridSize)
                    break
            }

            const difficulty = gridSize === 3 ? 'EASY' : gridSize === 4 ? 'MEDIUM' : gridSize === 5 ? 'HARD' : 'CHALLENGE'
            const displayTime = gridSize === 3 ? 2000 : gridSize === 4 ? 1500 : gridSize === 5 ? 1200 : 1000
            const points = gridSize === 3 ? 10 : gridSize === 4 ? 20 : gridSize === 5 ? 30 : 50

            patterns.push({
                id: `matrix-${gridSize}x${gridSize}-${patternType}-${i}`,
                type: 'memory-matrix',
                difficulty: difficulty as any,
                content: {
                    gridSize,
                    pattern,
                    displayTime,
                    patternType
                },
                correctAnswer: pattern,
                timeLimit: 30,
                points
            })
        }

        return patterns
    }

    private static generateRandomPattern(totalCells: number, count: number): number[] {
        const pattern: number[] = []
        const available = Array.from({ length: totalCells }, (_, i) => i)

        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * available.length)
            pattern.push(available[randomIndex])
            available.splice(randomIndex, 1)
        }

        return pattern.sort((a, b) => a - b)
    }

    private static generateSequencePattern(gridSize: number, count: number): number[] {
        const pattern: number[] = []
        let current = Math.floor(Math.random() * (gridSize * gridSize))

        for (let i = 0; i < count; i++) {
            pattern.push(current)
            // Move to adjacent cell
            const directions = [-1, 1, -gridSize, gridSize]
            const validDirections = directions.filter(d => {
                const next = current + d
                return next >= 0 && next < gridSize * gridSize && !pattern.includes(next)
            })

            if (validDirections.length > 0) {
                current = current + validDirections[Math.floor(Math.random() * validDirections.length)]
            }
        }

        return pattern
    }

    private static generateShapePattern(gridSize: number): number[] {
        const shapes = [
            // L-shape
            (size: number) => [0, size, size * 2, size * 2 + 1],
            // T-shape
            (size: number) => [0, 1, 2, size + 1],
            // Square
            (size: number) => [0, 1, size, size + 1],
            // Line
            (size: number) => [0, 1, 2, 3],
            // Diagonal
            (size: number) => Array.from({ length: Math.min(size, 4) }, (_, i) => i * (size + 1))
        ]

        const shape = shapes[Math.floor(Math.random() * shapes.length)]
        return shape(gridSize)
    }

    private static generateSymmetricPattern(gridSize: number): number[] {
        const pattern: number[] = []
        const halfCells = Math.floor((gridSize * gridSize) / 4)

        // Generate pattern for one quadrant
        for (let i = 0; i < halfCells; i++) {
            const row = Math.floor(Math.random() * Math.floor(gridSize / 2))
            const col = Math.floor(Math.random() * Math.floor(gridSize / 2))
            const index = row * gridSize + col

            if (!pattern.includes(index)) {
                pattern.push(index)
                // Mirror horizontally
                pattern.push(row * gridSize + (gridSize - 1 - col))
                // Mirror vertically
                pattern.push((gridSize - 1 - row) * gridSize + col)
                // Mirror both
                pattern.push((gridSize - 1 - row) * gridSize + (gridSize - 1 - col))
            }
        }

        return [...new Set(pattern)].sort((a, b) => a - b)
    }
}

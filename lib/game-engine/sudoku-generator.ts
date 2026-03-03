
export class SudokuGenerator {
    static generate(size: number = 4, difficulty: string = 'MEDIUM'): { grid: number[][], solution: number[][] } {
        // 1. Generate a valid solved grid using backtracking
        const solution = this.createSolvedGrid(size)

        // 2. Remove numbers to create the puzzle
        const grid = solution.map(row => [...row])
        const attempts = difficulty === 'EASY' ? 4 : difficulty === 'MEDIUM' ? 8 : 10

        for (let i = 0; i < attempts; i++) {
            let row = Math.floor(Math.random() * size)
            let col = Math.floor(Math.random() * size)
            while (grid[row][col] === 0) {
                row = Math.floor(Math.random() * size)
                col = Math.floor(Math.random() * size)
            }
            grid[row][col] = 0
        }

        return { grid, solution }
    }

    private static createSolvedGrid(size: number): number[][] {
        const grid = Array(size).fill(0).map(() => Array(size).fill(0))
        this.solveSudoku(grid, size)
        return grid
    }

    private static solveSudoku(grid: number[][], size: number): boolean {
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= size; num++) {
                        if (this.isValid(grid, row, col, num, size)) {
                            grid[row][col] = num
                            if (this.solveSudoku(grid, size)) return true
                            grid[row][col] = 0
                        }
                    }
                    return false
                }
            }
        }
        return true
    }

    private static isValid(grid: number[][], row: number, col: number, num: number, size: number): boolean {
        // Check row
        for (let x = 0; x < size; x++) {
            if (grid[row][x] === num) return false
        }

        // Check col
        for (let x = 0; x < size; x++) {
            if (grid[x][col] === num) return false
        }

        // Check box (assuming 4x4 is 2x2 boxes, 9x9 is 3x3)
        const boxSize = Math.sqrt(size)
        const startRow = row - row % boxSize
        const startCol = col - col % boxSize

        for (let i = 0; i < boxSize; i++) {
            for (let j = 0; j < boxSize; j++) {
                if (grid[i + startRow][j + startCol] === num) return false
            }
        }

        return true
    }
}

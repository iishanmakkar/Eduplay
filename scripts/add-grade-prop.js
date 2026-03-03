const fs = require('fs')
const path = require('path')

const gamesDir = path.join(process.cwd(), 'components', 'games')
const files = fs.readdirSync(gamesDir).filter(f => f.endsWith('.tsx') && f !== 'SpeedMath.tsx')

const importLine = `import { GradeBand } from '@/lib/game-engine/grade-mapper'`
const gradePropLine = `    grade?: GradeBand`
const gradeDefaultLine = `    grade = '35'`

let updated = 0, skipped = 0

for (const filename of files) {
    const filePath = path.join(gamesDir, filename)
    let content = fs.readFileSync(filePath, 'utf8')

    // Skip if already has grade-mapper
    if (content.includes('grade-mapper')) { skipped++; continue }

    // Skip if doesn't call generateContentPool
    if (!content.includes('generateContentPool')) { skipped++; continue }

    let modified = false

    // 1. Add import after last import line (find last 'import' line)
    if (!content.includes('grade-mapper')) {
        // Add before the first blank line after imports
        content = content.replace(
            /^((?:import [^\n]+\n)+)/m,
            (match) => match + importLine + '\n'
        )
        modified = true
    }

    // 2. Add grade prop to interface (after 'difficulty?: 1 | 2 | 3 | 4')
    if (!content.includes('grade?: GradeBand')) {
        content = content.replace(
            '    difficulty?: 1 | 2 | 3 | 4',
            `    difficulty?: 1 | 2 | 3 | 4\n${gradePropLine}`
        )
        modified = true
    }

    // 3. Add grade default to destructuring
    if (!content.includes("grade = '35'")) {
        if (content.includes('mode = SessionMode.STANDARD')) {
            content = content.replace(
                'mode = SessionMode.STANDARD\n}',
                `mode = SessionMode.STANDARD,\n${gradeDefaultLine}\n}`
            )
            modified = true
        } else if (content.includes('mode = SessionMode.STANDARD\r\n}')) {
            content = content.replace(
                'mode = SessionMode.STANDARD\r\n}',
                `mode = SessionMode.STANDARD,\r\n${gradeDefaultLine}\r\n}`
            )
            modified = true
        }
    }

    // 4. Pass grade to generateContentPool()
    if (content.includes('generateContentPool()')) {
        content = content.replaceAll('generateContentPool()', 'generateContentPool(grade)')
        modified = true
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log('UPDATED:', filename)
        updated++
    } else {
        console.log('SKIP:', filename)
        skipped++
    }
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`)

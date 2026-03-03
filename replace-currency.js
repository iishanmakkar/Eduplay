const fs = require('fs')
const path = require('path')

const directoriesToScan = ['app', 'components', 'lib/emails', 'lib/game-engine']
const baseDir = process.cwd()

const replacements = [
    { from: /₹3,999/g, to: '$49' },
    { from: /₹15,999/g, to: '$199' },
    { from: /₹47,999/g, to: '$599' },
    { from: /₹500\/month/g, to: '$5/month' },
    { from: /₹500/g, to: '$5' },
    { from: /currency: 'INR'/g, to: "currency: 'USD'" },
    { from: /currency: '₹'/g, to: "currency: '$'" },
    { from: /₹999/g, to: '$14' },
    { from: /₹9,990/g, to: '$140' },
    { from: /₹4,999/g, to: '$79' },
    { from: /₹49,990/g, to: '$790' },
    { from: /₹19,999/g, to: '$299' },
    { from: /₹199,990/g, to: '$2,990' },
    { from: /₹\$\{/g, to: '$${' },
    { from: /₹/g, to: '$' }
]

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file)
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist)
        } else {
            if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
                filelist.push(filepath)
            }
        }
    })
    return filelist
}

directoriesToScan.forEach(dir => {
    const fullDir = path.join(baseDir, dir)
    if (!fs.existsSync(fullDir)) return
    const files = walkSync(fullDir)

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8')
        let modified = false

        replacements.forEach(({ from, to }) => {
            if (from.test(content)) {
                content = content.replace(from, to)
                modified = true
            }
        })

        if (modified) {
            fs.writeFileSync(file, content, 'utf8')
            console.log(`Updated: ${file.replace(baseDir, '')}`)
        }
    })
})

console.log('Currency sweep completed.')

const fs = require('fs');

if (fs.existsSync('lint_report.json')) {
    const data = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));
    console.log('--- LINT ERRORS ---');
    data.forEach(file => {
        if (file.errorCount > 0) {
            console.log(`\nFILE: ${file.filePath}`);
            file.messages.forEach(msg => {
                if (msg.severity === 2) {
                    console.log(`  Line ${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})`);
                }
            });
        }
    });
}

if (fs.existsSync('build_report.log')) {
    console.log('\n--- BUILD ERRORS ---');
    const buildLog = fs.readFileSync('build_report.log', 'utf8');
    const lines = buildLog.split('\n');
    const errorLines = lines.filter(l => l.toLowerCase().includes('error'));
    console.log(errorLines.join('\n').substring(0, 3000));
}

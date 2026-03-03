const { spawn } = require('child_process');

const lint = spawn('npm.cmd', ['run', 'lint'], { shell: true });

let output = '';

lint.stdout.on('data', (data) => {
    const str = data.toString();
    output += str;
    // Log file paths found in output
    const lines = str.split('\n');
    lines.forEach(line => {
        if (line.match(/^(\.\/|[a-zA-Z]:).*\.(ts|tsx|js|jsx)/)) {
            console.log(`Potential file: ${line.trim()}`);
        }
        if (line.includes('Error')) {
            console.log(`ERROR FOUND: ${line.trim()}`);
        }
    });
});
// Also stderr
lint.stderr.on('data', (data) => console.error(data.toString()));

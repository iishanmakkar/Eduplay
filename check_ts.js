const fs = require('fs')
const ts = require('typescript')

const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json')
const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './')

const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options)
const diagnostics = ts.getPreEmitDiagnostics(program)

const errors = diagnostics.map(d => {
    if (d.file) {
        const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start)
        const message = ts.flattenDiagnosticMessageText(d.messageText, '\n')
        return `${d.file.fileName} (${line + 1},${character + 1}): ${message}`
    } else {
        return ts.flattenDiagnosticMessageText(d.messageText, '\n')
    }
})

fs.writeFileSync('clean_ts_errors.txt', errors.join('\n'))

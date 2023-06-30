import * as vscode from 'vscode'
import * as path from 'path'
import * as findUp from 'find-up'
import { configFiles } from './vitest-config-files'

function getCwd(testFile: string) {
    const configFilePath = findUp.sync(configFiles, { cwd: testFile })

    if (!configFilePath) {
        return
    }
    return path.dirname(configFilePath)
}

function buildVitestArgs({
    caseName,
    casePath,
    sanitize = true,
    watch = false,
}: {
    caseName: string | RegExp
    casePath: string
    sanitize?: boolean
    watch?: boolean
}) {
    let sanitizedCasePath = casePath
    if (sanitize) {
        sanitizedCasePath = JSON.stringify(casePath)
        caseName = JSON.stringify(caseName)
    }

    const args = [
        'vitest',
        watch ? 'watch' : 'run',
        '-t',
        caseName,
        '--dir',
        sanitizedCasePath,
    ]

    const rootDir = getCwd(casePath)
    if (rootDir) {
        args.push('--root', rootDir)
    }

    return args
}

let runTerminal: vscode.Terminal | undefined
let watchTerminal: vscode.Terminal | undefined

function getOrCreateTerminal(name: string): Promise<vscode.Terminal> {
    const existingTerminal = vscode.window.terminals.find(
        (terminal) => terminal.name === name
    )

    if (existingTerminal) {
        return new Promise(async (resolve) => {
            const processId = await existingTerminal.processId
            if (processId) {
                existingTerminal.sendText('\x03') // Ctrl+C to stop the process
            }

            setTimeout(() => {
                resolve(existingTerminal)
            }, 100)
        })
    }

    return new Promise((resolve) => {
        vscode.window.createTerminal(name)
        const disposable = vscode.window.onDidOpenTerminal((terminal) => {
            if (terminal.name === name) {
                disposable.dispose() // Dispose the event listener
                resolve(terminal)
            }
        })
    })
}

function sendToTerminal(terminal: vscode.Terminal, text: string) {
    terminal.sendText(text)
    terminal.show(true)
}

export async function runInTerminal(
    text: string,
    filename: string,
    opts: { watch?: boolean } = {}
) {
    const { watch } = opts
    const casePath = path.dirname(filename)
    const vitestArgs = buildVitestArgs({
        caseName: text,
        casePath: casePath,
        watch,
    })
    const npxArgs = ['npx', ...vitestArgs].join(' ')

    if (watch) {
        watchTerminal = await getOrCreateTerminal('Vitest Watcher')
        sendToTerminal(watchTerminal, npxArgs)
    } else {
        runTerminal = await getOrCreateTerminal('Vitest Runner')
        sendToTerminal(runTerminal, npxArgs)
    }
}

function buildDebugConfig(
    casePath: string,
    text: string
): vscode.DebugConfiguration {
    return {
        name: 'Vitest Debugger',
        request: 'launch',
        runtimeArgs: buildVitestArgs({
            caseName: text,
            casePath: casePath,
            sanitize: false,
        }),
        cwd: getCwd(casePath) || casePath,
        runtimeExecutable: 'npx',
        skipFiles: ['<node_internals>/**'],
        type: 'pwa-node',
        console: 'integratedTerminal',
        internalConsoleOptions: 'neverOpen',
    }
}

export function debugInTermial(text: string, filename: string) {
    const casePath = path.dirname(filename)
    const config = buildDebugConfig(casePath, text)
    vscode.debug.startDebugging(undefined, config)
}

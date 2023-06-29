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

export function runInTerminal(
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
    const npxArgs = ['npx', ...vitestArgs]

    let runTerminalAlreadyExists = true
    let watchTerminalAlreadyExists = true

    if (watch) {
        if (!watchTerminal || watchTerminal.exitStatus) {
            watchTerminalAlreadyExists = false
            watchTerminal?.dispose()
            watchTerminal = vscode.window.createTerminal('Vitest Watcher')
        }

        if (watchTerminalAlreadyExists) {
            // CTRL-C to stop the previous run
            watchTerminal.sendText('\x03')
        }

        watchTerminal.sendText(npxArgs.join(' '))
        watchTerminal.show(true)
    } else {
        if (!runTerminal || runTerminal.exitStatus) {
            runTerminalAlreadyExists = false
            runTerminal?.dispose()
            runTerminal = vscode.window.createTerminal('Vitest Runner')
        }

        if (runTerminalAlreadyExists) {
            // CTRL-C to stop the previous run
            runTerminal.sendText('\x03')
        }

        runTerminal.sendText(npxArgs.join(' '))
        runTerminal.show(true)
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

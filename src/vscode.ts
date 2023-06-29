import * as vscode from 'vscode'
import { debugInTermial, runInTerminal } from './run'

export class RunVitestCommand implements vscode.Command {
    static ID = 'vitest.runTest'
    title = 'Run'
    command = RunVitestCommand.ID
    arguments?: [string, string]

    constructor(text: string, filename: string) {
        this.arguments = [text, filename]
    }
}

export class WatchVitestCommand implements vscode.Command {
    static ID = 'vitest.watchTest'
    title = 'Watch'
    command = WatchVitestCommand.ID
    arguments?: [string, string]

    constructor(text: string, filename: string) {
        this.arguments = [text, filename]
    }
}

export class DebugVitestCommand implements vscode.Command {
    static ID = 'vitest.debugTest'
    title = 'Debug'
    command = DebugVitestCommand.ID
    arguments?: [string, string]

    constructor(text: string, filename: string) {
        this.arguments = [text, filename]
    }
}

vscode.commands.registerCommand(
    RunVitestCommand.ID,
    (text: string, filename: string) => {
        runInTerminal(text, filename)
    }
)

vscode.commands.registerCommand(
    WatchVitestCommand.ID,
    (text: string, filename: string) => {
        runInTerminal(text, filename, { watch: true })
    }
)

vscode.commands.registerCommand(
    DebugVitestCommand.ID,
    (text: string, filename: string) => {
        debugInTermial(text, filename)
    }
)

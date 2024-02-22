import * as shell from 'shelljs'
import logger from './logger'

export class ExecOptions {
    cwd?: string
    ignoreReturnCode?: boolean
    silent?: boolean

    constructor(cwd?: string, ignoreReturnCode?: boolean, silent?: boolean) {
        this.cwd = cwd || ''
        this.ignoreReturnCode = ignoreReturnCode || false
        this.silent = silent || false
    }
}

export class ExecOutput {
    stdout: string
    stderr: string
    exitCode: number

    constructor() {
        this.stdout = ''
        this.stderr = ''
        this.exitCode = 0
    }
}

export function exec(commandLine: string, args?: string[], options?: ExecOptions): Promise<number> {
    return new Promise((resolve, reject) => {
        // Construct the full command by joining the command line and its arguments
        const fullCommand = args && args.length > 0 ? `${commandLine} ${args.join(' ')}` : commandLine

        // Execute the command using ShellJS
        const result = shell.exec(fullCommand, {
            silent: options?.silent || false,
            cwd: options?.cwd
        })

        // Check the result and resolve or reject the promise
        if (options?.ignoreReturnCode || result.code === 0) {
            resolve(result.code)
        } else {
            reject(new Error(`Command "${fullCommand}" exited with code ${result.code}`))
        }
    })
}

// Function to execute a shell command and capture its output
export function getExecOutput(commandLine: string, args?: string[], options?: ExecOptions): Promise<ExecOutput> {
    return new Promise((resolve, reject) => {
        // Construct the full command by joining the command line and its arguments
        const fullCommand = args && args.length > 0 ? `${commandLine} ${args.join(' ')}` : commandLine
        logger.info(`Executing command: ${fullCommand}`)

        // Execute the command using ShellJS with output capturing
        const result = shell.exec(fullCommand, {
            silent: options?.silent || false,
            cwd: options?.cwd || "",        
        })

        // Create an instance of ExecOutput with the captured output and exit code
        const execOutput = new ExecOutput()
        execOutput.stdout = result.stdout
        execOutput.stderr = result.stderr
        execOutput.exitCode = result.code

        // Resolve the promise with the execution output
        if (options?.ignoreReturnCode || result.code === 0) {
            resolve(execOutput)
        } else {
            reject(new Error(`Command "${fullCommand}" exited with code ${result.code}`))
        }
    })
}

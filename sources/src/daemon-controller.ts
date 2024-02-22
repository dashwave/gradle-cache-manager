import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import {BuildResult} from './build-results'
import logger from './logger'

export class DaemonController {
    private readonly gradleHomes

    constructor(buildResults: BuildResult[]) {
        const allHomes = buildResults.map(buildResult => buildResult.gradleHomeDir)
        this.gradleHomes = Array.from(new Set(allHomes))
    }

    async stopAllDaemons(): Promise<void> {
        logger.info('Stopping all Gradle daemons before saving Gradle User Home state')

        const executions: Promise<number>[] = []
        const args = ['--stop']

        for (const gradleHome of this.gradleHomes) {
            const executable = path.resolve(gradleHome, 'bin', 'gradle')
            if (!fs.existsSync(executable)) {
                logger.warning(`Gradle executable not found at ${executable}. Could not stop Gradle daemons.`)
                continue
            }
            logger.info(`Stopping Gradle daemons for ${gradleHome}`)
            executions.push(
                exec.exec(executable, args, {
                    ignoreReturnCode: true
                })
            )
        }
        await Promise.all(executions)
    }
}

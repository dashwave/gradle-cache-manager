import * as setupGradle from '../setup-gradle'
import * as execution from '../execution'
import * as provisioner from '../provision'
import * as layout from '../repository-layout'
import * as params from '../input-params'
import logger from '../logger'
import state from '../state'
import { log } from 'console'
import {PostActionJobFailure} from '../errors'

/**
 * The main entry point for the action, called by Github Actions for the step.
 */
function handleFailure(error: unknown): void {
    logger.warning(`Unhandled error in Gradle post-action - job will continue: ${error}`)
    if (error instanceof Error && error.stack) {
        logger.info(error.stack)
    }
}


export async function run(): Promise<void> {
    try {
        // Configure Gradle environment (Gradle User Home)
        await setupGradle.setup()

        // // Download and install Gradle if required
        // logger.info('Provisioning Gradle')
        // const executable = await provisioner.provisionGradle()

        // // Only execute if arguments have been provided
        // const args: string[] = params.getArguments()
        // if (args.length > 0) {
        //     const buildRootDirectory = layout.buildRootDirectory()
        //     await execution.executeGradleBuild(executable, buildRootDirectory, args)
        // }
    } catch (error) {
        logger.error(String(error))
        if (error instanceof Error && error.stack) {
            logger.info(error.stack)
        }
    }

    // logger.info('Gradle action execution complete')

    // try {
    //     await setupGradle.complete()
    // } catch (error) {
    //     if (error instanceof PostActionJobFailure) {
    //         logger.error(error.message)
    //     } else {
    //         handleFailure(error)
    //     }
    // }

    // Explicit process.exit() to prevent waiting for hanging promises.
    process.exit()
}

run()

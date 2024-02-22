import {
    isCacheCleanupEnabled,
    isCacheDisabled,
    isCacheReadOnly,
    isCacheWriteOnly,
    isCacheOverwriteExisting
} from './cache-utils'
import {CacheListener} from './cache-reporting'
import {DaemonController} from './daemon-controller'
import {GradleStateCache} from './cache-base'
import {CacheCleaner} from './cache-cleaner'
import logger from './logger'
import state from './state'

const CACHE_RESTORED_VAR = 'GRADLE_BUILD_ACTION_CACHE_RESTORED'

export async function restore(userHome: string, gradleUserHome: string, cacheListener: CacheListener): Promise<void> {
    // Bypass restore cache on all but first action step in workflow.
    if (process.env[CACHE_RESTORED_VAR]) {
        logger.info('Cache only restored on first action step.')
        return
    }
    state.set(CACHE_RESTORED_VAR, true)

    const gradleStateCache = new GradleStateCache(userHome, gradleUserHome)

    if (isCacheDisabled()) {
        logger.info('Cache is disabled: will not restore state from previous builds.')
        // Initialize the Gradle User Home even when caching is disabled.
        gradleStateCache.init()
        cacheListener.cacheDisabled = true
        return
    }

    if (gradleStateCache.cacheOutputExists()) {
        if (!isCacheOverwriteExisting()) {
            logger.info('Gradle User Home already exists: will not restore from cache.')
            // Initialize pre-existing Gradle User Home.
            gradleStateCache.init()
            cacheListener.cacheDisabled = true
            cacheListener.cacheDisabledReason = 'disabled due to pre-existing Gradle User Home'
            return
        }
        logger.info('Gradle User Home already exists: will overwrite with cached contents.')
    }

    logger.info("initialising gradle state cache")
    gradleStateCache.init()
    // Mark the state as restored so that post-action will perform save.
    state.set(CACHE_RESTORED_VAR, true)

    if (isCacheWriteOnly()) {
        logger.info('Cache is write-only: will not restore from cache.')
        cacheListener.cacheWriteOnly = true
        return
    }

    logger.info('Restoring cache from remote')
    await gradleStateCache.restore(cacheListener)

    if (isCacheCleanupEnabled() && !isCacheReadOnly()) {
        logger.info('Preparing cache for cleanup.')
        const cacheCleaner = new CacheCleaner(gradleUserHome, process.env['RUNNER_TEMP']!)
        await cacheCleaner.prepare()
    }
}

export async function save(
    userHome: string,
    gradleUserHome: string,
    cacheListener: CacheListener,
    daemonController: DaemonController
): Promise<void> {
    if (isCacheDisabled()) {
        logger.info('Cache is disabled: will not save state for later builds.')
        return
    }

    if (!state.get(CACHE_RESTORED_VAR)) {
        logger.info('Cache will not be saved: not restored in main action step.')
        return
    }

    if (isCacheReadOnly()) {
        logger.info('Cache is read-only: will not save state for use in subsequent builds.')
        cacheListener.cacheReadOnly = true
        return
    }

    await daemonController.stopAllDaemons()

    if (isCacheCleanupEnabled()) {
        logger.info('Forcing cache cleanup.')
        const cacheCleaner = new CacheCleaner(gradleUserHome, process.env['RUNNER_TEMP']!)
        try {
            await cacheCleaner.forceCleanup()
        } catch (e) {
            logger.warning(`Cache cleanup failed. Will continue. ${String(e)}`)
        }
    }

    return new GradleStateCache(userHome, gradleUserHome).save(cacheListener)
}

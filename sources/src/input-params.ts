import {parseArgsStringToArgv} from 'string-argv'
import state from './state'

export function isCacheDisabled(): boolean {
    return getBooleanInput('cache-disabled')
}

export function isCacheReadOnly(): boolean {
    return getBooleanInput('cache-read-only')
}

export function isCacheWriteOnly(): boolean {
    return getBooleanInput('cache-write-only')
}

export function isCacheOverwriteExisting(): boolean {
    return getBooleanInput('cache-overwrite-existing')
}

export function isCacheStrictMatch(): boolean {
    return getBooleanInput('gradle-home-cache-strict-match')
}

export function isCacheDebuggingEnabled(): boolean {
    return process.env['GRADLE_BUILD_ACTION_CACHE_DEBUG_ENABLED'] ? true : false
}

export function isCacheCleanupEnabled(): boolean {
    return getBooleanInput('gradle-home-cache-cleanup')
}

export function getCacheEncryptionKey(): string {
    return state.getInput('cache-encryption-key')
}

export function getCacheIncludes(): string[] {
    return state.getMultilineInput('gradle-home-cache-includes')
}

export function getCacheExcludes(): string[] {
    return state.getMultilineInput('gradle-home-cache-excludes')
}

export function getBuildRootDirectory(): string {
    return state.getInput('build-root-directory')
}

export function getGradleVersion(): string {
    return state.getInput('gradle-version')
}

export function getArguments(): string[] {
    const input = state.getInput('arguments')
    return parseArgsStringToArgv(input)
}

// Internal parameters
export function getJobMatrix(): string {
    return state.getInput('workflow-job-context')
}

export function getGithubToken(): string {
    return state.getInput('github-token')
}

export function isJobSummaryEnabled(): boolean {
    return getBooleanInput('generate-job-summary', true)
}

export function getJobSummaryOption(): JobSummaryOption {
    return parseJobSummaryOption('add-job-summary')
}

export function getPRCommentOption(): JobSummaryOption {
    return parseJobSummaryOption('add-job-summary-as-pr-comment')
}

export function getBuildScanPublishEnabled(): boolean {
    return getBooleanInput('build-scan-publish')
}

export function getBuildScanTermsOfServiceUrl(): string {
    return state.getInput('build-scan-terms-of-service-url')
}

export function getBuildScanTermsOfServiceAgree(): string {
    return state.getInput('build-scan-terms-of-service-agree')
}

function parseJobSummaryOption(paramName: string): JobSummaryOption {
    const val = state.getInput(paramName)
    switch (val.toLowerCase().trim()) {
        case 'never':
            return JobSummaryOption.Never
        case 'always':
            return JobSummaryOption.Always
        case 'on-failure':
            return JobSummaryOption.OnFailure
    }
    throw TypeError(`The value '${val}' is not valid for ${paramName}. Valid values are: [never, always, on-failure].`)
}

export function getDependencyGraphOption(): DependencyGraphOption {
    const val = state.getInput('dependency-graph')
    switch (val.toLowerCase().trim()) {
        case 'disabled':
            return DependencyGraphOption.Disabled
        case 'generate':
            return DependencyGraphOption.Generate
        case 'generate-and-submit':
            return DependencyGraphOption.GenerateAndSubmit
        case 'generate-and-upload':
            return DependencyGraphOption.GenerateAndUpload
        case 'download-and-submit':
            return DependencyGraphOption.DownloadAndSubmit
        case 'clear':
            return DependencyGraphOption.Clear
    }
    throw TypeError(
        `The value '${val}' is not valid for 'dependency-graph'. Valid values are: [disabled, generate, generate-and-submit, generate-and-upload, download-and-submit, clear]. The default value is 'disabled'.`
    )
}

export function getDependencyGraphContinueOnFailure(): boolean {
    return getBooleanInput('dependency-graph-continue-on-failure', true)
}

export function getArtifactRetentionDays(): number {
    const val = state.getInput('artifact-retention-days')
    return parseNumericInput('artifact-retention-days', val, 0)
    // Zero indicates that the default repository settings should be used
}

export function parseNumericInput(paramName: string, paramValue: string, paramDefault: number): number {
    if (paramValue.length === 0) {
        return paramDefault
    }
    const numericValue = parseInt(paramValue)
    if (isNaN(numericValue)) {
        throw TypeError(`The value '${paramValue}' is not a valid numeric value for '${paramName}'.`)
    }
    return numericValue
}

function getBooleanInput(paramName: string, paramDefault = false): boolean {
    const paramValue = state.getInput(paramName)
    switch (paramValue.toLowerCase().trim()) {
        case '':
            return paramDefault
        case 'false':
            return false
        case 'true':
            return true
    }
    throw TypeError(`The value '${paramValue} is not valid for '${paramName}. Valid values are: [true, false]`)
}

export enum DependencyGraphOption {
    Disabled = 'disabled',
    Generate = 'generate',
    GenerateAndSubmit = 'generate-and-submit',
    GenerateAndUpload = 'generate-and-upload',
    DownloadAndSubmit = 'download-and-submit',
    Clear = 'clear'
}

export enum JobSummaryOption {
    Never = 'never',
    Always = 'always',
    OnFailure = 'on-failure'
}

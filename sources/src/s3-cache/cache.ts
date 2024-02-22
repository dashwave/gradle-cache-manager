export class ValidationError extends Error {}
export class ReserveCacheError extends Error {}

export function isFeatureAvailable(): boolean {
    return true
}

export async function restoreCache(
    paths: string[],
    primaryKey: string,
    restoreKeys?: string[]
): Promise<CacheEntry | undefined> {
    return new Promise((resolve, reject) => {
        resolve(new CacheEntry('key', 0))
    })
}

export async function saveCache(paths: string[], key: string): Promise<CacheEntry> {
    return new Promise((resolve, reject) => {
        resolve(new CacheEntry('key', 0))
    })
}

export class CacheEntry {
    key: string
    size?: number
    constructor(key: string, size?: number) {
        this.key = key
        this.size = size
    }
}

import fg from 'fast-glob'
import {createHash} from 'crypto'
import {promises as fsPromises} from 'fs'
const {readFile} = fsPromises

export async function hashFiles(pattern: string): Promise<string> {
    // Use fast-glob to find files that match the pattern
    const files = await fg(pattern, {absolute: true})

    // Sort files to ensure consistent hash ordering
    files.sort()

    const hash = createHash('sha256')

    // Read and hash each file's content
    for (const file of files) {
        const content = await readFile(file)
        hash.update(content)
    }

    // Return the resulting hash digest
    return hash.digest('hex')
}

export class GlobOptions {
    implicitDescendants?: boolean
}

export function create(patterns: string | string[], options?: GlobOptions): Globber {
    return new Globber(patterns, options)
}

class Globber {
    private patterns: string | string[]
    private options: GlobOptions

    constructor(patterns: string | string[], options?: GlobOptions) {
        this.patterns = patterns
        this.options = options || {}
    }

    async glob(): Promise<string[]> {
        let effectivePatterns = this.patterns

        // If implicitDescendants is true, modify the patterns to include '**' if not already present
        if (this.options.implicitDescendants) {
            effectivePatterns = this.addImplicitDescendants(this.patterns)
        }

        return fg(effectivePatterns, {
            dot: true, // Example option, include more as needed
            onlyFiles: true,            
        })
    }

    async *globGenerator(): AsyncGenerator<string, void, undefined> {
        let effectivePatterns = this.patterns

        if (this.options.implicitDescendants) {
            effectivePatterns = this.addImplicitDescendants(this.patterns)
        }

        for await (const entry of fg.stream(effectivePatterns, {dot: true})) {
            yield entry as string
        }
    }

    private addImplicitDescendants(patterns: string | string[]): string[] {
        const ensureDescendants = (pattern: string): string => {
            // If the pattern does not end with '**', append it
            return pattern.endsWith('**') ? pattern : `${pattern}/**`
        }

        if (Array.isArray(patterns)) {
            return patterns.map(ensureDescendants)
        } else {
            return [ensureDescendants(patterns)]
        }
    }
}

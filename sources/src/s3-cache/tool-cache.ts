export async function extractZip(downloadPath: string, extPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        resolve(extPath)
    })
}

export async function downloadTool(downloadUrl: string, downloadPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        resolve(downloadPath)
    })
}

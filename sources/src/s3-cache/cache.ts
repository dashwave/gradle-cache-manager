import AWS from 'aws-sdk';
import fs from 'fs';
import extract from 'extract-zip';
import archiver from 'archiver';
import logger from '../logger';
import state from '../state';
import { log } from 'console';
import path from 'path';
import { int } from 'aws-sdk/clients/datapipeline';
import { cat } from 'shelljs';
import fetch from 'node-fetch';

export class ValidationError extends Error { }
export class ReserveCacheError extends Error { }


const bucketName = state.getInput("cache-bucket") || '';

export function isFeatureAvailable(): boolean {
    return true
}

export async function restoreCache(paths: string[], primaryKey: string, restoreKeys: string[] = []): Promise<CacheEntry | undefined> {
    const keys = [primaryKey, ...restoreKeys];

    const gradleUserHome = state.get("gradle-user-home") || '';


    for (const key of keys) {
        try {
            const cacheManagerUrl = state.getInput("cache-manager-endpoint")!;
            const response = await fetch(`${cacheManagerUrl}/api/v1/cache/restore/${key}`);
            const statusCode = response.status;
            const data = await response.json();
            switch (statusCode) {
                case 200:
                    const cachePath = data.path;
                    if (fs.existsSync(cachePath)) {
                        const metadataPath = data.metadata_file_path;
                        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                        const srcFiles = metadata.files.map((file: string) => path.resolve(cachePath, file));
                        const destFiles = metadata.files.map((file: string) => path.resolve(gradleUserHome, file));

                        const timeCpStarted = Date.now();
                        srcFiles.forEach((file: string, idx: int) => {
                            if (fs.existsSync(file)) {
                                fs.cpSync(file, destFiles[idx], {
                                    recursive: true
                                });
                            }
                        })
                        logger.info("restored cache to " + gradleUserHome)
                        logger.info("time taken to restore cache: " + (Date.now() - timeCpStarted) + "ms")

                        return new CacheEntry(key, 0);
                    } else {
                        logger.error("cache path returned by cache-manager not found: " + cachePath)
                    }
                    break;
                case 201:
                    logger.info("response from cache manager: " + data);
                    logger.info("try again, restoring from remote")
                    logger.info(`waiting for ${data.retry_time} secs before retrying`)
                    // sleep
                    await delay(data.retry_time * 1000);
                    return await restoreCache(paths, primaryKey, restoreKeys);
                case 404:
                    logger.info("response from cache manager: " + data);
                    logger.info(`Cache not found for key: ${key}`);
                    break;
                default:
                    logger.error(`error from cache manager: ${data}`);
            }
        } catch (error) {
            logger.error(`Failed restore cache request to cache manager: ${error}`)
        }

    }

    return undefined; // Return undefined if none of the keys resulted in a successful cache restore
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export async function saveCache(paths: string[], key: string): Promise<CacheEntry> {
    // const zipFileName = `${key}.zip`;
    // const output = fs.createWriteStream(zipFileName);
    // const archive = archiver('zip', { zlib: { level: 9 } });

    // archive.pipe(output);

    // logger.info(`Creating cache for key: ${key} for files: ${paths}`);    


    logger.info(`Creating cache for key: ${key} for files: ${paths}`);

    const gradleUserHome = state.get("gradle-user-home") || '';
    // const filenames = paths.map(path => path.replace(gradleUserHome, '')); // Remove the user home from the path
    // // Append files to the archive
    // paths.forEach((path, idx) => {
    //     if(fs.existsSync(path)){
    //         if(fs.statSync(path).isDirectory()){
    //             archive.directory(path, filenames[idx]);
    //             return;
    //         }else if(fs.statSync(path).isFile()){
    //             archive.file(path, { name: filenames[idx] });
    //             return;
    //         }
    //     }
    // });
    // await archive.finalize();

    // await new Promise<void>((resolve, reject) => {
    //     output.on('finish', resolve);
    //     output.on('error', reject);
    // });

    // const zipStats = fs.statSync(zipFileName);
    // const zipFileContent = fs.createReadStream(zipFileName);

    // await s3.upload({
    //     Bucket: bucketName,
    //     Key: zipFileName,
    //     Body: zipFileContent
    // }).promise();

    // fs.unlinkSync(zipFileName);
    const cacheSharedDirectory = state.getInput("cache-shared-directory")!;
    const cachePath = path.resolve(cacheSharedDirectory, key);

    const filenames = paths.map(p => path.relative(gradleUserHome, p)); // Remove the user home from the path
    // Append files to the archive

    const timeCpStarted = Date.now();
    paths.forEach((p, idx) => {
        if (fs.existsSync(p)) {
            fs.cpSync(p, path.resolve(cachePath, filenames[idx]), {
                recursive: true
            });
        }
    });
    logger.info("saved cache to " + cachePath)
    logger.info("time taken to save cache: " + (Date.now() - timeCpStarted) + "ms")

    // save a metadata file in the same directory
    fs.writeFileSync(path.resolve(cachePath, "metadata.json"), JSON.stringify({
        "cache-key": key,
        "files": filenames,
        "entry-time": new Date().toISOString()
    }))

    // make an api call to cache server to save the cache
    const cacheManagerUrl = state.getInput("cache-manager-endpoint")!;
    const postData = {
        "key": key,
        "path": cachePath,
        "metadata_file_path": path.resolve(cachePath, "metadata.json"),
        "save_to_remote":true,
        "overwrite_remote":true
    }
    try {
        const response = await fetch(`${cacheManagerUrl}/api/v1/cache/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });
        const statusCode = response.status;
        const data = response.body.read();
        logger.info("response from cache manager: " + data);
        if (statusCode !== 200) {
            throw new Error(`Failed to save cache: ${data}`);
        }
        return new CacheEntry(key, 0);
    } catch (error) {
        throw new Error(`Failed to complete save cache request to cache manager: ${error}`);
    }
}

export class CacheEntry {
    key: string
    size?: number
    constructor(key: string, size?: number) {
        this.key = key
        this.size = size
    }
}

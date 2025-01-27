import path from 'node:path'
import fs from 'node:fs/promises'
import fsSync, { existsSync } from 'node:fs'
import { createSlug } from './utils/create-slug'
import ytdl from '@distube/ytdl-core'
import ytpl from '@distube/ytpl'
import pLimit, { LimitFunction } from 'p-limit'

interface DownloadOptions {
    format?: string
    concurrency?: number
}

interface PlaylistItem {
    id: string;
    url: string;
    url_simple: string;
    title: string;
    thumbnail: string;
    duration: string | null;
    author: {
        name: string;
        ref: string;
    } | null;
}[]

interface DownloadResult {
    success: boolean;
    error?: string;
}

export class YoutubeDownloader {
    private static readonly DEFAULT_FORMAT = '.mp3'
    private static readonly DEFAULT_CONCURRENCY = 30
    private static readonly VERSION = '1.0.0'

    private outputFolder: string
    private url: URL
    private readonly limit: LimitFunction

    public constructor(url: string, outputFolder: string, options?: DownloadOptions) {
        this.validateInputs(url, outputFolder)
        this.url = new URL(url)
        this.outputFolder = outputFolder
        this.limit = pLimit(options?.concurrency ?? YoutubeDownloader.DEFAULT_CONCURRENCY)
    }

    private validateInputs(url: string, outputFolder: string) {
        if (!url || !outputFolder) {
            throw new Error('URL and output folder are required')
        }
    }

    private async ensureOutputFolder(): Promise<void> {
        if (!existsSync(this.outputFolder)) {
            await fs.mkdir(this.outputFolder, {recursive: true})
        }
    }

    private getOutputPath(title: string, format: string) {
        return path.join(this.outputFolder, createSlug(title) + format)
    }
    
    public async downloadSingle(url: string, title: string, format: string = YoutubeDownloader.DEFAULT_FORMAT): Promise<DownloadResult> {
        const outputPath = this.getOutputPath(title, format)

        try {
            await new Promise<void>((resolve, reject) => {
                const writeStream = fsSync.createWriteStream(outputPath)
                const stream = ytdl(url, { filter: 'audioonly' })
                
                stream.on('error', reject)
                writeStream.on('error', reject)
                writeStream.on('finish', resolve)

                stream.pipe(writeStream)
            })

            return { success: true }
        } catch (error) {
            await fs.unlink(outputPath).catch(() => {})
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
        
    }

    async downloadPlaylist() {
        const playlistId = this.url.searchParams.get('list')
        if (!playlistId) {
            throw new Error('The provided URL is not a playlist')
        }

        await this.ensureOutputFolder()
        console.log(`Youtube Downloader ${YoutubeDownloader.VERSION}`)

        const { items, title } = await ytpl(playlistId)
        console.log('Downloading playlist:', title)
        
        const results = await Promise.all(
            items.map(item => 
                this.limit(() => this.downloadSingle(item.shortUrl, item.title)) // note: in type definitions, doesn't exists this prop, but on the return of items, exists. 
              )
        )
        this.logResults(results, items)
    }

    private logResults(results: DownloadResult[], items: PlaylistItem[]) {
        const successCount = results.filter(({success}) => success).length
        console.log(`Downloaded ${successCount}/${items.length} musics successfully`)

        const failures = results.map((result, index) => ({ result, item: items[index] })).filter(({ result }) => !result.success)

        if (failures.length > 0) {
            console.log('\nFailed Downloads:')
            for (const { result, item } of failures) {
                console.error(`- ${item.title}: ${result.error}`)
            }
        }
    }
}
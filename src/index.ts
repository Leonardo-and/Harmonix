import { YoutubeDownloader } from './downloader'

const downloader = new YoutubeDownloader(process.argv[2], process.argv[3])

downloader.downloadPlaylist()
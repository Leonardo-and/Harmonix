# Harmonix

A YouTube music downloader optimized with a concurrency system to prevent system overload.

## 🚀 Features

- Download YouTube videos as MP3
- Queue system with concurrent processing
- Limit on simultaneous downloads
- Playlist support
- Command-line interface
- (Soon) Download videos from Youtube and other platforms

## 📋 Prerequisites

- Node.js 18.x or higher
- Internet connection

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/Leonardo-and/youtube-music-downloader.git
cd youtube-music-downloader
```

2. Install dependencies:
```bash
npm install
```

## 💻 Usage

### Example:

```bash
npm start "<youtube-video/playlist-url>" "<output-path>"
```

## 📦 Main Dependencies

- `ytdl-core`: For downloading YouTube videos
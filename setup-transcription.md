# Integrated Vosk Transcription Setup Guide

## Overview
The video transcription functionality is now **integrated directly into your Next.js application**. No need for separate backend services!

## ✅ What's Already Done

1. **Dependencies installed** - All Vosk and FFmpeg dependencies are added to your project
2. **API routes created** - Transcription endpoints are integrated into your Next.js API
3. **Database schema updated** - `AdTranscript` model is ready
4. **UI components updated** - Preview modal with transcript functionality

## 🚀 Simple Setup (Single Service)

### 1. Install Vosk Package
```bash
npm install vosk-koffi
```

### 2. Start Your Application
```bash
npm run dev
```
That's it! Everything runs on **one port** (your Next.js app).

## 📁 Directory Structure

Your project now includes:
```
your-app/
├── src/
│   ├── lib/
│   │   └── vosk-transcription.ts     # Integrated Vosk service
│   └── app/api/v1/
│       ├── download-video/           # Video download API
│       ├── transcribe/
│       │   ├── video/                # Main transcription API
│       │   └── status/               # Check Vosk status
│       └── ads/[adId]/transcript/    # Cached transcripts
├── temp/                             # Temporary files (auto-cleaned)
├── vosk-models/                      # Downloaded language models
└── ...
```

## 🎯 How It Works

1. **User clicks "Get Transcript"** in the preview modal
2. **API downloads video** temporarily to `/temp/` directory
3. **FFmpeg extracts audio** from video (16kHz WAV format)
4. **Vosk transcribes audio** using downloaded language models
5. **Transcript saved** to database for future use
6. **Cleanup** - temporary files are automatically deleted
7. **UI displays** the transcript with copy functionality

## 🌍 Language Support (16+ Languages)

The system automatically downloads language models on first use:

| Language | Code | Size | Auto-Download |
|----------|------|------|---------------|
| English (US) | `en-us` | 40MB | ✅ |
| Spanish | `es` | 39MB | ✅ |
| French | `fr` | 41MB | ✅ |
| German | `de` | 45MB | ✅ |
| Chinese | `zh-cn` | 42MB | ✅ |
| Italian | `it` | 48MB | ✅ |
| Portuguese | `pt` | 31MB | ✅ |
| Hindi | `hi` | 42MB | ✅ |
| Japanese | `ja` | 48MB | ✅ |
| Korean | `ko` | 82MB | ✅ |
| Arabic | `ar` | 318MB | ✅ |
| Turkish | `tr` | 35MB | ✅ |
| Dutch | `nl` | 39MB | ✅ |
| Vietnamese | `vi` | 32MB | ✅ |
| Ukrainian | `uk` | 133MB | ✅ |
| Russian | `ru` | 45MB | ✅ |

## 🔧 API Endpoints

All endpoints are integrated into your Next.js app:

- **`GET /api/v1/transcribe/status`** - Check Vosk availability and models
- **`POST /api/v1/transcribe/video`** - Transcribe video from URL
- **`GET /api/v1/ads/[adId]/transcript`** - Get cached transcript
- **`POST /api/v1/download-video`** - Download video with CORS handling

## ✨ Features

- ✅ **Single Service** - Everything in your Next.js app
- ✅ **16+ Languages** - Automatic model downloads
- ✅ **Database Caching** - No re-processing needed
- ✅ **Automatic Cleanup** - Temporary files deleted after use
- ✅ **Beautiful UI** - Loading states and error handling
- ✅ **Copy Transcript** - One-click copy functionality
- ✅ **CORS Handling** - Download videos from any source
- ✅ **Error Fallbacks** - Multiple download methods

## 🐛 Troubleshooting

### Check Vosk Status
```bash
curl http://localhost:3001/api/v1/transcribe/status
```

### Common Issues

1. **"Vosk not available"**
   ```bash
   npm install vosk-koffi
   ```

2. **FFmpeg not found**
   - Windows: Install from https://ffmpeg.org/
   - Mac: `brew install ffmpeg`
   - Linux: `apt install ffmpeg`

3. **Permission errors**
   - Ensure `/temp/` and `/vosk-models/` directories are writable

4. **Large model downloads**
   - First transcription per language downloads the model
   - Subsequent uses are instant

## 🎉 Usage

1. **Open any video ad** in the preview modal
2. **Click "Get Transcript"** (button appears only for videos)
3. **Wait for processing** (with beautiful loading UI)
4. **View and copy transcript** when complete

## 📊 Benefits vs. Separate Backend

| Feature | Integrated ✅ | Separate Backend ❌ |
|---------|---------------|-------------------|
| Setup Complexity | Simple | Complex |
| Port Management | Single port | Two ports |
| Dependencies | One `package.json` | Two projects |
| Deployment | Single deploy | Deploy two services |
| Development | `npm run dev` | Start two services |
| Maintenance | One codebase | Two codebases |

Your transcription functionality is now **fully integrated** and ready to use! 🚀 
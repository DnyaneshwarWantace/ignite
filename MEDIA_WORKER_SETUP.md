# Automatic Media Worker Setup

The media worker now automatically processes pending ads and uploads them to Cloudinary in the background. Here are the different ways to run it:

## Option 1: Automatic with Dev Server (Recommended)

Use the new combined script that starts both Next.js and the media worker:

```bash
npm run dev:worker
```

This will:
- ✅ Start the Next.js development server
- ✅ Automatically start the media worker in the background
- ✅ Process pending ads every 2 minutes
- ✅ Show colored output to distinguish between Next.js and media worker logs
- ✅ Handle graceful shutdown when you press Ctrl+C

## Option 2: Manual Separate Processes

If you prefer to run them separately:

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Media Worker:**
```bash
npm run media-worker
```

## Option 3: API Control

You can also control the media worker via API endpoints:

**Start the worker:**
```bash
curl -X POST http://localhost:3000/api/v1/media/worker \
  -H "Content-Type: application/json" \
  -d '{"intervalMinutes": 2}'
```

**Check status:**
```bash
curl http://localhost:3000/api/v1/media/worker
```

**Stop the worker:**
```bash
curl -X DELETE http://localhost:3000/api/v1/media/worker
```

## How It Works

1. **Automatic Detection**: When new ads are scraped, they get `mediaStatus = "pending"`
2. **Background Processing**: The worker checks for pending ads every 2 minutes
3. **Smart Upload**: Downloads media from Facebook URLs and uploads to Cloudinary
4. **Database Update**: Updates ads with local Cloudinary URLs
5. **Retry Logic**: Failed uploads are retried up to 3 times
6. **Fallback**: Frontend shows original URLs if local processing fails

## Monitoring

Check the console output for:
- `🔄 Processing X pending ads...` - Worker is running
- `✅ Batch complete: X success, Y failed` - Processing results
- `📸 Processing media for ad: ...` - Individual ad processing
- `❌ Error messages` - Any issues that need attention

## Configuration

The worker processes **5 ads per batch** every **2 minutes** by default. You can adjust this in:
- `scripts/media-worker.js` - Change batch size
- API calls - Change interval minutes
- `scripts/dev-with-worker.js` - Modify startup behavior

## Benefits

✅ **No Manual Work**: Media processing happens automatically  
✅ **Fast Scraping**: No waiting for media downloads during scraping  
✅ **Reliable Storage**: Local Cloudinary URLs prevent broken Facebook links  
✅ **Scalable**: Handles large volumes without blocking the main app  
✅ **Resilient**: Automatic retries and error handling  
✅ **Monitoring**: Clear logs and status endpoints
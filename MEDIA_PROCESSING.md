# Media Processing System

This system implements a scalable approach to handle media from Facebook ads, similar to how big tools like Foreplay and Later work.

## How It Works

### Step 1: Scrape → Save Metadata + Media URLs
- When scraping ads, we save the ad text and Facebook media URLs immediately
- All new ads get `mediaStatus = "pending"`
- No waiting for downloads during scraping

### Step 2: Background Worker (Media Downloader)
- Runs every 2 minutes by default
- Fetches ads with `mediaStatus = "pending"`
- Downloads images/videos from Facebook URLs
- Uploads to Cloudinary for permanent storage
- Updates database with local URLs and status

### Step 3: Frontend Uses Local URLs
- LazyAdCard component prioritizes local Cloudinary URLs
- Falls back to original Facebook URLs if local not available
- Shows placeholders for failed media

## Database Schema

New fields added to `Ad` model:
```prisma
localImageUrl    String?   // Cloudinary image URL
localVideoUrl    String?   // Cloudinary video URL
mediaStatus      String    // pending, processing, success, failed
mediaDownloadedAt DateTime?
mediaError       String?   // Error message if failed
mediaRetryCount  Int       // Number of retry attempts (max 3)
```

## API Endpoints

### Process Media Manually
```
POST /api/v1/media/process
{
  "action": "process-single",
  "adId": "ad_id_here"
}
```

```
POST /api/v1/media/process
{
  "action": "process-batch",
  "batchSize": 10
}
```

### Get Processing Statistics
```
GET /api/v1/media/process
```

### Start Background Worker
```
POST /api/v1/media/worker
{
  "intervalMinutes": 2
}
```

## Running the Background Worker

### Option 1: NPM Script
```bash
npm run media-worker
```

### Option 2: API Endpoint
```bash
curl -X POST https://ignite-jade.vercel.app/api/v1/media/worker \
  -H "Content-Type: application/json" \
  -d '{"intervalMinutes": 2}'
```

## Configuration

Add to your `.env` file:
```env
CLOUDINARY_CLOUD_NAME=dwzdr8ei9
CLOUDINARY_API_KEY=741397439758848
CLOUDINARY_API_SECRET=kOPze_jNVA8xgTAA5GsjSTMLLig
```

## Benefits

✅ **Fast Scraping**: No waiting for media downloads
✅ **Reliable Media**: Local storage prevents broken Facebook links
✅ **Scalable**: Background processing handles large volumes
✅ **Retry Logic**: Failed downloads are retried up to 3 times
✅ **Monitoring**: API endpoints for status and statistics
✅ **Fallback**: Original URLs used if local processing fails

## Monitoring

Check processing status:
- Pending ads: `mediaStatus = "pending"`
- Processing: `mediaStatus = "processing"`
- Success: `mediaStatus = "success"` + local URLs populated
- Failed: `mediaStatus = "failed"` + error message

The system automatically retries failed downloads up to 3 times before marking as permanently failed. 
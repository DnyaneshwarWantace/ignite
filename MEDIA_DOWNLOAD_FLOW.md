# 📥 Media Download Flow - Complete Explanation

## How Facebook Ad Media Download Works

### **Step 1: Scraping Ads** 
When you add a brand to a folder:
- ✅ Ads are scraped from Facebook Ad Library API
- ✅ Ad metadata (text, headline, description) is saved to database
- ✅ **Original Facebook URLs** are saved in `image_url` and `video_url` fields
- ✅ Ad status is set to `media_status = 'pending'`

**Database at this point:**
```sql
ads table:
- library_id: "25114672798211525"
- image_url: "https://fbcdn.net/.../image.jpg"  ← Facebook URL
- video_url: "https://fbcdn.net/.../video.mp4"  ← Facebook URL
- media_status: "pending"  ← Waiting for download
- local_image_url: NULL  ← Not downloaded yet
- local_video_url: NULL  ← Not downloaded yet
```

---

### **Step 2: Media Processor Triggers**
The media processor automatically runs:
- ✅ Checks for ads with `media_status = 'pending'`
- ✅ Processes them in batches (default: 10 ads at a time)
- ✅ Can be triggered manually via: `GET /api/v1/media/process?batch=10`

---

### **Step 3: Download from Facebook**
For each pending ad:

1. **Extract Media URLs** from ad content:
   ```javascript
   // Gets URLs from:
   - ad.imageUrl (direct)
   - ad.videoUrl (direct)
   - ad.content.snapshot.images[] (carousel ads)
   - ad.content.snapshot.videos[] (video ads)
   ```

2. **Check URL Accessibility**:
   ```javascript
   // For Facebook URLs (fbcdn.net, scontent):
   // Skip HEAD check (Facebook blocks it)
   // Directly attempt download
   ```

3. **Download Image/Video**:
   ```javascript
   // Fetch from Facebook URL
   fetch(imageUrl, {
     headers: { 'User-Agent': 'Mozilla/5.0...' }
   })
   // Convert to buffer
   const blob = await response.blob()
   const buffer = Buffer.from(blob.arrayBuffer())
   ```

---

### **Step 4: Upload to Supabase Storage**
After downloading:

1. **Upload to Supabase**:
   ```javascript
   // Upload to 'media' bucket
   supabaseAdmin.storage
     .from('media')
     .upload('ads/images/ad_123_img1_1234567890.jpg', buffer, {
       contentType: 'image/jpeg'
     })
   ```

2. **Get Public URL**:
   ```javascript
   // Get Supabase public URL
   const publicUrl = supabaseAdmin.storage
     .from('media')
     .getPublicUrl('ads/images/ad_123_img1_1234567890.jpg')
   
   // Result: https://[project].supabase.co/storage/v1/object/public/media/ads/images/...
   ```

3. **Update Database**:
   ```sql
   UPDATE ads SET
     local_image_url = 'https://[project].supabase.co/.../image.jpg',  ← Supabase URL
     local_video_url = 'https://[project].supabase.co/.../video.mp4',  ← Supabase URL
     media_status = 'success',
     media_downloaded_at = NOW()
   WHERE id = 'ad_123'
   ```

**Database after download:**
```sql
ads table:
- library_id: "25114672798211525"
- image_url: "https://fbcdn.net/.../image.jpg"  ← Original Facebook URL (kept for reference)
- video_url: "https://fbcdn.net/.../video.mp4"  ← Original Facebook URL (kept for reference)
- media_status: "success"  ← Downloaded successfully
- local_image_url: "https://[project].supabase.co/.../image.jpg"  ← Supabase URL ✅
- local_video_url: "https://[project].supabase.co/.../video.mp4"  ← Supabase URL ✅
```

---

### **Step 5: Frontend Uses Supabase URLs**
When displaying ads:

```javascript
// Priority order:
1. local_image_url (Supabase)  ← Use this first ✅
2. image_url (Facebook)        ← Fallback if Supabase not available
3. Placeholder                 ← If both fail
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Adds Brand to Folder                                │
│    POST /api/v1/x-ray/brands/add-to-folder-manually         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Scrape Ads from Facebook                                 │
│    - Get 200 ads from Facebook Ad Library                   │
│    - Save metadata + Facebook URLs                           │
│    - Set media_status = 'pending'                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Ads Saved to Database                                     │
│    ads table:                                                │
│    - image_url: "https://fbcdn.net/..."  ← Facebook URL     │
│    - media_status: "pending"                                 │
│    - local_image_url: NULL                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Media Processor Triggers                                 │
│    GET /api/v1/media/process?batch=10                       │
│    (Auto-triggered or manual)                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Download from Facebook                                    │
│    fetch("https://fbcdn.net/.../image.jpg")                 │
│    → Convert to Buffer                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Upload to Supabase Storage                               │
│    supabase.storage.from('media')                            │
│      .upload('ads/images/ad_123.jpg', buffer)                │
│    → Get public URL                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Update Database with Supabase URL                        │
│    UPDATE ads SET                                            │
│      local_image_url = 'https://supabase.co/.../image.jpg'  │
│      media_status = 'success'                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend Displays Using Supabase URL                     │
│    <img src={ad.local_image_url} />  ← Supabase URL ✅      │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure in Supabase Storage

```
media/ (bucket)
├── ads/
│   ├── images/
│   │   ├── ad_abc123_img1_1234567890.jpg
│   │   ├── ad_abc123_img2_1234567891.jpg  (carousel)
│   │   └── ad_def456_img1_1234567892.jpg
│   └── videos/
│       ├── ad_abc123_1234567890.mp4
│       └── ad_def456_1234567891.mp4
```

---

## Key Points

1. **Two-Step Process**:
   - Step 1: Save metadata + Facebook URLs (fast)
   - Step 2: Download + Upload to Supabase (background)

2. **Why Supabase URLs?**:
   - ✅ Permanent storage (Facebook URLs expire)
   - ✅ Faster loading (CDN)
   - ✅ No rate limiting
   - ✅ Reliable access

3. **Race Condition Fix**:
   - Uses `upsert` with `onConflict: 'library_id'`
   - Handles concurrent requests gracefully

4. **Error Handling**:
   - Retries up to 5 times
   - Sets `media_status = 'failed'` after max retries
   - Logs errors for debugging

---

## Manual Trigger

To manually trigger media processing:
```bash
# Process 10 pending ads
curl http://localhost:3000/api/v1/media/process?batch=10

# Process specific ads
curl -X POST http://localhost:3000/api/v1/media/process \
  -H "Content-Type: application/json" \
  -d '{"adIds": ["ad_123", "ad_456"]}'
```

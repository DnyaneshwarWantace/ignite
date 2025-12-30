# Cloudinary to Supabase Storage Migration

## ✅ What's Been Done

### 1. Created Supabase Storage Utility
**File**: `src/lib/supabase-storage.ts`

Functions available:
- `uploadImageFromUrl(url, options)` - Upload images from URLs
- `uploadVideoFromUrl(url, options)` - Upload videos from URLs
- `deleteFile(filepath)` - Delete files
- `getPublicUrl(filepath)` - Get public URLs

### 2. Updated Media Processing API
**File**: `src/app/api/v1/media/process/route.ts`

**Changes:**
- ❌ Removed: `import { v2 as cloudinary } from 'cloudinary'`
- ✅ Added: `import { uploadImageFromUrl, uploadVideoFromUrl } from '@/lib/supabase-storage'`
- ✅ Replaced all `cloudinary.uploader.upload()` calls with Supabase functions
- ✅ Both GET and POST methods updated

### 3. Created Setup Script
**File**: `scripts/setup-supabase-storage.js`

Run this to create the storage bucket in Supabase.

## 🚀 Setup Steps

### Step 1: Create Storage Bucket in Supabase

**Option A: Using Dashboard (Recommended)**
1. Go to your Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name: `media`
4. Public bucket: **Yes** ✅
5. File size limit: `52428800` (50MB)
6. Allowed MIME types: `image/*` and `video/*`
7. Click "Create bucket"

**Option B: Using Script**
```bash
node scripts/setup-supabase-storage.js
```

### Step 2: Configure Environment Variables

Remove Cloudinary variables:
```env
# Remove these:
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
```

Keep only Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nrfujyhdlrszkbtsfuac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For uploads
```

### Step 3: Uninstall Cloudinary (Optional)

```bash
npm uninstall cloudinary
```

## 📊 How It Works

### Image Upload Flow

**Before (Cloudinary):**
```typescript
const result = await cloudinary.uploader.upload(imageUrl, {
  folder: 'ads/images',
  public_id: `ad_${id}_${Date.now()}`,
  resource_type: 'image'
});
const url = result.secure_url; // https://res.cloudinary.com/...
```

**After (Supabase):**
```typescript
const url = await uploadImageFromUrl(imageUrl, {
  folder: 'ads/images',
  filename: `ad_${id}_${Date.now()}.jpg`
});
// Returns: https://[project].supabase.co/storage/v1/object/public/media/ads/images/...
```

### Video Upload Flow

Same pattern as images:
```typescript
const url = await uploadVideoFromUrl(videoUrl, {
  folder: 'ads/videos',
  filename: `ad_${id}_${Date.now()}.mp4`
});
```

## 🗂️ Storage Structure

```
media/
├── ads/
│   ├── images/
│   │   ├── ad_123_img1_1234567890.jpg
│   │   ├── ad_123_img2_1234567891.jpg
│   │   └── ...
│   └── videos/
│       ├── ad_456_1234567890.mp4
│       └── ...
└── editor/
    ├── uploads/
    └── exports/
```

## 📝 Database Changes

**No changes needed!** The same columns are used:
- `localImageUrl` - Stores Supabase URL instead of Cloudinary URL
- `localVideoUrl` - Stores Supabase URL instead of Cloudinary URL

## 🎯 Benefits

✅ **Cost Savings**
- Supabase Storage is cheaper than Cloudinary
- No transformation/bandwidth charges

✅ **Simpler Stack**
- Everything in one place (database + storage)
- No separate service to manage

✅ **Better Integration**
- Direct integration with your Supabase database
- Row Level Security (RLS) support

✅ **Generous Free Tier**
- 1GB storage free
- 2GB bandwidth free
- More than enough for testing

## ⚠️ Important Notes

1. **Public Access**: The media bucket is public, so all images/videos are accessible without authentication

2. **File Naming**: Files are named with timestamps to avoid conflicts:
   ```
   ad_[adId]_img[index]_[timestamp].jpg
   ad_[adId]_[timestamp].mp4
   ```

3. **URL Format**:
   ```
   https://[project-id].supabase.co/storage/v1/object/public/media/[folder]/[filename]
   ```

4. **Max File Size**: 50MB per file (configurable in bucket settings)

## 🧪 Testing

To test the migration:

1. **Manual Test**:
   - Go to `/api/v1/media/process?batch=1`
   - Check if images are uploaded to Supabase Storage
   - Verify URLs in the database

2. **Check Storage**:
   - Go to Supabase Dashboard → Storage → media bucket
   - You should see files in `ads/images/` and `ads/videos/`

3. **Verify URLs**:
   - Copy a `localImageUrl` from your database
   - Paste in browser - should display the image
   - Format: `https://nrfujyhdlrszkbtsfuac.supabase.co/storage/v1/object/public/media/...`

## 🔄 Migration of Existing Data

If you have existing Cloudinary URLs in your database:

**Option 1**: Keep them as-is (they'll still work)

**Option 2**: Migrate them to Supabase:
```sql
-- Find all ads with Cloudinary URLs
SELECT id, "localImageUrl" FROM ads
WHERE "localImageUrl" LIKE '%cloudinary%';
```

Then create a migration script to re-download and upload to Supabase.

## 📚 Additional Features

### Upload from Client-Side

```typescript
import { supabase } from '@/lib/supabase'

const file = event.target.files[0]
const { data, error } = await supabase.storage
  .from('media')
  .upload(`uploads/${Date.now()}_${file.name}`, file)

if (data) {
  const publicUrl = supabase.storage
    .from('media')
    .getPublicUrl(data.path).data.publicUrl
}
```

### Delete Files

```typescript
import { deleteFile } from '@/lib/supabase-storage'

await deleteFile('ads/images/old-file.jpg')
```

## ✅ Migration Complete!

Your app now uses Supabase Storage instead of Cloudinary. All new images and videos will be stored in Supabase.

# Ignite Project - Server Deployment Guide

## 🚀 Production Deployment Checklist

### 1. Environment Variables Setup

Create a `.env.local` file on your server with the following variables:

```bash
# Database Configuration (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_OTdtgJk18qeG@ep-rapid-paper-a1phvwlf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Google OAuth (if using)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# LinkedIn OAuth (if using)
AUTH_LINKEDIN_ID="your-linkedin-client-id"
AUTH_LINKEDIN_SECRET="your-linkedin-client-secret"

# API Configuration
NEXT_PUBLIC_BACKEND_URL="https://yourdomain.com/api/v1"

# Cloudinary Configuration (for media processing)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Environment
NODE_ENV="production"
```

### 2. Database Setup

Your project is now configured to use **Neon PostgreSQL** (cloud database). No local database setup required!

1. **Database is already configured** and ready to use
2. **Run Prisma setup**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

### 3. Auto-Tracking Configuration

The auto-tracking service is now configured to run **every 24 hours** automatically. It will:

- ✅ Start automatically when the server starts
- ✅ Run every 24 hours (86400000 milliseconds)
- ✅ Track all configured brand pages
- ✅ Update ad statuses and add new ads
- ✅ Handle errors gracefully and continue running

### 4. Media Processing

The media worker will:
- ✅ Process pending media files every 2 minutes
- ✅ Handle video transcription and processing
- ✅ Work with Cloudinary for media storage

### 5. Build and Deploy

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the production server
npm start
```

### 6. Process Management (Recommended)

Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start npm --name "ignite" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 7. Monitoring Auto-Tracking

Check auto-tracking status via API:
```bash
curl https://yourdomain.com/api/v1/auto-tracker
```

Expected response:
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "isCycleInProgress": false,
    "lastCycleStartTime": "2025-01-11T10:00:00.000Z",
    "lastCycleEndTime": "2025-01-11T10:30:00.000Z",
    "nextCycleTime": "2025-01-12T10:00:00.000Z",
    "trackedPagesCount": 5
  }
}
```

### 8. Manual Auto-Tracking Control

Start auto-tracking manually:
```bash
curl -X POST https://yourdomain.com/api/v1/auto-tracker
```

Track specific page:
```bash
curl -X POST "https://yourdomain.com/api/v1/auto-tracker?pageId=your-page-id"
```

### 9. Logs and Monitoring

Check application logs:
```bash
# If using PM2
pm2 logs ignite

# If using systemd
journalctl -u your-service-name -f
```

### 10. Security Considerations

- ✅ Environment variables are properly configured
- ✅ Database credentials are secure
- ✅ OAuth secrets are protected
- ✅ Auto-tracking runs with proper error handling
- ✅ Media processing is rate-limited

## 🔧 Troubleshooting

### Auto-tracking not starting?
1. Check server logs for initialization errors
2. Verify database connection
3. Check if brands are configured in the database
4. Test manual tracking via API

### Media processing issues?
1. Verify Cloudinary credentials
2. Check media worker logs
3. Ensure sufficient server resources

### Database connection issues?
1. Verify DATABASE_URL format
2. Check PostgreSQL service status
3. Verify user permissions

## 📊 Performance Notes

- Auto-tracking runs every 24 hours to minimize server load
- Media processing is batched every 2 minutes
- Database queries are optimized with pagination
- Error handling prevents service crashes

## 🔄 Updates and Maintenance

To update the application:
1. Pull latest code
2. Run `npm install`
3. Run `npm run build`
4. Restart the application

The auto-tracking service will automatically restart with the new configuration. 
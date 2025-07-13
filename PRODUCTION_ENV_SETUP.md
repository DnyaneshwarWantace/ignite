# Production Environment Setup

## Required Environment Variables for Your Server

Add these environment variables to your production server (`.env.local` or server environment):

```bash
# Database Configuration (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_OTdtgJk18qeG@ep-rapid-paper-a1phvwlf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Configuration (REQUIRED for production)
NEXTAUTH_URL="https://ignite-jade.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key-here-make-it-long-and-random"

# Google OAuth (if using)
AUTH_GOOGLE_ID="403934823504-qjuou59jk3kfc7bv6ejuko8h3dktu8db.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# API Configuration
NEXT_PUBLIC_BACKEND_URL="https://ignite-jade.vercel.app/api/v1"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="dwzdr8ei9"
CLOUDINARY_API_KEY="741397439758848"
CLOUDINARY_API_SECRET="kOPze_jNVA8xgTAA5GsjSTMLLig"

# Scrape Creators API
SCRAPE_CREATORS_API_KEY="7jFsufrf1yZE9Yc0BmfOgtUQeIr2"
SCRAPE_CREATORS_BASE_URL="https://api.scrapecreators.com/v1/facebook/adLibrary"
NEXT_PUBLIC_SCRAPE_CREATORS_API_KEY="7jFsufrf1yZE9Yc0BmfOgtUQeIr2"
NEXT_PUBLIC_SCRAPE_CREATORS_BASE_URL="https://api.scrapecreators.com/v1/facebook/adLibrary"

# Environment
NODE_ENV="production"
```

## Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use this online generator: https://generate-secret.vercel.app/32

## Quick Fix for Immediate Deployment

If you need to deploy quickly, you can temporarily disable authentication by updating the middleware:

1. Comment out the auth check in `src/middleware.ts`
2. Or set `NEXTAUTH_SECRET` to any random string temporarily

## Testing Authentication

After setting up the environment variables:

1. Restart your server
2. Visit `https://ignite-jade.vercel.app/api/auth/session` - should return JSON instead of 500 error
3. Try logging in at `https://ignite-jade.vercel.app/login`

## Common Issues and Solutions

### 500 Error on /api/auth/session
- **Cause**: Missing NEXTAUTH_SECRET
- **Solution**: Add NEXTAUTH_SECRET to environment variables

### 401 Unauthorized on API routes
- **Cause**: Authentication middleware failing
- **Solution**: Check NEXTAUTH_URL and NEXTAUTH_SECRET are correct

### Database connection issues
- **Cause**: DATABASE_URL not accessible from server
- **Solution**: Verify the Neon database URL is correct and accessible 
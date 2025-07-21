# Environment Setup Guide for Ignite

This guide provides a comprehensive list of all environment variables needed for the Ignite Facebook Ad Intelligence Platform.

## Creating Your Environment Files

1. Create `.env.local` for development
2. Create `.env.production` for production
3. Copy the variables below and update with your actual values

## Complete Environment Variables

```bash
# ============================================================================
# IGNITE - Facebook Ad Intelligence Platform
# Environment Configuration File
# ============================================================================

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=Ignite
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000/api

# ============================================================================
# DATABASE CONFIGURATION (PostgreSQL)
# ============================================================================
# Main database connection string - REQUIRED
DATABASE_URL="postgresql://username:password@localhost:5432/ignite_db?schema=public"

# Alternative database configuration (if using separate env vars)
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_PASSWORD=password
DB_NAME=ignite_db
DB_SCHEMA=public

# Prisma configuration
PRISMA_GENERATE_DATAPROXY=false

# ============================================================================
# AUTHENTICATION (NextAuth.js) - REQUIRED
# ============================================================================
# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-secret-key-min-32-chars

# JWT configuration
JWT_SECRET=your-jwt-secret-key-for-token-signing
JWT_ENCRYPTION_KEY=your-jwt-encryption-key-32-chars-long

# Session configuration
SESSION_TIMEOUT=24h
SESSION_UPDATE_AGE=1h

# ============================================================================
# OAUTH PROVIDERS
# ============================================================================

# Google OAuth
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Facebook OAuth (for user authentication, not scraping)
FACEBOOK_CLIENT_ID=your-facebook-oauth-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-oauth-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-oauth-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-oauth-client-secret

# ============================================================================
# FACEBOOK AD LIBRARY INTEGRATION - REQUIRED FOR SCRAPING
# ============================================================================
# Facebook App credentials for Ad Library API access
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_ACCESS_TOKEN=your-facebook-access-token

# Facebook Ad Library API configuration
FACEBOOK_AD_LIBRARY_API_URL=https://graph.facebook.com/v18.0/ads_archive
FACEBOOK_API_VERSION=v18.0

# ============================================================================
# WEB SCRAPING CONFIGURATION
# ============================================================================
# Puppeteer configuration
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
PUPPETEER_VIEWPORT_WIDTH=1920
PUPPETEER_VIEWPORT_HEIGHT=1080

# Scraping limits and delays
SCRAPING_DELAY_MIN=1000
SCRAPING_DELAY_MAX=3000
SCRAPING_MAX_CONCURRENT=3
SCRAPING_RETRY_ATTEMPTS=3

# User agents for scraping (comma-separated)
SCRAPING_USER_AGENTS="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36,Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

# Proxy configuration (optional)
PROXY_ENABLED=false
PROXY_HOST=
PROXY_PORT=
PROXY_USERNAME=
PROXY_PASSWORD=

# ============================================================================
# SECURITY & RATE LIMITING
# ============================================================================
# API rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Security headers
SECURITY_HEADERS_ENABLED=true

# reCAPTCHA configuration
NEXT_PUBLIC_RECAPTCHA_ENABLED=false
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# ============================================================================
# EXTERNAL SERVICES
# ============================================================================

# Redis (for caching and session storage)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Email service (for notifications)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
FROM_EMAIL=noreply@ignite.com

# Alternative email services
SENDGRID_API_KEY=your-sendgrid-api-key
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain

# ============================================================================
# CLOUD STORAGE (for ad images/videos)
# ============================================================================
# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=ignite-ad-assets

# Alternative: Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Alternative: Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=ignite-ad-assets
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# ============================================================================
# AI & ANALYTICS SERVICES
# ============================================================================
# OpenAI (for AI-powered insights)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2048

# Google Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token

# Sentry (error tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# ============================================================================
# MONITORING & LOGGING
# ============================================================================
# Application logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log

# Performance monitoring
APM_ENABLED=false
APM_SERVICE_NAME=ignite-api
APM_ENVIRONMENT=development

# Health check endpoints
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health

# ============================================================================
# QUEUE & BACKGROUND JOBS
# ============================================================================
# Bull Queue (for background scraping jobs)
QUEUE_REDIS_URL=redis://localhost:6379/1
QUEUE_CONCURRENCY=5
QUEUE_MAX_RETRIES=3

# Cron jobs
CRON_ENABLED=true
SCRAPING_SCHEDULE="0 */6 * * *"
CLEANUP_SCHEDULE="0 2 * * *"

# ============================================================================
# DEVELOPMENT & DEBUGGING
# ============================================================================
# Development features
DEBUG=false
VERBOSE_LOGGING=false
DEV_TOOLS_ENABLED=true

# Database debugging
PRISMA_DEBUG=false
SQL_LOGGING=false

# Next.js specific
NEXT_TELEMETRY_DISABLED=1
ANALYZE_BUNDLE=false

# ============================================================================
# PERFORMANCE & OPTIMIZATION
# ============================================================================
# Caching
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_SIZE=100mb

# Image optimization
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_QUALITY=80
IMAGE_FORMATS=webp,jpeg

# ============================================================================
# WEBHOOK CONFIGURATION
# ============================================================================
# Webhook endpoints for external integrations
WEBHOOK_SECRET=your-webhook-secret-key
WEBHOOK_ENABLED=false

# ============================================================================
# FEATURE FLAGS
# ============================================================================
# Enable/disable features
FEATURE_AI_INSIGHTS=true
FEATURE_BULK_EXPORT=true
FEATURE_TEAM_COLLABORATION=false
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_API_ACCESS=false
```

## Environment Variable Categories

### 🔴 Required for Basic Functionality
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (min 32 characters)
- `NEXTAUTH_URL` - Application URL

### 🟡 Required for Facebook Scraping
- `FACEBOOK_APP_ID` - Facebook App ID
- `FACEBOOK_APP_SECRET` - Facebook App Secret
- `FACEBOOK_ACCESS_TOKEN` - Facebook Access Token

### 🟢 Optional but Recommended
- OAuth provider credentials (Google, GitHub, etc.)
- Cloud storage configuration (AWS S3, Cloudinary)
- Redis for caching and session storage
- Email service for notifications
- Error tracking (Sentry)
- Analytics (Google Analytics, Mixpanel)

### 🔵 Development & Advanced Features
- Scraping configuration (Puppeteer, proxies)
- Rate limiting and security settings
- Monitoring and logging
- Background job queues
- Feature flags

## Setup Instructions

### 1. Database Setup
```bash
# Install PostgreSQL
# Create database
createdb ignite_db

# Update DATABASE_URL with your credentials
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/ignite_db?schema=public"
```

### 2. NextAuth Configuration
```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET

# Set URLs
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Facebook App Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Get App ID and App Secret
4. Generate Access Token with `ads_read` permission

### 4. OAuth Providers Setup
#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs

#### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL to `[NEXTAUTH_URL]/api/auth/callback/github`

### 5. Optional Services

#### Redis (Recommended):
```bash
# Install Redis
brew install redis  # macOS
# or
sudo apt-get install redis-server  # Ubuntu

# Start Redis
redis-server

# Set REDIS_URL
REDIS_URL=redis://localhost:6379
```

#### Email Service:
- **SMTP**: Use Gmail, Outlook, or custom SMTP
- **SendGrid**: Sign up at sendgrid.com
- **Mailgun**: Sign up at mailgun.com

#### Cloud Storage:
- **AWS S3**: Create S3 bucket and IAM user
- **Cloudinary**: Sign up for free account
- **Google Cloud**: Create project and storage bucket

## Production Configuration

### Environment-Specific Variables
```bash
# Production overrides
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL="postgresql://prod_user:prod_pass@prod-host:5432/ignite_prod?schema=public"

# Security
PUPPETEER_HEADLESS=true
DEBUG=false
VERBOSE_LOGGING=false
```

### Security Checklist
- [ ] Use strong, unique secrets (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use environment-specific database credentials
- [ ] Enable rate limiting
- [ ] Configure proper error tracking
- [ ] Use secure cloud storage with proper IAM

## Testing Your Configuration
```bash
# Test database connection
npm run db:generate

# Test application startup
npm run dev

# Check environment variables
node -e "console.log(process.env.DATABASE_URL ? '✅ Database configured' : '❌ Database not configured')"
```

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **NextAuth Errors**: Check NEXTAUTH_SECRET length and NEXTAUTH_URL format
3. **Facebook API**: Verify app permissions and access token validity
4. **OAuth Providers**: Check redirect URIs and client credentials

### Validation Script
```javascript
// validate-env.js
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing);
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
```

Run with: `node validate-env.js` 
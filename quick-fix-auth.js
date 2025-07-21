#!/usr/bin/env node

// Quick fix script to temporarily disable authentication
// Run this on your server to test without auth issues

const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Auth Fix Script');
console.log('========================');

// 1. Create a temporary .env.local with required variables
const envContent = `# Temporary production environment variables
DATABASE_URL="postgresql://neondb_owner:npg_OTdtgJk18qeG@ep-rapid-paper-a1phvwlf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Configuration (Temporary)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="temporary-secret-key-for-testing-123456789"

# Google OAuth
AUTH_GOOGLE_ID="403934823504-qjuou59jk3kfc7bv6ejuko8h3dktu8db.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# API Configuration
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000/api/v1"

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
`;

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local with temporary auth configuration');
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
}

// 2. Create a temporary middleware backup
const middlewarePath = 'src/middleware.ts';
const middlewareBackupPath = 'src/middleware.ts.backup';

try {
  if (fs.existsSync(middlewarePath)) {
    fs.copyFileSync(middlewarePath, middlewareBackupPath);
    console.log('✅ Created middleware backup');
  }
} catch (error) {
  console.error('❌ Error creating middleware backup:', error.message);
}

console.log('');
console.log('📋 Next Steps:');
console.log('1. Restart your server: npm run build && npm start');
console.log('2. Test the application at http://localhost:3000');
console.log('3. If it works, update NEXTAUTH_SECRET with a proper secret');
console.log('4. Restore middleware if needed: mv src/middleware.ts.backup src/middleware.ts');
console.log('');
console.log('🔐 To generate a proper NEXTAUTH_SECRET, run:');
console.log('   openssl rand -base64 32'); 
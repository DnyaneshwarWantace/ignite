#!/bin/bash

# Ignite Project Deployment Script
echo "🚀 Starting Ignite deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🔄 Pushing database schema..."
npx prisma db push

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start the application: npm start"
    echo "2. Or use PM2: pm2 start npm --name 'ignite' -- start"
    echo "3. Check auto-tracking status: curl https://ignite-ldg4.onrender.com/api/v1/auto-tracker"
    echo ""
    echo "📊 Auto-tracking will run every 24 hours automatically"
    echo "📊 Media processing will run every 2 minutes"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi 
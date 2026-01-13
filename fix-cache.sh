#!/bin/bash

# Fix Next.js cache corruption issues
# Run this when you get "Cannot find module './vendor-chunks/..." errors

echo "🧹 Cleaning Next.js build cache..."

# Kill any running Next.js dev servers
echo "🛑 Stopping Next.js dev servers..."
pkill -9 -f "next dev" 2>/dev/null || true

# Clear Next.js build folder
echo "🗑️  Removing .next folder..."
rm -rf .next

# Clear node_modules cache
echo "🗑️  Removing node_modules/.cache..."
rm -rf node_modules/.cache

# Clear TypeScript build cache
echo "🗑️  Removing tsconfig.tsbuildinfo..."
rm -f tsconfig.tsbuildinfo

echo "✅ Cache cleared successfully!"
echo ""
echo "Now run: npm run dev"

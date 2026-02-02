#!/bin/bash

# Test the diagnostic endpoint
# Make sure your Next.js server is running on localhost:3000

echo "🔍 Testing AWS Credentials via Diagnostic Endpoint..."
echo ""
echo "Make sure you're logged in to the app first!"
echo "Then run this command:"
echo ""
echo "curl http://localhost:3000/api/editor/video/render-lambda/diagnose"
echo ""
echo "Or open in browser:"
echo "http://localhost:3000/api/editor/video/render-lambda/diagnose"
echo ""

# If you want to test directly, uncomment below:
# curl -H "Cookie: your-session-cookie" http://localhost:3000/api/editor/video/render-lambda/diagnose | jq

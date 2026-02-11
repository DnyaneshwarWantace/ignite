# Quick Test Instructions

## Test Your AWS Credentials

### Option 1: Use the Diagnostic Endpoint (Recommended)

1. **Start your Next.js server:**
   ```bash
   npm run dev
   ```

2. **Make sure you're logged in** to the app in your browser

3. **Open the diagnostic endpoint:**
   ```
   http://localhost:3000/api/editor/video/render-lambda/diagnose
   ```

4. **Check the results:**
   - ✅ Green = Working
   - ❌ Red = Failed (shows what's wrong)

### Option 2: Test with AWS CLI (If Installed)

```bash
export REMOTION_AWS_ACCESS_KEY_ID=your-access-key-id
export REMOTION_AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Test 1: Verify credentials
aws sts get-caller-identity --region us-east-1

# Test 2: List Lambda functions (this is what's failing)
aws lambda list-functions --region us-east-1 --max-items 1

# Test 3: Check specific function
aws lambda get-function --function-name remotion-render-4-0-339-mem3008mb-disk2048mb-900sec --region us-east-1

# Test 4: Test Remotion SDK
npx remotion lambda functions ls --region=us-east-1
```

### Option 3: Test with Node Script

```bash
# Set environment variables (use values from your .env)
export REMOTION_AWS_ACCESS_KEY_ID=your-access-key-id
export REMOTION_AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Run test script
node test-aws-credentials.js
```

## What to Look For

The diagnostic endpoint will check:

1. **Environment Variables** - Are credentials set?
2. **AWS Credentials** - Are they valid?
3. **Lambda Function Access** - Can you access the function?
4. **Remotion Lambda SDK** - Can Remotion list functions?
5. **S3 Access** - Can you access the S3 bucket?

## Expected Results

If everything works:
- All checks should show ✅ OK

If permissions are missing:
- `lambdaList` or `remotionFunctions` will show ❌ FAILED
- Error message will say "AccessDenied" or "Cannot list Lambda functions"

## Fix Missing Permissions

If tests fail, go to AWS Console:

1. **IAM → Users** → Find your user
2. **Add permissions** → **Attach policies directly**
3. Attach these:
   - `AWSLambda_FullAccess`
   - `AmazonS3FullAccess`
   - `CloudWatchLogsFullAccess`
4. **Wait 1-2 minutes** for propagation
5. **Test again**

## ⚠️ SECURITY WARNING

Your AWS credentials were exposed in this conversation. **Please rotate them immediately** after testing:

1. Go to AWS Console → IAM → Users
2. Click on your user
3. Go to "Security credentials" tab
4. Click "Create access key" to create new ones
5. Delete the old access key
6. Update your `.env` file with new credentials

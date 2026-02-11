# Fix IAM Permissions - Step by Step

## Current Status
✅ Credentials are configured  
❌ **Remotion Lambda SDK: AccessDenied** ← This is the problem

## Quick Fix (5 minutes)

### Step 1: Login to AWS Console
1. Go to https://console.aws.amazon.com
2. Login with your AWS account

### Step 2: Find Your IAM User
1. Click **Services** → Search **IAM**
2. Click **Users** in left sidebar
3. Find the user that owns your Remotion access key (check Security credentials tab)
   - If you're not sure, check the user's "Security credentials" tab

### Step 3: Add Permissions
1. Click on the user name
2. Click **Permissions** tab
3. Click **Add permissions** button
4. Select **Attach policies directly**
5. In the search box, type and select these policies:
   - `AWSLambda_FullAccess` ✅
   - `AmazonS3FullAccess` ✅
   - `CloudWatchLogsFullAccess` ✅
6. Click **Next** → **Add permissions**

### Step 4: Wait and Verify
1. Wait **1-2 minutes** for permissions to propagate
2. Go back to your diagnostic endpoint:
   ```
   http://localhost:3000/api/editor/video/render-lambda/diagnose
   ```
3. Refresh the page
4. Check if `remotionLambda` status changed to **OK**

### Step 5: Test Rendering
1. Try rendering a video again
2. It should work now!

## What Each Policy Does

- **AWSLambda_FullAccess**: Allows listing, invoking, and managing Lambda functions
- **AmazonS3FullAccess**: Allows reading/writing to S3 buckets (where videos are stored)
- **CloudWatchLogsFullAccess**: Allows reading logs for debugging

## If It Still Doesn't Work

1. **Check the diagnostic endpoint again** - see which specific check is failing
2. **Verify the user** - Make sure you're adding permissions to the correct IAM user
3. **Check AWS account status** - Go to Billing Dashboard to ensure account is active
4. **Verify region** - Make sure everything is in `us-east-1` region

## Security: Rotate Credentials

After testing, **immediately rotate your credentials**:

1. IAM → Users → Your user
2. **Security credentials** tab
3. Click **Create access key**
4. Save the new credentials
5. Click **Delete** on the old access key
6. Update your `.env` file with new credentials

# AWS IAM Permissions Required for Remotion Lambda

## Problem
You're getting `AccessDeniedException: UnknownError` when Remotion tries to list Lambda functions. This means your IAM user/role doesn't have the required permissions.

## Quick Fix Steps

### 1. Check Your IAM User/Role
Go to AWS Console → IAM → Users (or Roles) → Find your user/role that has the access keys

### 2. Attach Required Permissions

You need to attach a policy with these permissions. You can either:

**Option A: Use AWS Managed Policy (Easiest)**
- Attach `AWSLambda_FullAccess` policy
- Attach `AmazonS3FullAccess` policy  
- Attach `CloudWatchLogsFullAccess` policy

**Option B: Create Custom Policy (More Secure - Recommended)**

Create a custom policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:GetFunction",
        "lambda:InvokeFunction",
        "lambda:CreateFunction",
        "lambda:UpdateFunctionConfiguration",
        "lambda:UpdateFunctionCode",
        "lambda:DeleteFunction",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::remotionlambda-*",
        "arn:aws:s3:::remotionlambda-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::*:role/*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "lambda.amazonaws.com"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Verify Permissions

Run the diagnostic endpoint to check:
```
GET http://localhost:3000/api/editor/video/render-lambda/diagnose
```

This will test:
- ✅ Credentials are configured
- ✅ Credentials are valid
- ✅ Lambda function access
- ✅ S3 bucket access
- ✅ Remotion Lambda SDK connectivity

## Common Issues

### Issue 1: "UnknownError" in AccessDenied
This usually means:
- The IAM user doesn't have `lambda:ListFunctions` permission
- The credentials are for a different AWS account
- The IAM user has been deleted or disabled

**Fix:** Add `lambda:ListFunctions` permission (included in the policy above)

### Issue 2: Account Balance
If your AWS account has no credits/balance:
- Check AWS Billing Dashboard
- Ensure payment method is valid
- Some services may be suspended if account is in arrears

### Issue 3: Service Limits
AWS has default limits on Lambda functions:
- Check AWS Service Quotas → Lambda
- Request limit increases if needed

## Testing Your Setup

### Test 1: AWS CLI Test
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key

# Test credentials
aws sts get-caller-identity --region us-east-1

# Test Lambda access
aws lambda list-functions --region us-east-1 --max-items 1

# Test specific function
aws lambda get-function --function-name remotion-render-4-0-339-mem3008mb-disk2048mb-900sec --region us-east-1
```

### Test 2: Remotion CLI Test
```bash
export REMOTION_AWS_ACCESS_KEY_ID=your_access_key
export REMOTION_AWS_SECRET_ACCESS_KEY=your_secret_key

# List Remotion functions
npx remotion lambda functions ls --region=us-east-1
```

## Step-by-Step Fix

1. **Go to AWS Console** → IAM → Users
2. **Find your user** (the one with the access keys you're using)
3. **Click "Add permissions"** → "Attach policies directly"
4. **Search and attach:**
   - `AWSLambda_FullAccess`
   - `AmazonS3FullAccess` 
   - `CloudWatchLogsFullAccess`
5. **Wait 1-2 minutes** for permissions to propagate
6. **Test again** using the diagnostic endpoint or try rendering

## Alternative: Use AWS Role Instead of User

If you're running on an EC2 instance or using AWS services, consider using an IAM Role instead of access keys:
- More secure (no keys to manage)
- Automatic credential rotation
- Better for production

## Still Not Working?

1. **Check the diagnostic endpoint output** - it will tell you exactly which check is failing
2. **Verify the Lambda function exists:**
   ```bash
   aws lambda get-function --function-name remotion-render-4-0-339-mem3008mb-disk2048mb-900sec --region us-east-1
   ```
3. **Check AWS account status** in Billing Dashboard
4. **Verify region** - Make sure you're using `us-east-1` consistently
5. **Check CloudTrail** for detailed error logs

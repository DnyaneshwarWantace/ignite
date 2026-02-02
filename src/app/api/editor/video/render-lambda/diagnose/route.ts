import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { auth } from '@/app/api/auth/[...nextauth]/options';

const execAsync = promisify(exec);

// Diagnostic endpoint to test AWS connectivity and permissions
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check 1: Environment variables
    const hasAccessKey = !!process.env.REMOTION_AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.REMOTION_AWS_SECRET_ACCESS_KEY;
    
    diagnostics.checks.environmentVariables = {
      hasAccessKey,
      hasSecretKey,
      accessKeyPrefix: hasAccessKey ? process.env.REMOTION_AWS_ACCESS_KEY_ID?.substring(0, 4) + '...' : 'NOT SET',
      status: hasAccessKey && hasSecretKey ? 'OK' : 'FAILED',
      message: hasAccessKey && hasSecretKey 
        ? 'AWS credentials are configured'
        : 'AWS credentials are missing'
    };

    if (!hasAccessKey || !hasSecretKey) {
      return NextResponse.json(diagnostics, { status: 200 });
    }

    // Check 2: AWS CLI availability
    try {
      await execAsync('aws --version', { timeout: 5000 });
      diagnostics.checks.awsCli = {
        status: 'OK',
        message: 'AWS CLI is installed'
      };
    } catch (error) {
      diagnostics.checks.awsCli = {
        status: 'WARNING',
        message: 'AWS CLI not found (may use Remotion SDK instead)'
      };
    }

    // Check 3: Test AWS credentials with a simple AWS call
    try {
      const testCommand = `AWS_ACCESS_KEY_ID=${process.env.REMOTION_AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${process.env.REMOTION_AWS_SECRET_ACCESS_KEY} aws sts get-caller-identity --region us-east-1`;
      const { stdout } = await execAsync(testCommand, { timeout: 10000 });
      const identity = JSON.parse(stdout);
      
      diagnostics.checks.awsCredentials = {
        status: 'OK',
        message: 'AWS credentials are valid',
        userId: identity.UserId,
        account: identity.Account,
        arn: identity.Arn
      };
    } catch (error: any) {
      const errorMsg = error?.stderr || error?.message || String(error);
      diagnostics.checks.awsCredentials = {
        status: 'FAILED',
        message: 'AWS credentials validation failed',
        error: errorMsg.substring(0, 500)
      };
    }

    // Check 4: Test Lambda function access
    try {
      const lambdaCommand = `AWS_ACCESS_KEY_ID=${process.env.REMOTION_AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${process.env.REMOTION_AWS_SECRET_ACCESS_KEY} aws lambda get-function --function-name remotion-render-4-0-339-mem3008mb-disk2048mb-900sec --region us-east-1`;
      const { stdout } = await execAsync(lambdaCommand, { timeout: 10000 });
      const functionInfo = JSON.parse(stdout);
      
      diagnostics.checks.lambdaFunction = {
        status: 'OK',
        message: 'Lambda function exists and is accessible',
        functionName: functionInfo.Configuration.FunctionName,
        runtime: functionInfo.Configuration.Runtime,
        state: functionInfo.Configuration.State,
        lastModified: functionInfo.Configuration.LastModified
      };
    } catch (error: any) {
      const errorMsg = error?.stderr || error?.message || String(error);
      let status = 'FAILED';
      let message = 'Cannot access Lambda function';
      
      if (errorMsg.includes('ResourceNotFoundException')) {
        status = 'FAILED';
        message = 'Lambda function not found';
      } else if (errorMsg.includes('AccessDenied')) {
        status = 'FAILED';
        message = 'No permission to access Lambda function';
      }
      
      diagnostics.checks.lambdaFunction = {
        status,
        message,
        error: errorMsg.substring(0, 500)
      };
    }

    // Check 5: Test Remotion Lambda SDK
    try {
      const remotionTestCommand = `REMOTION_AWS_ACCESS_KEY_ID=${process.env.REMOTION_AWS_ACCESS_KEY_ID} REMOTION_AWS_SECRET_ACCESS_KEY=${process.env.REMOTION_AWS_SECRET_ACCESS_KEY} npx remotion lambda functions ls --region=us-east-1`;
      const { stdout } = await execAsync(remotionTestCommand, { timeout: 15000 });
      
      diagnostics.checks.remotionLambda = {
        status: 'OK',
        message: 'Remotion Lambda SDK can list functions',
        output: stdout.substring(0, 1000)
      };
    } catch (error: any) {
      const errorMsg = error?.stderr || error?.message || String(error);
      let status = 'FAILED';
      let message = 'Remotion Lambda SDK test failed';
      
      if (errorMsg.includes('AccessDenied')) {
        message = 'Access Denied - Check IAM permissions for Lambda, S3, and CloudWatch';
      } else if (errorMsg.includes('credentials')) {
        message = 'Invalid credentials';
      }
      
      diagnostics.checks.remotionLambda = {
        status,
        message,
        error: errorMsg.substring(0, 1000)
      };
    }

    // Check 6: Test S3 access (for the Remotion site URL)
    try {
      const s3Command = `AWS_ACCESS_KEY_ID=${process.env.REMOTION_AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${process.env.REMOTION_AWS_SECRET_ACCESS_KEY} aws s3 ls s3://remotionlambda-useast1-ad9v3yryvx/sites/video-editor/ --region us-east-1`;
      await execAsync(s3Command, { timeout: 10000 });
      
      diagnostics.checks.s3Access = {
        status: 'OK',
        message: 'S3 bucket is accessible'
      };
    } catch (error: any) {
      const errorMsg = error?.stderr || error?.message || String(error);
      diagnostics.checks.s3Access = {
        status: 'FAILED',
        message: 'Cannot access S3 bucket',
        error: errorMsg.substring(0, 500)
      };
    }

    // Overall status
    const allChecks = Object.values(diagnostics.checks);
    const failedChecks = allChecks.filter((check: any) => check.status === 'FAILED');
    const warningChecks = allChecks.filter((check: any) => check.status === 'WARNING');
    
    diagnostics.summary = {
      totalChecks: allChecks.length,
      passed: allChecks.filter((check: any) => check.status === 'OK').length,
      failed: failedChecks.length,
      warnings: warningChecks.length,
      overallStatus: failedChecks.length > 0 ? 'FAILED' : warningChecks.length > 0 ? 'WARNING' : 'OK'
    };

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Diagnostic check failed',
      message: error?.message || String(error)
    }, { status: 500 });
  }
}

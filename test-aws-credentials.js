#!/usr/bin/env node

/**
 * Test AWS Credentials for Remotion Lambda
 * 
 * WARNING: This script uses your AWS credentials.
 * Make sure to rotate them after testing if they were exposed.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID || 'AKIA4O7BVEMBJOR4Y2OZ';
const AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY || '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';

async function testCredentials() {
  console.log('🔍 Testing AWS Credentials for Remotion Lambda...\n');
  console.log(`Access Key: ${AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
  console.log(`Secret Key: ${AWS_SECRET_ACCESS_KEY.substring(0, 8)}...\n`);

  const results = {
    credentials: { status: 'PENDING', message: '' },
    awsIdentity: { status: 'PENDING', message: '' },
    lambdaList: { status: 'PENDING', message: '' },
    lambdaFunction: { status: 'PENDING', message: '' },
    s3Access: { status: 'PENDING', message: '' },
    remotionFunctions: { status: 'PENDING', message: '' }
  };

  // Test 1: Verify credentials are set
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    results.credentials = {
      status: 'FAILED',
      message: 'Credentials not set'
    };
    printResults(results);
    return;
  }
  results.credentials = {
    status: 'OK',
    message: 'Credentials are set'
  };

  // Test 2: Get AWS Identity (verify credentials work)
  console.log('📋 Test 1: Verifying AWS credentials...');
  try {
    const identityCmd = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} aws sts get-caller-identity --region us-east-1`;
    const { stdout } = await execAsync(identityCmd, { timeout: 10000 });
    const identity = JSON.parse(stdout);
    results.awsIdentity = {
      status: 'OK',
      message: `Credentials valid - User: ${identity.UserId}, Account: ${identity.Account}, ARN: ${identity.Arn}`
    };
    console.log('✅ Credentials are valid!\n');
  } catch (error) {
    results.awsIdentity = {
      status: 'FAILED',
      message: `Invalid credentials: ${error.message}`
    };
    console.log('❌ Credentials are invalid!\n');
    printResults(results);
    return;
  }

  // Test 3: List Lambda Functions
  console.log('📋 Test 2: Testing Lambda ListFunctions permission...');
  try {
    const lambdaListCmd = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} aws lambda list-functions --region us-east-1 --max-items 1`;
    await execAsync(lambdaListCmd, { timeout: 10000 });
    results.lambdaList = {
      status: 'OK',
      message: 'Can list Lambda functions'
    };
    console.log('✅ Lambda ListFunctions permission: OK\n');
  } catch (error) {
    const errorMsg = error.stderr || error.message;
    results.lambdaList = {
      status: 'FAILED',
      message: `Cannot list Lambda functions: ${errorMsg.substring(0, 200)}`
    };
    console.log('❌ Lambda ListFunctions permission: FAILED\n');
  }

  // Test 4: Get specific Lambda function
  console.log('📋 Test 3: Testing access to Remotion Lambda function...');
  try {
    const functionName = 'remotion-render-4-0-339-mem3008mb-disk2048mb-900sec';
    const lambdaGetCmd = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} aws lambda get-function --function-name ${functionName} --region us-east-1`;
    const { stdout } = await execAsync(lambdaGetCmd, { timeout: 10000 });
    const functionInfo = JSON.parse(stdout);
    results.lambdaFunction = {
      status: 'OK',
      message: `Function exists: ${functionInfo.Configuration.FunctionName}, State: ${functionInfo.Configuration.State}, Runtime: ${functionInfo.Configuration.Runtime}`
    };
    console.log('✅ Lambda function access: OK\n');
  } catch (error) {
    const errorMsg = error.stderr || error.message;
    if (errorMsg.includes('ResourceNotFoundException')) {
      results.lambdaFunction = {
        status: 'FAILED',
        message: 'Lambda function not found - function may not exist'
      };
    } else if (errorMsg.includes('AccessDenied')) {
      results.lambdaFunction = {
        status: 'FAILED',
        message: 'Access Denied - no permission to access this function'
      };
    } else {
      results.lambdaFunction = {
        status: 'FAILED',
        message: `Error: ${errorMsg.substring(0, 200)}`
      };
    }
    console.log('❌ Lambda function access: FAILED\n');
  }

  // Test 5: S3 Access
  console.log('📋 Test 4: Testing S3 bucket access...');
  try {
    const s3Cmd = `AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} aws s3 ls s3://remotionlambda-useast1-ad9v3yryvx/sites/video-editor/ --region us-east-1`;
    await execAsync(s3Cmd, { timeout: 10000 });
    results.s3Access = {
      status: 'OK',
      message: 'S3 bucket is accessible'
    };
    console.log('✅ S3 access: OK\n');
  } catch (error) {
    const errorMsg = error.stderr || error.message;
    results.s3Access = {
      status: 'FAILED',
      message: `Cannot access S3: ${errorMsg.substring(0, 200)}`
    };
    console.log('❌ S3 access: FAILED\n');
  }

  // Test 6: Remotion Lambda SDK
  console.log('📋 Test 5: Testing Remotion Lambda SDK...');
  try {
    const remotionCmd = `REMOTION_AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} REMOTION_AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} npx remotion lambda functions ls --region=us-east-1`;
    const { stdout } = await execAsync(remotionCmd, { timeout: 15000 });
    results.remotionFunctions = {
      status: 'OK',
      message: 'Remotion Lambda SDK can list functions',
      output: stdout.substring(0, 500)
    };
    console.log('✅ Remotion Lambda SDK: OK\n');
  } catch (error) {
    const errorMsg = error.stderr || error.message;
    if (errorMsg.includes('AccessDenied')) {
      results.remotionFunctions = {
        status: 'FAILED',
        message: 'Access Denied - This is the same error you\'re seeing. Missing lambda:ListFunctions permission.'
      };
    } else {
      results.remotionFunctions = {
        status: 'FAILED',
        message: `Error: ${errorMsg.substring(0, 500)}`
      };
    }
    console.log('❌ Remotion Lambda SDK: FAILED\n');
  }

  printResults(results);
}

function printResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60) + '\n');

  Object.entries(results).forEach(([test, result]) => {
    const icon = result.status === 'OK' ? '✅' : result.status === 'FAILED' ? '❌' : '⏳';
    console.log(`${icon} ${test.toUpperCase()}: ${result.status}`);
    console.log(`   ${result.message}\n`);
  });

  const passed = Object.values(results).filter(r => r.status === 'OK').length;
  const failed = Object.values(results).filter(r => r.status === 'FAILED').length;
  const total = Object.keys(results).length;

  console.log('='.repeat(60));
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    console.log('⚠️  ISSUES FOUND:');
    Object.entries(results).forEach(([test, result]) => {
      if (result.status === 'FAILED') {
        console.log(`   - ${test}: ${result.message}`);
      }
    });
    console.log('\n💡 SOLUTION:');
    console.log('   1. Go to AWS Console → IAM → Users');
    console.log('   2. Find your user and click "Add permissions"');
    console.log('   3. Attach these policies:');
    console.log('      - AWSLambda_FullAccess');
    console.log('      - AmazonS3FullAccess');
    console.log('      - CloudWatchLogsFullAccess');
    console.log('   4. Wait 1-2 minutes and test again\n');
  } else {
    console.log('🎉 All tests passed! Your credentials should work with Remotion Lambda.\n');
  }

  console.log('⚠️  SECURITY WARNING:');
  console.log('   These credentials were exposed. Please rotate them in AWS IAM after testing!\n');
}

// Run the tests
testCredentials().catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});

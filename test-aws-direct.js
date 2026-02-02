#!/usr/bin/env node

/**
 * Test AWS Credentials Directly Using AWS SDK
 * No AWS CLI required - uses Node.js AWS SDK
 */

// Try to load .env file
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use environment variables directly
}

const { LambdaClient, ListFunctionsCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

// Get credentials from environment or use defaults from .env file
const AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID || 'AKIA4O7BVEMBJOR4Y2OZ';
const AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY || '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';
const REGION = 'us-east-1';

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('❌ Error: REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY must be set in .env file');
  process.exit(1);
}

console.log('🔍 Testing AWS Credentials Directly...\n');
console.log(`Access Key: ${AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
console.log(`Region: ${REGION}\n`);

const results = {
  credentials: { status: 'PENDING', message: '' },
  awsIdentity: { status: 'PENDING', message: '' },
  lambdaList: { status: 'PENDING', message: '' },
  lambdaFunction: { status: 'PENDING', message: '' },
  s3Access: { status: 'PENDING', message: '' }
};

async function testCredentials() {
  // Configure AWS clients
  const awsConfig = {
    region: REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
  };

  // Test 1: Get AWS Identity
  console.log('📋 Test 1: Verifying AWS credentials...');
  try {
    const stsClient = new STSClient(awsConfig);
    const identityCommand = new GetCallerIdentityCommand({});
    const identity = await stsClient.send(identityCommand);
    
    results.awsIdentity = {
      status: 'OK',
      message: `Credentials valid - User: ${identity.UserId}, Account: ${identity.Account}, ARN: ${identity.Arn}`
    };
    console.log('✅ Credentials are valid!');
    console.log(`   User ID: ${identity.UserId}`);
    console.log(`   Account: ${identity.Account}`);
    console.log(`   ARN: ${identity.Arn}\n`);
  } catch (error) {
    results.awsIdentity = {
      status: 'FAILED',
      message: `Invalid credentials: ${error.message}`
    };
    console.log('❌ Credentials are invalid!');
    console.log(`   Error: ${error.message}\n`);
    printResults(results);
    return;
  }

  // Test 2: List Lambda Functions (This is what Remotion needs)
  console.log('📋 Test 2: Testing Lambda ListFunctions permission...');
  try {
    const lambdaClient = new LambdaClient(awsConfig);
    const listCommand = new ListFunctionsCommand({ MaxItems: 1 });
    const response = await lambdaClient.send(listCommand);
    
    results.lambdaList = {
      status: 'OK',
      message: `Can list Lambda functions (found ${response.Functions?.length || 0} functions)`
    };
    console.log('✅ Lambda ListFunctions permission: OK');
    console.log(`   Found ${response.Functions?.length || 0} function(s)\n`);
  } catch (error) {
    const errorMsg = error.message || String(error);
    results.lambdaList = {
      status: 'FAILED',
      message: `Cannot list Lambda functions: ${errorMsg}`
    };
    console.log('❌ Lambda ListFunctions permission: FAILED');
    console.log(`   Error: ${errorMsg}`);
    console.log(`   This is the main issue! You need lambda:ListFunctions permission.\n`);
  }

  // Test 3: Get specific Lambda function
  console.log('📋 Test 3: Testing access to Remotion Lambda function...');
  try {
    const lambdaClient = new LambdaClient(awsConfig);
    const functionName = 'remotion-render-4-0-339-mem3008mb-disk2048mb-900sec';
    const getFunctionCommand = new GetFunctionCommand({ FunctionName: functionName });
    const response = await lambdaClient.send(getFunctionCommand);
    
    results.lambdaFunction = {
      status: 'OK',
      message: `Function exists: ${response.Configuration.FunctionName}, State: ${response.Configuration.State}, Runtime: ${response.Configuration.Runtime}`
    };
    console.log('✅ Lambda function access: OK');
    console.log(`   Function: ${response.Configuration.FunctionName}`);
    console.log(`   State: ${response.Configuration.State}`);
    console.log(`   Runtime: ${response.Configuration.Runtime}\n`);
  } catch (error) {
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('ResourceNotFoundException')) {
      results.lambdaFunction = {
        status: 'FAILED',
        message: 'Lambda function not found - function may not exist'
      };
      console.log('❌ Lambda function not found');
      console.log('   The function "remotion-render-4-0-339-mem3008mb-disk2048mb-900sec" does not exist\n');
    } else if (errorMsg.includes('AccessDenied') || errorMsg.includes('UnauthorizedOperation')) {
      results.lambdaFunction = {
        status: 'FAILED',
        message: 'Access Denied - no permission to access this function'
      };
      console.log('❌ Access Denied');
      console.log('   You need lambda:GetFunction permission\n');
    } else {
      results.lambdaFunction = {
        status: 'FAILED',
        message: `Error: ${errorMsg}`
      };
      console.log(`❌ Error: ${errorMsg}\n`);
    }
  }

  // Test 4: S3 Access
  console.log('📋 Test 4: Testing S3 bucket access...');
  try {
    const s3Client = new S3Client(awsConfig);
    const bucketName = 'remotionlambda-useast1-ad9v3yryvx';
    const listCommand = new ListObjectsV2Command({ 
      Bucket: bucketName,
      Prefix: 'sites/video-editor/',
      MaxKeys: 1
    });
    await s3Client.send(listCommand);
    
    results.s3Access = {
      status: 'OK',
      message: 'S3 bucket is accessible'
    };
    console.log('✅ S3 access: OK\n');
  } catch (error) {
    const errorMsg = error.message || String(error);
    results.s3Access = {
      status: 'FAILED',
      message: `Cannot access S3: ${errorMsg}`
    };
    console.log('❌ S3 access: FAILED');
    console.log(`   Error: ${errorMsg}\n`);
  }

  printResults(results);
}

function printResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60) + '\n');

  Object.entries(results).forEach(([test, result]) => {
    const icon = result.status === 'OK' ? '✅' : result.status === 'FAILED' ? '❌' : '⏳';
    const testName = test.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
    console.log(`${icon} ${testName}: ${result.status}`);
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
        const testName = test.replace(/([A-Z])/g, ' $1').trim();
        console.log(`   - ${testName}: ${result.message}`);
      }
    });
    console.log('\n💡 SOLUTION:');
    console.log('   1. Go to AWS Console → IAM → Users');
    console.log('   2. Find your user (with access key starting with AKIA4O7BVEMBJOR4Y2OZ)');
    console.log('   3. Click "Add permissions" → "Attach policies directly"');
    console.log('   4. Attach these policies:');
    console.log('      - AWSLambda_FullAccess');
    console.log('      - AmazonS3FullAccess');
    console.log('      - CloudWatchLogsFullAccess');
    console.log('   5. Wait 1-2 minutes and run this test again\n');
  } else {
    console.log('🎉 All tests passed! Your credentials should work with Remotion Lambda.\n');
  }
}

// Run the tests
testCredentials().catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});

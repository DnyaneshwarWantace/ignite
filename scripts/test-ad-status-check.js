/**
 * Test script to verify ad status checking using Facebook ad IDs
 * This tests the functionality that auto-tracker uses to check if ads are still active
 */

require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SCRAPE_CREATORS_API_KEY = process.env.SCRAPE_CREATORS_API_KEY || process.env.NEXT_PUBLIC_SCRAPE_CREATORS_API_KEY;
const SCRAPE_CREATORS_BASE_URL = 'https://api.scrapecreators.com/v1/facebook/adLibrary';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!SCRAPE_CREATORS_API_KEY) {
  console.error('❌ Missing ScrapeCreators API key');
  console.error('   Required: SCRAPE_CREATORS_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check status of a single ad using Facebook ad ID
 */
async function checkAdStatus(libraryId) {
  try {
    console.log(`\n🔍 Checking ad status for: ${libraryId}`);
    
    const response = await axios.get(
      `${SCRAPE_CREATORS_BASE_URL}/ad`,
      {
        params: {
          id: libraryId
        },
        headers: {
          'x-api-key': SCRAPE_CREATORS_API_KEY
        }
      }
    );

    const adData = response.data;
    
    // Parse the content to get status
    const content = typeof adData === 'string' ? JSON.parse(adData) : adData;
    const isActive = content.is_active;
    const pageName = content.page_name || content.snapshot?.page_name || 'Unknown';
    
    console.log(`   ✅ API Response received`);
    console.log(`   📊 Status: ${isActive === false ? '❌ NOT RUNNING' : '✅ RUNNING'}`);
    console.log(`   📄 Page: ${pageName}`);
    console.log(`   🆔 Ad ID: ${content.id || content.ad_archive_id || libraryId}`);
    
    if (content.snapshot) {
      console.log(`   📝 Has snapshot: Yes`);
      if (content.snapshot.body) {
        const bodyText = typeof content.snapshot.body === 'string' 
          ? content.snapshot.body 
          : content.snapshot.body.text || '';
        console.log(`   📝 Body preview: ${bodyText.substring(0, 100)}...`);
      }
    }
    
    return {
      libraryId,
      isActive,
      content: JSON.stringify(content),
      success: true
    };
    
  } catch (error) {
    console.error(`   ❌ Error checking ad ${libraryId}:`, error.response?.status || error.message);
    if (error.response?.data) {
      console.error(`   📄 Response:`, JSON.stringify(error.response.data).substring(0, 200));
    }
    return {
      libraryId,
      isActive: null,
      success: false,
      error: error.message
    };
  }
}

/**
 * Test ad status checking with ads from database
 */
async function testAdStatusChecking() {
  console.log('🧪 Testing Ad Status Checking Functionality\n');
  console.log('='.repeat(60));
  
  // Get a few ads from database to test
  console.log('\n📊 Fetching ads from database...');
  const { data: ads, error: fetchError } = await supabase
    .from('ads')
    .select('id, library_id, content')
    .limit(5)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('❌ Error fetching ads:', fetchError);
    return;
  }

  if (!ads || ads.length === 0) {
    console.log('⚠️  No ads found in database. Please scrape some ads first.');
    return;
  }

  console.log(`✅ Found ${ads.length} ads in database`);
  console.log(`\n🧪 Testing status check for ${Math.min(ads.length, 3)} ads...\n`);

  const results = [];
  
  // Test first 3 ads
  for (let i = 0; i < Math.min(ads.length, 3); i++) {
    const ad = ads[i];
    const libraryId = ad.library_id;
    
    // Get current status from database
    let dbContent;
    let dbStatus;
    try {
      dbContent = typeof ad.content === 'string' ? JSON.parse(ad.content) : ad.content;
      dbStatus = dbContent.is_active;
    } catch (e) {
      dbContent = {};
      dbStatus = undefined;
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Ad ${i + 1}/${Math.min(ads.length, 3)}`);
    console.log(`   Database ID: ${ad.id}`);
    console.log(`   Library ID: ${libraryId}`);
    console.log(`   Current DB Status: ${dbStatus === false ? '❌ NOT RUNNING' : dbStatus === true ? '✅ RUNNING' : '❓ UNKNOWN'}`);
    
    // Check status via API
    const result = await checkAdStatus(libraryId);
    result.dbStatus = dbStatus;
    results.push(result);
    
    // Compare statuses
    if (result.success) {
      // Normalize statuses: undefined/null/true = RUNNING, false = NOT RUNNING
      const dbIsRunning = dbStatus !== false;
      const apiIsRunning = result.isActive !== false;
      
      if (dbIsRunning !== apiIsRunning) {
        console.log(`   ⚠️  STATUS MISMATCH!`);
        console.log(`      Database: ${dbIsRunning ? 'RUNNING' : 'NOT RUNNING'}`);
        console.log(`      Facebook API: ${apiIsRunning ? 'RUNNING' : 'NOT RUNNING'}`);
        result.statusChanged = true;
      } else {
        console.log(`   ✅ Status matches database (${apiIsRunning ? 'RUNNING' : 'NOT RUNNING'})`);
        result.statusChanged = false;
      }
    }
    
    // Small delay to avoid rate limiting
    if (i < Math.min(ads.length, 3) - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const statusChanged = results.filter(r => r.success && r.statusChanged === true).length;
  
  console.log(`\n✅ Successful checks: ${successful}/${results.length}`);
  console.log(`❌ Failed checks: ${failed}/${results.length}`);
  console.log(`🔄 Status changes detected: ${statusChanged}`);
  
  if (statusChanged > 0) {
    console.log(`\n⚠️  Some ads have status mismatches - auto-tracker would update these`);
  }
  
  console.log(`\n✅ Test complete!`);
  console.log(`\n💡 This is how auto-tracker checks ad status:`);
  console.log(`   1. Gets all ads from database`);
  console.log(`   2. For each ad, calls Facebook API with library_id`);
  console.log(`   3. Compares is_active status`);
  console.log(`   4. Updates database if status changed`);
}

// Run the test
testAdStatusChecking()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

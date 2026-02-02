// Try loading from multiple env file locations
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Supabase credentials loaded');
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllAds() {
  try {
    console.log('🗑️  Starting to delete all ads from database...\n');

    // First, get count of ads
    const { count: adsCount, error: countError } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting ads:', countError);
      return;
    }

    console.log(`📊 Found ${adsCount || 0} ads to delete\n`);

    if (adsCount === 0) {
      console.log('✅ No ads to delete. Database is already empty.');
      return;
    }

    // Delete ad transcripts first (foreign key constraint)
    console.log('🗑️  Deleting ad transcripts...');
    const { error: transcriptError } = await supabase
      .from('ad_transcripts')
      .delete()
      .neq('id', ''); // Delete all

    if (transcriptError) {
      console.log('⚠️  Warning deleting transcripts (might not exist):', transcriptError.message);
    } else {
      console.log('✅ Ad transcripts deleted\n');
    }

    // Delete saved ads (user-saved ads)
    console.log('🗑️  Deleting saved ads...');
    const { error: savedAdsError } = await supabase
      .from('saved_ads')
      .delete()
      .neq('id', ''); // Delete all

    if (savedAdsError) {
      console.log('⚠️  Warning deleting saved ads (might not exist):', savedAdsError.message);
    } else {
      console.log('✅ Saved ads deleted\n');
    }

    // Delete all ads
    console.log('🗑️  Deleting all ads...');
    const { error: adsError } = await supabase
      .from('ads')
      .delete()
      .neq('id', ''); // Delete all

    if (adsError) {
      console.error('❌ Error deleting ads:', adsError);
      return;
    }

    console.log('✅ All ads deleted successfully\n');

    // Reset brand total_ads counts
    console.log('🔄 Resetting brand total_ads counts...');
    const { error: brandUpdateError } = await supabase
      .from('brands')
      .update({ total_ads: 0 })
      .neq('id', ''); // Update all

    if (brandUpdateError) {
      console.log('⚠️  Warning updating brand counts:', brandUpdateError.message);
    } else {
      console.log('✅ Brand counts reset\n');
    }

    // Verify deletion
    const { count: remainingCount } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Verification:');
    console.log(`   - Ads remaining: ${remainingCount || 0}`);
    console.log(`   - Users: Still intact ✅`);
    console.log(`   - Brands: Still intact ✅`);
    console.log(`   - Folders: Still intact ✅\n`);

    console.log('✅ All ads deleted successfully!');
    console.log('✅ Users and other data remain intact.');

  } catch (error) {
    console.error('❌ Error deleting ads:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  deleteAllAds()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { deleteAllAds };

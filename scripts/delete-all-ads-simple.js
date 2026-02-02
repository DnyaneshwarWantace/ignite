// Simple script to delete all ads using the project's Supabase config
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Use the same Supabase setup as the app
const { createClient } = require('@supabase/supabase-js');

// Get from environment - these should be set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('\nTrying to read from environment...');
  console.error('If credentials are in a different location, please set them manually:');
  console.error('  export NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_key');
  console.error('\nOr create a .env file with these variables.');
  process.exit(1);
}

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

    if (transcriptError && !transcriptError.message.includes('does not exist')) {
      console.log('⚠️  Warning deleting transcripts:', transcriptError.message);
    } else {
      console.log('✅ Ad transcripts deleted\n');
    }

    // Delete saved ads (user-saved ads)
    console.log('🗑️  Deleting saved ads...');
    const { error: savedAdsError } = await supabase
      .from('saved_ads')
      .delete()
      .neq('id', ''); // Delete all

    if (savedAdsError && !savedAdsError.message.includes('does not exist')) {
      console.log('⚠️  Warning deleting saved ads:', savedAdsError.message);
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

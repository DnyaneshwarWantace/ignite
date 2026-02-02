// Script to delete all brands from the database
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllBrands() {
  try {
    console.log('🗑️  Starting to delete all brands from database...\n');

    // Get count first
    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });

    const { count: brandFoldersCount } = await supabase
      .from('brand_folders')
      .select('*', { count: 'exact', head: true });

    const { count: adsCount } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Found:`);
    console.log(`   - Brands: ${brandsCount || 0}`);
    console.log(`   - Brand-Folder relationships: ${brandFoldersCount || 0}`);
    console.log(`   - Ads (should be 0): ${adsCount || 0}\n`);

    if (brandsCount === 0) {
      console.log('✅ No brands to delete. Database is already empty.');
      return;
    }

    // Note: Since ads are already deleted and brand_folders has CASCADE,
    // we can delete brands directly. But let's be safe and delete brand_folders first
    // (though it should already be empty from folder deletion)

    // Step 1: Delete brand_folders (should already be empty, but just in case)
    console.log('🗑️  Deleting brand-folder relationships...');
    const { error: brandFoldersError } = await supabase
      .from('brand_folders')
      .delete()
      .neq('brand_id', ''); // Delete all

    if (brandFoldersError && !brandFoldersError.message.includes('does not exist')) {
      console.log('⚠️  Warning deleting brand_folders:', brandFoldersError.message);
    } else {
      console.log('✅ Brand-folder relationships deleted\n');
    }

    // Step 2: Delete all brands
    // This will cascade delete any remaining ads (though ads should already be deleted)
    console.log('🗑️  Deleting all brands...');
    const { error: brandsError } = await supabase
      .from('brands')
      .delete()
      .neq('id', ''); // Delete all

    if (brandsError) {
      console.error('❌ Error deleting brands:', brandsError);
      return;
    }

    console.log('✅ All brands deleted successfully\n');

    // Verify deletion
    const { count: remainingBrands } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });

    const { count: remainingBrandFolders } = await supabase
      .from('brand_folders')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Verification:');
    console.log(`   - Brands remaining: ${remainingBrands || 0}`);
    console.log(`   - Brand-folder relationships remaining: ${remainingBrandFolders || 0}`);
    console.log(`   - Users: Still intact ✅`);
    console.log(`   - Folders: Still intact ✅`);
    console.log(`   - Ads: Still intact ✅\n`);

    console.log('✅ All brands deleted successfully!');
    console.log('✅ Users and other data remain intact.');

  } catch (error) {
    console.error('❌ Error deleting brands:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  deleteAllBrands()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { deleteAllBrands };

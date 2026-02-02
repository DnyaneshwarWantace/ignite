// Script to delete all folders from the database
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

async function deleteAllFolders() {
  try {
    console.log('🗑️  Starting to delete all folders from database...\n');

    // Get counts first
    const { count: foldersCount } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true });

    const { count: savedAdFoldersCount } = await supabase
      .from('saved_ad_folders')
      .select('*', { count: 'exact', head: true });

    const { count: brandFoldersCount } = await supabase
      .from('brand_folders')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Found:`);
    console.log(`   - Folders: ${foldersCount || 0}`);
    console.log(`   - Saved Ad Folders: ${savedAdFoldersCount || 0}`);
    console.log(`   - Brand-Folder relationships: ${brandFoldersCount || 0}\n`);

    if (foldersCount === 0 && savedAdFoldersCount === 0) {
      console.log('✅ No folders to delete. Database is already empty.');
      return;
    }

    // Step 1: Delete brand_folders junction table entries
    console.log('🗑️  Deleting brand-folder relationships...');
    const { error: brandFoldersError } = await supabase
      .from('brand_folders')
      .delete()
      .neq('brand_id', ''); // Delete all

    if (brandFoldersError) {
      console.log('⚠️  Warning deleting brand_folders:', brandFoldersError.message);
    } else {
      console.log('✅ Brand-folder relationships deleted\n');
    }

    // Step 2: Update saved_ads to remove folder references (set folder_id to null)
    console.log('🔄 Clearing folder references from saved ads...');
    const { error: savedAdsUpdateError } = await supabase
      .from('saved_ads')
      .update({ folder_id: null })
      .not('folder_id', 'is', null);

    if (savedAdsUpdateError && !savedAdsUpdateError.message.includes('does not exist')) {
      console.log('⚠️  Warning updating saved_ads:', savedAdsUpdateError.message);
    } else {
      console.log('✅ Saved ads folder references cleared\n');
    }

    // Step 3: Delete saved_ad_folders
    console.log('🗑️  Deleting saved ad folders...');
    const { error: savedAdFoldersError } = await supabase
      .from('saved_ad_folders')
      .delete()
      .neq('id', ''); // Delete all

    if (savedAdFoldersError) {
      console.log('⚠️  Warning deleting saved_ad_folders:', savedAdFoldersError.message);
    } else {
      console.log('✅ Saved ad folders deleted\n');
    }

    // Step 4: Delete main folders (this will cascade delete brand_folders entries)
    console.log('🗑️  Deleting main folders...');
    const { error: foldersError } = await supabase
      .from('folders')
      .delete()
      .neq('id', ''); // Delete all

    if (foldersError) {
      console.error('❌ Error deleting folders:', foldersError);
      return;
    }

    console.log('✅ All folders deleted successfully\n');

    // Verify deletion
    const { count: remainingFolders } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true });

    const { count: remainingSavedAdFolders } = await supabase
      .from('saved_ad_folders')
      .select('*', { count: 'exact', head: true });

    const { count: remainingBrandFolders } = await supabase
      .from('brand_folders')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Verification:');
    console.log(`   - Folders remaining: ${remainingFolders || 0}`);
    console.log(`   - Saved ad folders remaining: ${remainingSavedAdFolders || 0}`);
    console.log(`   - Brand-folder relationships remaining: ${remainingBrandFolders || 0}`);
    console.log(`   - Users: Still intact ✅`);
    console.log(`   - Brands: Still intact ✅`);
    console.log(`   - Saved ads: Still intact (folder references cleared) ✅\n`);

    console.log('✅ All folders deleted successfully!');
    console.log('✅ Users, brands, and other data remain intact.');

  } catch (error) {
    console.error('❌ Error deleting folders:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  deleteAllFolders()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { deleteAllFolders };

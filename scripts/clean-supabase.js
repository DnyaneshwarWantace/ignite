/**
 * Clean Supabase: delete all ads, folders, saved ads/folders, brands, and media storage.
 * Run: node scripts/clean-supabase.js
 * Uses .env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllFromTable(table, label) {
  const { data: rows, error: selectError } = await supabase.from(table).select('id');
  if (selectError) {
    if (selectError.message.includes('does not exist')) return { deleted: 0 };
    throw selectError;
  }
  const ids = (rows || []).map((r) => r.id).filter(Boolean);
  if (ids.length === 0) {
    console.log(`   ${label}: 0 rows`);
    return { deleted: 0 };
  }
  const { error: deleteError } = await supabase.from(table).delete().in('id', ids);
  if (deleteError) throw deleteError;
  console.log(`   ✅ ${label}: ${ids.length} deleted`);
  return { deleted: ids.length };
}

async function deleteAllAdsTable() {
  const { count, error: countErr } = await supabase.from('ads').select('*', { count: 'exact', head: true });
  if (countErr) {
    if (countErr.message.includes('does not exist')) return;
    throw countErr;
  }
  if (count === 0) {
    console.log('   ads: 0 rows');
    return;
  }
  const { error } = await supabase.from('ads').delete().neq('id', '');
  if (error) throw error;
  console.log(`   ✅ ads: ${count} deleted`);
}

async function listAllStoragePaths(bucket, prefix = '') {
  const { data: items, error } = await supabase.storage.from(bucket).list(prefix || '', { limit: 1000 });
  if (error) throw error;
  if (!items || items.length === 0) return [];
  const paths = [];
  for (const item of items) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    const { data: sub } = await supabase.storage.from(bucket).list(path, { limit: 1 });
    if (sub && sub.length > 0) {
      const nested = await listAllStoragePaths(bucket, path);
      paths.push(...nested);
    } else {
      paths.push(path);
    }
  }
  return paths;
}

async function emptyStorageBucket(bucketName) {
  console.log(`\n🗑️  Storage bucket "${bucketName}"...`);
  const allPaths = await listAllStoragePaths(bucketName);
  if (allPaths.length === 0) {
    console.log(`   No files found.`);
    return;
  }
  const batchSize = 500;
  for (let i = 0; i < allPaths.length; i += batchSize) {
    const batch = allPaths.slice(i, i + batchSize);
    const { error } = await supabase.storage.from(bucketName).remove(batch);
    if (error) throw error;
    console.log(`   ✅ Deleted ${batch.length} files (${Math.min(i + batchSize, allPaths.length)}/${allPaths.length})`);
  }
  console.log(`   ✅ Total: ${allPaths.length} files removed.`);
}

async function run() {
  console.log('\n🧹 CLEAN SUPABASE – ads, folders, saved ads, brands, media storage\n');

  try {
    // 1. Ad transcripts (FK to ads)
    console.log('1. Ad transcripts');
    await deleteAllFromTable('ad_transcripts', 'ad_transcripts').catch(() => {});

    // 2. Saved ads
    console.log('\n2. Saved ads');
    await deleteAllFromTable('saved_ads', 'saved_ads').catch(() => {});

    // 3. Saved ad folders
    console.log('\n3. Saved ad folders');
    await deleteAllFromTable('saved_ad_folders', 'saved_ad_folders').catch(() => {});

    // 4. Brand–folder junction
    console.log('\n4. Brand–folder links');
    const { data: bfRows } = await supabase.from('brand_folders').select('brand_id, folder_id');
    if (bfRows && bfRows.length > 0) {
      const { error } = await supabase.from('brand_folders').delete().neq('brand_id', '');
      if (error && !error.message.includes('does not exist')) throw error;
      console.log(`   ✅ brand_folders: ${bfRows.length} deleted`);
    } else {
      console.log('   brand_folders: 0 rows');
    }

    // 5. Ads
    console.log('\n5. Ads');
    await deleteAllAdsTable();

    // 6. Folders (x-ray folders)
    console.log('\n6. Folders');
    await deleteAllFromTable('folders', 'folders').catch(() => {});

    // 7. Brands
    console.log('\n7. Brands');
    await deleteAllFromTable('brands', 'brands').catch(() => {});

    // 8. Storage: media bucket (ads/images, ads/videos)
    await emptyStorageBucket('media');

    console.log('\n✅ Supabase clean finished: ads, folders, saved ads/folders, brands, and media storage cleared.\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { run };

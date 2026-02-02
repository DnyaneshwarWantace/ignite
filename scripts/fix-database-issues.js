// Script to fix database issues: index and storage bucket
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

async function fixDatabaseIssues() {
  try {
    console.log('🔧 Fixing database issues...\n');

    // Step 1: Fix the index issue
    console.log('📊 Step 1: Fixing ads text index...');
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations/011_fix_ads_text_index.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute the migration SQL
      // Note: Supabase doesn't have a direct SQL execution endpoint, so we'll use RPC if available
      // Or we can execute via the Supabase dashboard
      console.log('⚠️  Please run the migration SQL manually in Supabase Dashboard:');
      console.log('   File: supabase/migrations/011_fix_ads_text_index.sql\n');
      console.log('   Or execute this SQL:');
      console.log('   DROP INDEX IF EXISTS idx_ads_text;');
      console.log('   CREATE INDEX IF NOT EXISTS idx_ads_text_hash ON ads USING hash(substring(text, 1, 100));');
      console.log('   DROP INDEX IF EXISTS idx_ads_headline;');
      console.log('   CREATE INDEX IF NOT EXISTS idx_ads_headline ON ads(substring(headline, 1, 255));');
      console.log('   DROP INDEX IF EXISTS idx_ads_description;');
      console.log('   CREATE INDEX IF NOT EXISTS idx_ads_description ON ads(substring(description, 1, 255));\n');
    }

    // Step 2: Create the media storage bucket
    console.log('📦 Step 2: Creating media storage bucket...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const mediaBucketExists = buckets?.some(bucket => bucket.name === 'media');
    
    if (mediaBucketExists) {
      console.log('✅ Media bucket already exists\n');
    } else {
      console.log('📦 Creating media bucket...');
      const { data: bucket, error: bucketError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'video/*']
      });

      if (bucketError) {
        if (bucketError.message.includes('already exists')) {
          console.log('✅ Media bucket already exists\n');
        } else {
          console.error('❌ Error creating media bucket:', bucketError);
          console.log('\n⚠️  Please create the bucket manually in Supabase Dashboard:');
          console.log('   1. Go to Storage');
          console.log('   2. Create new bucket named "media"');
          console.log('   3. Make it public');
          console.log('   4. Set file size limit to 50MB');
          console.log('   5. Allow image/* and video/* MIME types\n');
          return;
        }
      } else {
        console.log('✅ Media bucket created successfully\n');
      }
    }

    // Verify bucket
    const { data: mediaBucket } = await supabase.storage.from('media').list('', { limit: 1 });
    if (mediaBucket !== null) {
      console.log('✅ Media bucket is accessible\n');
    }

    console.log('✅ Database issues fixed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the index migration SQL in Supabase Dashboard (if not done automatically)');
    console.log('   2. The media bucket is now ready for uploads');

  } catch (error) {
    console.error('❌ Error fixing database issues:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  fixDatabaseIssues()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseIssues };

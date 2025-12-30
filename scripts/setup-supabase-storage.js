const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase Storage...\n');

    // Create the media bucket
    console.log('📦 Creating "media" bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('media', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/*', 'video/*']
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket "media" already exists');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Bucket "media" created successfully');
    }

    console.log('\n✅ Supabase Storage setup complete!');
    console.log('\n📊 Bucket Details:');
    console.log('  - Name: media');
    console.log('  - Public: Yes');
    console.log('  - Max file size: 50MB');
    console.log('  - Allowed types: images and videos');
    console.log('\n🎯 Next steps:');
    console.log('  1. All ad images/videos will now be stored in Supabase');
    console.log('  2. Public URLs: https://[your-project].supabase.co/storage/v1/object/public/media/...');
    console.log('  3. Remove Cloudinary environment variables from .env');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupStorage();

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBuckets() {
  console.log('📦 Creating editor storage buckets...');

  const buckets = [
    { name: 'editor-uploads', public: true },
    { name: 'editor-exports', public: true },
    { name: 'editor-fonts', public: true }
  ];

  for (const bucket of buckets) {
    console.log(`Creating bucket: ${bucket.name}`);
    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`✓ Bucket '${bucket.name}' already exists`);
      } else {
        console.error(`✗ Failed to create bucket '${bucket.name}':`, error.message);
      }
    } else {
      console.log(`✓ Bucket '${bucket.name}' created successfully`);
    }
  }
}

async function runMigration() {
  console.log('\n📊 Running editor schema migration...');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    return;
  }

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationPath = path.join(process.cwd(), 'supabase/migrations/002_editor_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await client.query(sql);
    console.log('✓ Editor schema migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    await createStorageBuckets();
    await runMigration();
    console.log('\n✅ Editor setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Storage buckets created: editor-uploads, editor-exports, editor-fonts');
    console.log('2. Database tables created with editor_ prefix');
    console.log('3. Ready to use video and image editors');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();

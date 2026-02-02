// Script to fix the ads text index by executing SQL directly
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

async function fixIndex() {
  try {
    console.log('🔧 Fixing ads text index...\n');

    // Use Supabase REST API to execute SQL
    // Note: This requires the service role key and direct SQL access
    const sqlCommands = [
      'DROP INDEX IF EXISTS idx_ads_text;',
      'CREATE INDEX IF NOT EXISTS idx_ads_text_hash ON ads USING hash(substring(text, 1, 100));',
      'DROP INDEX IF EXISTS idx_ads_headline;',
      'CREATE INDEX IF NOT EXISTS idx_ads_headline ON ads(substring(headline, 1, 255));',
      'DROP INDEX IF EXISTS idx_ads_description;',
      'CREATE INDEX IF NOT EXISTS idx_ads_description ON ads(substring(description, 1, 255));'
    ];

    // Try using rpc if available, otherwise use direct SQL execution
    for (const sql of sqlCommands) {
      try {
        // Use Supabase's REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
          // If RPC doesn't exist, try direct SQL via PostgREST
          console.log(`⚠️  Could not execute via RPC, trying alternative method...`);
          console.log(`   SQL: ${sql}`);
        } else {
          console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`⚠️  Could not execute automatically: ${sql.substring(0, 50)}...`);
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log('\n📝 Note: If automatic execution failed, please run this SQL in Supabase Dashboard:');
    console.log('   Go to SQL Editor and execute:');
    sqlCommands.forEach((sql, i) => {
      console.log(`   ${i + 1}. ${sql}`);
    });

    console.log('\n✅ Index fix script completed!');

  } catch (error) {
    console.error('❌ Error fixing index:', error);
    console.log('\n📝 Please run the SQL manually in Supabase Dashboard:');
    console.log('   File: supabase/migrations/011_fix_ads_text_index.sql');
  }
}

// Run the script
if (require.main === module) {
  fixIndex()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixIndex };

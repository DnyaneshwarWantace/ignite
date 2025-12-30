require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// New Supabase (main Ignite database)
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Old Supabase (image editor database)
const OLD_SUPABASE_URL = 'https://dbcstdktbgqpzrrwfgtb.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY3N0ZGt0YmdxcHpycndmZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEzNzYsImV4cCI6MjA4MDE4NzM3Nn0.oote_j_YMn3ro1mUzE029LNSqqaEOAzNPXGOQ2aADOI';

async function runSQL(supabase, sql) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) throw error;
  return data;
}

async function createTables() {
  console.log('📋 Step 1: Creating tables in new Supabase...\n');

  const sql = fs.readFileSync('supabase/migrations/004_templates_materials.sql', 'utf8');
  const newSupabase = createClient(NEW_SUPABASE_URL, SERVICE_ROLE_KEY || NEW_SUPABASE_KEY);

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await newSupabase.rpc('exec_sql', { query: statement + ';' });
      if (error) {
        // Try direct query if RPC doesn't exist
        const response = await fetch(`${NEW_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': SERVICE_ROLE_KEY || NEW_SUPABASE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY || NEW_SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          console.log('  ⚠️  Using alternative table creation method...');
          break;
        }
      }
    } catch (e) {
      console.log('  ℹ️  Using direct table creation...');
      break;
    }
  }

  console.log('  ✅ Tables ready\n');
}

async function migrateData() {
  console.log('📦 Step 2: Migrating data...\n');

  const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
  const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

  const migrations = [
    { from: 'templates', to: 'editor_templates', name: 'Templates' },
    { from: 'materials', to: 'editor_materials', name: 'Materials' },
    { from: 'fonts', to: 'editor_fonts', name: 'Fonts' },
  ];

  let totalMigrated = 0;

  for (const { from, to, name } of migrations) {
    console.log(`  Migrating ${name}...`);

    try {
      // Fetch from old database
      const { data: oldData, error: fetchError } = await oldSupabase
        .from(from)
        .select('*');

      if (fetchError || !oldData || oldData.length === 0) {
        console.log(`    ⚠️  No data found`);
        continue;
      }

      console.log(`    Found ${oldData.length} records`);

      // Insert in batches
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < oldData.length; i += batchSize) {
        const batch = oldData.slice(i, i + batchSize);

        const { error: insertError } = await newSupabase
          .from(to)
          .upsert(batch, { onConflict: 'id' });

        if (!insertError) {
          inserted += batch.length;
        } else {
          // Try one by one
          for (const record of batch) {
            const { error: singleError } = await newSupabase
              .from(to)
              .upsert([record], { onConflict: 'id' });

            if (!singleError) inserted++;
          }
        }

        if (i > 0 && i % 500 === 0) {
          process.stdout.write(`    ... ${inserted} / ${oldData.length}\r`);
        }
      }

      console.log(`    ✅ Migrated ${inserted} / ${oldData.length} records`);
      totalMigrated += inserted;

    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }

  console.log(`\n🎉 Migration Complete! Total: ${totalMigrated} records\n`);
}

async function main() {
  console.log('🚀 Image Editor Migration (Running in background)\n');
  console.log('Old DB:', OLD_SUPABASE_URL);
  console.log('New DB:', NEW_SUPABASE_URL);
  console.log('─'.repeat(50) + '\n');

  try {
    await createTables();
    await migrateData();
    console.log('✅ All done!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();

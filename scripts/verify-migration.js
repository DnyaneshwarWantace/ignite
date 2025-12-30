require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const OLD_URL = 'https://dbcstdktbgqpzrrwfgtb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY3N0ZGt0YmdxcHpycndmZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEzNzYsImV4cCI6MjA4MDE4NzM3Nn0.oote_j_YMn3ro1mUzE029LNSqqaEOAzNPXGOQ2aADOI';

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function verify() {
  console.log('🔍 Verifying Migration\n');
  console.log('Old DB:', OLD_URL);
  console.log('New DB:', NEW_URL);
  console.log('═'.repeat(60) + '\n');

  const oldDB = createClient(OLD_URL, OLD_KEY);
  const newDB = createClient(NEW_URL, NEW_KEY);

  const checks = [
    { old: 'templates', new: 'editor_templates', name: 'Templates' },
    { old: 'materials', new: 'editor_materials', name: 'Materials' },
    { old: 'fonts', new: 'editor_fonts', name: 'Fonts' },
  ];

  let allGood = true;

  for (const { old: oldTable, new: newTable, name } of checks) {
    console.log(`📊 ${name}`);
    console.log('─'.repeat(60));

    // Check old database
    const { data: oldData, error: oldError } = await oldDB
      .from(oldTable)
      .select('*', { count: 'exact', head: true });

    if (oldError) {
      console.log(`  ❌ Old table error: ${oldError.message}`);
      continue;
    }

    const oldCount = oldData || 0;
    console.log(`  Old Database (${oldTable}): ${oldCount} records`);

    // Check new database
    const { data: newData, error: newError } = await newDB
      .from(newTable)
      .select('*', { count: 'exact', head: true });

    if (newError) {
      console.log(`  ❌ New table doesn't exist: ${newError.message}`);
      console.log(`  ⚠️  Table '${newTable}' needs to be created in new Supabase!`);
      allGood = false;
      console.log('');
      continue;
    }

    const newCount = newData || 0;
    console.log(`  New Database (${newTable}): ${newCount} records`);

    // Compare counts
    if (oldCount === newCount) {
      console.log(`  ✅ Migration complete! All ${oldCount} records migrated`);
    } else if (newCount > 0) {
      console.log(`  ⚠️  Partial migration: ${newCount}/${oldCount} records`);
      console.log(`  📝 Missing: ${oldCount - newCount} records`);
      allGood = false;
    } else {
      console.log(`  ❌ No data migrated (0/${oldCount})`);
      allGood = false;
    }

    // Sample verification - check first 3 records match
    if (newCount > 0) {
      const { data: oldSample } = await oldDB
        .from(oldTable)
        .select('id, name')
        .limit(3);

      const { data: newSample } = await newDB
        .from(newTable)
        .select('id, name')
        .limit(3);

      console.log('\n  Sample records:');
      if (oldSample && newSample) {
        const oldIds = new Set(oldSample.map(r => r.id));
        const newIds = new Set(newSample.map(r => r.id));

        let sampleMatch = 0;
        oldSample.forEach(old => {
          if (newIds.has(old.id)) {
            console.log(`    ✓ "${old.name}" (${old.id.substring(0, 8)}...)`);
            sampleMatch++;
          }
        });

        if (sampleMatch === 0) {
          console.log(`    ⚠️  No matching records found in sample`);
        }
      }
    }

    console.log('');
  }

  console.log('═'.repeat(60));
  if (allGood) {
    console.log('✅ All migrations verified successfully!\n');
  } else {
    console.log('⚠️  Some migrations incomplete. See details above.\n');
    console.log('To complete migration:');
    console.log('1. Run the SQL in supabase/migrations/004_templates_materials.sql');
    console.log('2. Then run: node scripts/simple-migration.js\n');
  }
}

verify().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});

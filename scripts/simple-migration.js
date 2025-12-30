require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const OLD_URL = 'https://dbcstdktbgqpzrrwfgtb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY3N0ZGt0YmdxcHpycndmZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEzNzYsImV4cCI6MjA4MDE4NzM3Nn0.oote_j_YMn3ro1mUzE029LNSqqaEOAzNPXGOQ2aADOI';

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function migrate() {
  console.log('🚀 Migrating Image Editor Data\n');

  const oldDB = createClient(OLD_URL, OLD_KEY);
  const newDB = createClient(NEW_URL, NEW_KEY);

  const tables = [
    { old: 'templates', new: 'editor_templates' },
    { old: 'materials', new: 'editor_materials' },
    { old: 'fonts', new: 'editor_fonts' },
  ];

  for (const { old: oldTable, new: newTable } of tables) {
    console.log(`\n📦 ${oldTable} → ${newTable}`);

    const { data, error } = await oldDB.from(oldTable).select('*');

    if (error || !data) {
      console.log(`  ❌ ${error?.message || 'No data'}`);
      continue;
    }

    console.log(`  Found: ${data.length} records`);

    let success = 0;
    const batchSize = 50;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { error: insertError } = await newDB.from(newTable).upsert(batch);

      if (!insertError) {
        success += batch.length;
        process.stdout.write(`  Progress: ${success}/${data.length}\r`);
      }
    }

    console.log(`\n  ✅ Migrated: ${success}/${data.length}`);
  }

  console.log('\n✅ Done!\n');
}

migrate().catch(console.error);

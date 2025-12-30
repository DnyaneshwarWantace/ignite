require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const OLD_URL = 'https://dbcstdktbgqpzrrwfgtb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY3N0ZGt0YmdxcHpycndmZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEzNzYsImV4cCI6MjA4MDE4NzM3Nn0.oote_j_YMn3ro1mUzE029LNSqqaEOAzNPXGOQ2aADOI';

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  console.log('🔍 Checking Actual Data\n');

  const oldDB = createClient(OLD_URL, OLD_KEY);
  const newDB = createClient(NEW_URL, NEW_KEY);

  const tables = [
    { old: 'templates', new: 'editor_templates', name: 'Templates' },
    { old: 'materials', new: 'editor_materials', name: 'Materials' },
    { old: 'fonts', new: 'editor_fonts', name: 'Fonts' },
  ];

  for (const { old: oldTable, new: newTable, name } of tables) {
    console.log(`\n📊 ${name}`);
    console.log('─'.repeat(60));

    // Get actual data from old
    const { data: oldData, error: oldError } = await oldDB
      .from(oldTable)
      .select('id, name')
      .limit(5);

    if (oldError) {
      console.log(`  ❌ Old: ${oldError.message}`);
    } else {
      console.log(`  Old Database: ${oldData ? oldData.length : 0} records (showing first 5)`);
      if (oldData && oldData.length > 0) {
        oldData.forEach((item, i) => {
          console.log(`    ${i + 1}. ${item.name} (${item.id.substring(0, 12)}...)`);
        });

        // Get total count
        const { data: allOld } = await oldDB.from(oldTable).select('id');
        console.log(`  📦 Total in old DB: ${allOld ? allOld.length : 0}`);
      }
    }

    // Get actual data from new
    const { data: newData, error: newError } = await newDB
      .from(newTable)
      .select('id, name')
      .limit(5);

    if (newError) {
      console.log(`  ❌ New: ${newError.message}`);
      console.log(`  ⚠️  Table '${newTable}' doesn't exist! Run SQL first.`);
    } else {
      console.log(`\n  New Database: ${newData ? newData.length : 0} records (showing first 5)`);
      if (newData && newData.length > 0) {
        newData.forEach((item, i) => {
          console.log(`    ${i + 1}. ${item.name} (${item.id.substring(0, 12)}...)`);
        });

        // Get total count
        const { data: allNew } = await newDB.from(newTable).select('id');
        console.log(`  📦 Total in new DB: ${allNew ? allNew.length : 0}`);
      } else {
        console.log(`  ⚠️  No data in new database!`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
}

check().catch(console.error);

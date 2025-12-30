require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Old Supabase (image editor database)
const OLD_SUPABASE_URL = 'https://dbcstdktbgqpzrrwfgtb.supabase.co';
const OLD_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY3N0ZGt0YmdxcHpycndmZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEzNzYsImV4cCI6MjA4MDE4NzM3Nn0.oote_j_YMn3ro1mUzE029LNSqqaEOAzNPXGOQ2aADOI';

// New Supabase (main Ignite database)
const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function listOldTables() {
  console.log('🔍 Checking old database structure...\n');

  const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

  // Common table names for image editor
  const possibleTables = [
    // Templates
    'templates', 'tmpls', 'tmpl_types', 'template_categories',
    // Materials
    'materials', 'matrials', 'matrial_types', 'material_categories',
    // Fonts
    'fonts', 'custom_fonts', 'font_families',
    // Projects
    'projects', 'user_projects', 'saved_projects',
    // Assets
    'assets', 'images', 'uploads',
    // Variations
    'variations', 'project_variations',
    // Other
    'stickers', 'elements', 'backgrounds',
  ];

  const existingTables = [];

  for (const table of possibleTables) {
    try {
      const { data, error } = await oldSupabase
        .from(table)
        .select('*')
        .limit(1);

      if (!error) {
        const { count } = await oldSupabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        existingTables.push({ table, count: count || 0 });
        console.log(`✓ Found table: ${table} (${count || 0} records)`);
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }

  if (existingTables.length === 0) {
    console.log('❌ No tables found. Please check the database URL and key.');
    return [];
  }

  console.log(`\n📊 Total tables found: ${existingTables.length}\n`);
  return existingTables;
}

async function migrateTable(oldSupabase, newSupabase, tableName, newTableName = null) {
  const targetTable = newTableName || tableName;

  console.log(`\n📦 Migrating: ${tableName} → ${targetTable}`);

  try {
    // Fetch all data from old database
    const { data: oldData, error: fetchError } = await oldSupabase
      .from(tableName)
      .select('*');

    if (fetchError) {
      console.log(`  ❌ Error fetching data: ${fetchError.message}`);
      return 0;
    }

    if (!oldData || oldData.length === 0) {
      console.log(`  ℹ️  No data to migrate`);
      return 0;
    }

    console.log(`  Found ${oldData.length} records`);

    // Check if target table exists in new database
    const { error: checkError } = await newSupabase
      .from(targetTable)
      .select('id')
      .limit(1);

    if (checkError) {
      console.log(`  ⚠️  Table ${targetTable} doesn't exist in new database`);
      console.log(`  Creating table data as JSON backup...`);

      // Save as JSON file for manual import
      const fs = require('fs');
      const backupPath = `./backups/${tableName}_backup.json`;

      if (!fs.existsSync('./backups')) {
        fs.mkdirSync('./backups');
      }

      fs.writeFileSync(backupPath, JSON.stringify(oldData, null, 2));
      console.log(`  💾 Saved backup to: ${backupPath}`);
      return 0;
    }

    // Insert data in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < oldData.length; i += batchSize) {
      const batch = oldData.slice(i, i + batchSize);

      const { error: insertError } = await newSupabase
        .from(targetTable)
        .upsert(batch, { onConflict: 'id' }); // Use upsert to avoid duplicates

      if (insertError) {
        console.log(`  ⚠️  Error inserting batch: ${insertError.message}`);

        // Try one by one
        for (const record of batch) {
          const { error: singleError } = await newSupabase
            .from(targetTable)
            .upsert([record], { onConflict: 'id' });

          if (!singleError) {
            inserted++;
          }
        }
      } else {
        inserted += batch.length;
      }

      if (i > 0 && i % 500 === 0) {
        console.log(`  ... ${inserted} / ${oldData.length} migrated`);
      }
    }

    console.log(`  ✅ Successfully migrated ${inserted} / ${oldData.length} records`);
    return inserted;

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return 0;
  }
}

async function migrate() {
  console.log('🚀 Image Editor Data Migration\n');
  console.log('Old DB:', OLD_SUPABASE_URL);
  console.log('New DB:', NEW_SUPABASE_URL);
  console.log('─'.repeat(50));

  if (!NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
    console.error('\n❌ Error: New Supabase credentials not found in .env');
    process.exit(1);
  }

  const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
  const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

  // Step 1: List all tables in old database
  const tables = await listOldTables();

  if (tables.length === 0) {
    console.log('\n❌ No tables to migrate. Exiting.');
    return;
  }

  // Step 2: Migrate each table
  let totalMigrated = 0;

  // Map old table names to new editor_ prefixed names
  const tableMapping = {
    'templates': 'editor_templates',
    'materials': 'editor_materials',
    'fonts': 'editor_fonts',
    'projects': 'editor_projects',
    'user_projects': 'editor_projects',
    'saved_projects': 'editor_projects',
    'assets': 'editor_assets',
    'variations': 'editor_variations',
    'project_variations': 'editor_variations',
    'custom_fonts': 'editor_fonts',
    'font_families': 'editor_fonts',
  };

  for (const { table, count } of tables) {
    if (count === 0) continue;

    const newTableName = tableMapping[table] || table;
    const migrated = await migrateTable(oldSupabase, newSupabase, table, newTableName);
    totalMigrated += migrated;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Migration Complete!`);
  console.log(`📊 Total records migrated: ${totalMigrated}`);
  console.log('='.repeat(50));
}

// Run migration
migrate().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});

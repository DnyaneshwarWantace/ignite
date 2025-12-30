require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const OLD_URL = 'https://dbcstdktbgqpzrrwfgtb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY3N0ZGt0YmdxcHpycndmZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTEzNzYsImV4cCI6MjA4MDE4NzM3Nn0.oote_j_YMn3ro1mUzE029LNSqqaEOAzNPXGOQ2aADOI';

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function migrate() {
  console.log('🚀 Migrating with detailed errors\n');

  const oldDB = createClient(OLD_URL, OLD_KEY);
  const newDB = createClient(NEW_URL, NEW_KEY);

  // Test templates first
  console.log('📦 Testing Templates Migration\n');

  const { data: templates, error: fetchError } = await oldDB
    .from('templates')
    .select('*')
    .limit(2);

  if (fetchError) {
    console.log('❌ Fetch error:', fetchError);
    return;
  }

  console.log(`Found ${templates.length} templates to test`);
  console.log('\nFirst template structure:');
  console.log(JSON.stringify(templates[0], null, 2).substring(0, 500) + '...\n');

  // Try inserting one
  console.log('Attempting to insert first template...');
  const { data: inserted, error: insertError } = await newDB
    .from('editor_templates')
    .insert([templates[0]])
    .select();

  if (insertError) {
    console.log('❌ Insert error:', insertError);
    console.log('\nError details:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Successfully inserted!');
    console.log('Inserted data:', inserted);
  }

  // Try fonts
  console.log('\n\n📦 Testing Fonts Migration\n');

  const { data: fonts } = await oldDB.from('fonts').select('*').limit(1);

  if (fonts && fonts.length > 0) {
    console.log('First font structure:');
    console.log(JSON.stringify(fonts[0], null, 2) + '\n');

    console.log('Attempting to insert first font...');
    const { data: insertedFont, error: fontError } = await newDB
      .from('editor_fonts')
      .insert([fonts[0]])
      .select();

    if (fontError) {
      console.log('❌ Insert error:', fontError);
      console.log('\nError details:', JSON.stringify(fontError, null, 2));
    } else {
      console.log('✅ Successfully inserted!');
    }
  }
}

migrate().catch(console.error);

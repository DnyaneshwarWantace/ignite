#!/usr/bin/env node

/**
 * Automated Prisma to Supabase Migration Script
 * This script migrates API route files from Prisma to Supabase
 */

const fs = require('fs');
const path = require('path');

// Files to migrate (paths relative to project root)
const filesToMigrate = [
  'src/app/api/v1/x-ray/brands/[id]/all-ads/route.ts',
  'src/app/api/v1/x-ray/brands/[id]/ads/route.ts',
  'src/app/api/v1/x-ray/saved-ads/route.ts',
  'src/app/api/v1/writer/save-created-ad/route.ts',
  'src/app/api/v1/writer/save-created-ad/[id]/route.ts',
  'src/app/api/v1/writer/generate-hooks/route.ts',
  'src/app/api/v1/writer/build-ad/route.ts',
  'src/app/api/v1/writer/generate-concepts/route.ts',
  'src/app/api/v1/transcript/route.ts',
  'src/app/api/v1/transcript/[adId]/route.ts',
  'src/app/api/v1/transcribe/video/route.ts',
  'src/app/api/v1/ads/[adId]/transcript/route.ts',
  'src/app/api/scene/[id]/route.ts',
  'src/app/api/debug/brands/route.ts',
  'src/app/api/debug/brand/[id]/route.ts',
  'src/app/api/add-fake-data/route.ts',
  'src/app/api/v1/discover/cache-stats/route.ts',
  'src/app/api/debug/clear-db/route.ts',
  'src/app/api/test-db/route.ts',
];

const USER_INTERFACE = `// Type definition for User (matching Supabase schema)
interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}`;

function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipping ${filePath} (file not found)`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if already migrated
  if (content.includes('from "@/lib/supabase"') || !content.includes('@prisma')) {
    console.log(`✅ ${filePath} - Already migrated or no Prisma usage`);
    return false;
  }

  let modified = false;

  // Step 1: Replace imports
  if (content.includes('import { User } from "@prisma/client"')) {
    content = content.replace(
      /import { User } from "@prisma\/client";?/g,
      ''
    );
    modified = true;
  }

  if (content.includes('import prisma from "@prisma/index"')) {
    content = content.replace(
      /import prisma from "@prisma\/index";?/g,
      'import { supabase } from "@/lib/supabase";'
    );
    // Add User interface after imports section
    const importSectionEnd = content.lastIndexOf('import ');
    if (importSectionEnd !== -1) {
      const lineEnd = content.indexOf('\n', importSectionEnd);
      content = content.slice(0, lineEnd + 1) + '\n' + USER_INTERFACE + '\n' + content.slice(lineEnd + 1);
    }
    modified = true;
  }

  // Step 2: Add comment to help manual migration
  if (modified) {
    const dynamicExportIndex = content.indexOf('export const dynamic');
    if (dynamicExportIndex !== -1) {
      const commentToAdd = `
// TODO: MANUAL MIGRATION REQUIRED
// This file has been partially migrated from Prisma to Supabase.
// Please update all Prisma queries manually using these patterns:
//
// prisma.table.findMany() -> supabase.from('table').select('*')
// prisma.table.findUnique({ where: { id } }) -> supabase.from('table').select('*').eq('id', id).single()
// prisma.table.create({ data: {...} }) -> supabase.from('table').insert({...}).select().single()
// prisma.table.update({ where: {id}, data: {...} }) -> supabase.from('table').update({...}).eq('id', id).select().single()
// prisma.table.delete({ where: {id} }) -> supabase.from('table').delete().eq('id', id)
// prisma.table.count() -> supabase.from('table').select('*', { count: 'exact', head: true })
//
// Remember to:
// 1. Convert camelCase field names to snake_case (userId -> user_id, createdAt -> created_at)
// 2. Transform response data back to camelCase for frontend compatibility
// 3. Handle errors: const { data, error } = await supabase...
// 4. Use unique error variable names (fetchError, insertError, etc.)
//
`;
      content = content.slice(0, dynamicExportIndex) + commentToAdd + content.slice(dynamicExportIndex);
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`🔄 ${filePath} - Imports updated, manual migration needed`);
    return true;
  }

  return false;
}

console.log('🚀 Starting Prisma to Supabase migration...\n');

let migratedCount = 0;
let totalFiles = filesToMigrate.length;

filesToMigrate.forEach(filePath => {
  if (migrateFile(filePath)) {
    migratedCount++;
  }
});

console.log(`\n✨ Migration complete!`);
console.log(`📊 Updated ${migratedCount} out of ${totalFiles} files`);
console.log(`\n⚠️  IMPORTANT: These files require manual query migration.`);
console.log(`   Check each file for the TODO comment with migration instructions.`);

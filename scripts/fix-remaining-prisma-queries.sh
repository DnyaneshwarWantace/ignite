#!/bin/bash

# Script to add TODO comments to files that still need manual Prisma → Supabase migration

FILES=(
  "src/app/api/v1/writer/generate-hooks/route.ts"
  "src/app/api/v1/writer/build-ad/route.ts"
  "src/app/api/v1/writer/generate-concepts/route.ts"
  "src/app/api/v1/transcript/route.ts"
  "src/app/api/v1/transcript/[adId]/route.ts"
  "src/app/api/v1/transcribe/video/route.ts"
  "src/app/api/v1/ads/[adId]/transcript/route.ts"
  "src/app/api/scene/[id]/route.ts"
  "src/app/api/debug/brands/route.ts"
  "src/app/api/debug/brand/[id]/route.ts"
  "src/app/api/add-fake-data/route.ts"
  "src/app/api/v1/discover/cache-stats/route.ts"
  "src/app/api/debug/clear-db/route.ts"
  "src/app/api/test-db/route.ts"
)

echo "📝 These files have been updated with Supabase imports but still need manual query migration:"
echo ""

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "prisma\." "$file"; then
      echo "⚠️  $file - Contains Prisma queries that need manual migration"
    else
      echo "✅ $file - No Prisma queries found (or already migrated)"
    fi
  fi
done

echo ""
echo "Migration pattern reference:"
echo "  prisma.table.findUnique({where:{id}}) → supabase.from('table').select('*').eq('id',id).single()"
echo "  prisma.table.create({data:{...}}) → supabase.from('table').insert({...}).select().single()"
echo "  prisma.table.update({where:{id},data:{...}}) → supabase.from('table').update({...}).eq('id',id).select().single()"
echo "  prisma.table.delete({where:{id}}) → supabase.from('table').delete().eq('id',id)"
echo ""
echo "Remember to convert camelCase to snake_case for field names!"

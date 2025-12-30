# Complete Migration from Prisma/PostgreSQL to Supabase

## ✅ What's Been Done

1. **Created complete Supabase schema** (`supabase/migrations/010_main_app_schema.sql`)
   - All Prisma models converted to Supabase tables
   - Includes: Users, Auth, Folders, Brands, Ads, Projects, Scenes, etc.
   - Auto-updating timestamps with triggers
   - All necessary indexes for performance

2. **Already migrated editor data**:
   - ✅ Templates (149 items)
   - ✅ Materials (1000 items)
   - ✅ Fonts (52 items)

## 🚀 Migration Steps

### Step 1: Run the Main Schema Migration

Go to your Supabase Dashboard → SQL Editor and run the migration file:

```bash
# The file is located at:
supabase/migrations/010_main_app_schema.sql
```

**Or** copy and paste the entire SQL content from that file into the Supabase SQL Editor and click "Run".

### Step 2: Verify Tables Were Created

In Supabase Dashboard → Table Editor, you should see:
- `users`
- `accounts`
- `sessions`
- `verification_tokens`
- `folders`
- `saved_ad_folders`
- `brands`
- `brand_folders`
- `ads`
- `saved_ads`
- `created_ads`
- `ad_transcripts`
- `projects`
- `scenes`

Plus the editor tables you already have:
- `editor_templates`
- `editor_materials`
- `editor_fonts`

### Step 3: Update Environment Variables

Remove old PostgreSQL variables and keep only Supabase:

```env
# Remove these:
# DATABASE_URL=
# DIRECT_URL=

# Keep only these:
NEXT_PUBLIC_SUPABASE_URL=https://nrfujyhdlrszkbtsfuac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for admin operations)
```

### Step 4: Update Code to Use Supabase

Create a Supabase client utility:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Replace Prisma queries with Supabase:

**Before (Prisma):**
```typescript
import { prisma } from '@/lib/db'

const users = await prisma.user.findMany()
```

**After (Supabase):**
```typescript
import { supabase } from '@/lib/supabase'

const { data: users } = await supabase
  .from('users')
  .select('*')
```

### Step 5: Update NextAuth Configuration

Update your NextAuth to use Supabase adapter:

```bash
npm install @next-auth/supabase-adapter
```

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { SupabaseAdapter } from "@next-auth/supabase-adapter"

export const authOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  // ... rest of config
}
```

### Step 6: Remove Prisma

```bash
# Remove Prisma dependencies
npm uninstall prisma @prisma/client

# Remove Prisma files
rm -rf prisma/
rm -f prisma/schema.prisma
```

### Step 7: Update package.json Scripts

Remove Prisma scripts:
```json
{
  "scripts": {
    // Remove these:
    // "db:push": "prisma db push",
    // "db:studio": "prisma studio",
    // "db:generate": "prisma generate"
  }
}
```

## 📊 Database Query Conversions

### Find Many
```typescript
// Prisma
await prisma.brand.findMany({ where: { userId: 'x' }})

// Supabase
await supabase.from('brands').select('*').eq('user_id', 'x')
```

### Find Unique
```typescript
// Prisma
await prisma.user.findUnique({ where: { id: 'x' }})

// Supabase
await supabase.from('users').select('*').eq('id', 'x').single()
```

### Create
```typescript
// Prisma
await prisma.ad.create({ data: { ... }})

// Supabase
await supabase.from('ads').insert({ ... }).select()
```

### Update
```typescript
// Prisma
await prisma.ad.update({ where: { id: 'x' }, data: { ... }})

// Supabase
await supabase.from('ads').update({ ... }).eq('id', 'x')
```

### Delete
```typescript
// Prisma
await prisma.ad.delete({ where: { id: 'x' }})

// Supabase
await supabase.from('ads').delete().eq('id', 'x')
```

### Relations
```typescript
// Prisma
await prisma.brand.findMany({ include: { ads: true }})

// Supabase
await supabase.from('brands').select('*, ads(*)')
```

## 🎯 Benefits

✅ **No separate PostgreSQL database needed**
✅ **Built-in auth, storage, and real-time**
✅ **Automatic REST API**
✅ **Better scalability**
✅ **Free tier is generous**
✅ **Single source of truth**

## ⚠️ Important Notes

1. **Column naming**: Supabase uses `snake_case` (e.g., `user_id`) while Prisma used `camelCase` (e.g., `userId`)
2. **IDs**: The migration uses TEXT IDs with prefixes (e.g., `user_abc123`, `brand_xyz789`)
3. **Timestamps**: All tables have `created_at` and `updated_at` with automatic updates
4. **Relations**: Many-to-many relationships use join tables (e.g., `brand_folders`)

## 🧪 Testing Checklist

After migration, test:
- [ ] User authentication works
- [ ] Creating/reading brands and folders
- [ ] Saving and retrieving ads
- [ ] Creating ads
- [ ] Projects and scenes (video editor)
- [ ] Image editor templates/materials/fonts (already working)

## 🆘 Rollback Plan

If something goes wrong, you can:
1. Keep the Prisma database running temporarily
2. Point DATABASE_URL back to PostgreSQL
3. Gradually migrate data
4. Only remove Prisma once everything works

Your old Prisma schema is still in `prisma/schema.prisma` if you need to reference it.

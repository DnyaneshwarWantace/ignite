# 🗄️ Supabase Setup Guide

## Overview

GhostwriterOS uses **Supabase** as the database to store:
- Campaign DNA (11 sections)
- DNA Sections content
- Generation History

**Fallback:** If Supabase is not configured, the system falls back to **localStorage**.

---

## 📋 Setup Steps

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name:** `ghostwriter-os` (or your choice)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your users
5. Click "Create Project" (takes 1-2 minutes)

### 2. Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - click "Reveal" to see it)

### 3. Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and add your credentials:
   ```env
   # AI API Keys
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Important:** Never commit `.env.local` to git!

### 4. Run the Database Schema

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql` from the root directory
5. Paste it into the query editor
6. Click **Run** (or press Ctrl/Cmd + Enter)

You should see: `Success. No rows returned`

### 5. Verify Tables Were Created

1. Click **Table Editor** in the left sidebar
2. You should see 3 new tables:
   - **campaigns** - Stores user campaigns
   - **dna_content** - Stores all 11 DNA sections
   - **generation_history** - Stores AI generation results

### 6. Restart Your Development Server

```bash
npm run dev
```

The app will now use Supabase for storage!

---

## 🔄 How It Works

### Database Schema

#### `campaigns` Table
Stores each user's campaigns (DNA profiles).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| user_id | TEXT | User identifier (default: "default-user") |
| name | TEXT | Campaign name |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### `dna_content` Table
Stores content for all 11 DNA sections.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| campaign_id | UUID | References campaigns.id |
| section_id | TEXT | DNA section identifier (e.g., "authorBiography") |
| content | TEXT | Section content |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Unique Constraint:** (campaign_id, section_id) - Each campaign can only have ONE entry per section.

#### `generation_history` Table
Stores all AI-generated content.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| campaign_id | UUID | References campaigns.id |
| agent_id | TEXT | Agent identifier (e.g., "high-value-client-compass") |
| agent_name | TEXT | Agent display name |
| input_data | JSONB | Input parameters used |
| generated_content | TEXT | AI-generated content |
| created_at | TIMESTAMP | Creation timestamp |

### Auto-Save Behavior

**DNA Sections:**
- Auto-saves **500ms** after user stops typing
- Upserts (updates existing or inserts new)
- Falls back to localStorage if Supabase fails

**Generation History:**
- Saves immediately after generation completes
- Never blocks generation if save fails

### Fallback to localStorage

If Supabase is **not configured** or **fails**, the system automatically falls back to localStorage:
- ✅ App still works
- ✅ Data persists in browser
- ❌ Data is not shared across devices
- ❌ Data cleared if browser cache is cleared

---

## 🧪 Testing the Integration

### 1. Test Campaign Creation

1. Go to `/dnas`
2. Click "New DNA"
3. Enter a campaign name
4. Check Supabase Table Editor → `campaigns` table
5. You should see your new campaign

### 2. Test DNA Content Saving

1. Open a campaign
2. Fill in Section 1 (Author Biography)
3. Wait 500ms (auto-save)
4. Check Supabase Table Editor → `dna_content` table
5. You should see the content saved

### 3. Test AI Generation

1. Fill some DNA sections
2. Go to an agent page (e.g., High-Value Client Compass)
3. Select your DNA
4. Click "Generate"
5. Check Supabase Table Editor → `generation_history` table
6. You should see the generated content

### 4. Test Cross-Device Sync

1. Open your app on Device A
2. Create a campaign and add content
3. Open your app on Device B
4. You should see the same campaigns and content (synced via Supabase)

---

## 🔐 Security Notes

### Row Level Security (RLS)

The schema includes RLS policies that currently **allow all operations**:
```sql
CREATE POLICY "Allow all for campaigns" ON campaigns FOR ALL USING (true);
```

**For production, you should:**
1. Enable Supabase Auth
2. Update RLS policies to:
   ```sql
   -- Only allow users to see their own campaigns
   CREATE POLICY "Users can view own campaigns" ON campaigns
     FOR SELECT USING (auth.uid() = user_id);

   -- Only allow users to create their own campaigns
   CREATE POLICY "Users can create own campaigns" ON campaigns
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

### API Keys

- **anon key:** Safe to expose in client-side code (respects RLS)
- **service_role key:** ⚠️ **NEVER** expose in client-side code! Only use in API routes

---

## 📊 Monitoring & Maintenance

### View Database Activity

1. Go to Supabase Dashboard
2. Click **Database** → **Tables**
3. Browse your data

### Run Queries

1. Go to **SQL Editor**
2. Write queries:
   ```sql
   -- Get all campaigns
   SELECT * FROM campaigns ORDER BY updated_at DESC;

   -- Get DNA content for a specific campaign
   SELECT * FROM dna_content WHERE campaign_id = 'your-campaign-id';

   -- Get recent generations
   SELECT * FROM generation_history
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### Backup Data

Supabase automatically backs up your data. To export:
1. Go to **Database** → **Backups**
2. Click **Download**

---

## 🐛 Troubleshooting

### "Failed to save DNA content"

**Check:**
1. `.env.local` has correct Supabase credentials
2. Environment variables are loaded (restart dev server)
3. Supabase project is not paused (free tier auto-pauses after 7 days of inactivity)
4. Table schema is created correctly

**Solution:**
```bash
# Restart dev server
npm run dev
```

### "No campaigns showing up"

**Check:**
1. Supabase Table Editor → `campaigns` table
2. Data exists in database
3. `user_id` matches (default: "default-user")

**Solution:**
```sql
-- Check if data exists
SELECT * FROM campaigns;

-- If data exists but not showing, check user_id
SELECT * FROM campaigns WHERE user_id = 'default-user';
```

### "Supabase connection failed"

**Check:**
1. Internet connection
2. Supabase project is active (not paused)
3. API keys are correct

**Solution:**
- App will automatically fall back to localStorage
- Fix credentials and restart

### Tables not created

**Solution:**
1. Go to Supabase **SQL Editor**
2. Run this query to check if tables exist:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
3. If tables missing, run `supabase-schema.sql` again

---

## 🚀 Advanced Features

### Add User Authentication

1. Enable Supabase Auth:
   ```bash
   npm install @supabase/auth-ui-react @supabase/auth-ui-shared
   ```

2. Update RLS policies (see Security Notes above)

3. Add auth to your app:
   ```typescript
   import { Auth } from '@supabase/auth-ui-react';
   import { ThemeSupa } from '@supabase/auth-ui-shared';
   import { createClient } from '@/lib/supabase/client';

   const supabase = createClient();

   <Auth
     supabaseClient={supabase}
     appearance={{ theme: ThemeSupa }}
     providers={['google', 'github']}
   />
   ```

### Real-Time Sync

Enable real-time updates when DNA changes:
```typescript
const supabase = createClient();

supabase
  .channel('dna_changes')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'dna_content',
      filter: `campaign_id=eq.${campaignId}`
    },
    (payload) => {
      console.log('DNA updated:', payload);
      // Refresh UI
    }
  )
  .subscribe();
```

### Database Migrations

If you update the schema:
1. Export current schema:
   ```bash
   supabase db pull
   ```

2. Create migration:
   ```bash
   supabase migration new add_new_column
   ```

3. Write SQL in migration file

4. Apply migration:
   ```bash
   supabase db push
   ```

---

## 💡 Tips

1. **Free Tier Limits:**
   - 500MB database
   - 2GB file storage
   - 50,000 monthly active users
   - Pause after 7 days inactivity

2. **Keep Project Active:**
   - Visit dashboard weekly (or)
   - Run a cron job to query database

3. **Monitor Usage:**
   - Go to **Settings** → **Billing**
   - Check storage and bandwidth

4. **Optimize Queries:**
   - Use indexes for frequently queried columns
   - Limit result sets with `.limit()`

---

## ✅ Summary

Your GhostwriterOS now has:
- ✅ Persistent database storage (Supabase)
- ✅ Automatic fallback (localStorage)
- ✅ Auto-save for DNA content
- ✅ Generation history tracking
- ✅ Cross-device sync
- ✅ Scalable infrastructure

**Next Steps:**
1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Run database schema
4. ✅ Test the integration
5. 🔜 Add user authentication (optional)
6. 🔜 Enable real-time sync (optional)

---

*For more help, see:*
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

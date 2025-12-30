-- Main Application Schema - Migrating from Prisma to Supabase
-- This replaces the PostgreSQL/Prisma database completely

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for NextAuth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('user_' || replace(uuid_generate_v4()::text, '-', '')),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMP WITH TIME ZONE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (for NextAuth)
CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (provider, provider_account_id)
);

-- Sessions table (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  session_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification tokens table (for NextAuth)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY DEFAULT ('folder_' || replace(uuid_generate_v4()::text, '-', '')),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Ad Folders table
CREATE TABLE IF NOT EXISTS saved_ad_folders (
  id TEXT PRIMARY KEY DEFAULT ('sadfolder_' || replace(uuid_generate_v4()::text, '-', '')),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY DEFAULT ('brand_' || replace(uuid_generate_v4()::text, '-', '')),
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  total_ads INTEGER DEFAULT 0,
  page_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand-Folder relationship (many-to-many)
CREATE TABLE IF NOT EXISTS brand_folders (
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  PRIMARY KEY (brand_id, folder_id)
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY DEFAULT ('ad_' || replace(uuid_generate_v4()::text, '-', '')),
  library_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  text TEXT,
  headline TEXT,
  description TEXT,
  local_image_url TEXT,
  local_video_url TEXT,
  media_status TEXT DEFAULT 'pending',
  media_downloaded_at TIMESTAMP WITH TIME ZONE,
  media_error TEXT,
  media_retry_count INTEGER DEFAULT 0,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ads table
CREATE INDEX IF NOT EXISTS idx_ads_type ON ads(type);
CREATE INDEX IF NOT EXISTS idx_ads_brand_id ON ads(brand_id);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);
CREATE INDEX IF NOT EXISTS idx_ads_media_status ON ads(media_status);
CREATE INDEX IF NOT EXISTS idx_ads_text ON ads(text);
CREATE INDEX IF NOT EXISTS idx_ads_headline ON ads(headline);
CREATE INDEX IF NOT EXISTS idx_ads_description ON ads(description);
CREATE INDEX IF NOT EXISTS idx_ads_library_id ON ads(library_id);

-- Saved Ads table
CREATE TABLE IF NOT EXISTS saved_ads (
  id TEXT PRIMARY KEY DEFAULT ('savedad_' || replace(uuid_generate_v4()::text, '-', '')),
  ad_id TEXT NOT NULL,
  ad_data TEXT NOT NULL,
  folder_id TEXT REFERENCES saved_ad_folders(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Created Ads table
CREATE TABLE IF NOT EXISTS created_ads (
  id TEXT PRIMARY KEY DEFAULT ('createdad_' || replace(uuid_generate_v4()::text, '-', '')),
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'image',
  brand_name TEXT NOT NULL,
  image_url TEXT,
  is_generated BOOLEAN DEFAULT FALSE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for created_ads table
CREATE INDEX IF NOT EXISTS idx_created_ads_user_id ON created_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_created_ads_created_at ON created_ads(created_at);
CREATE INDEX IF NOT EXISTS idx_created_ads_type ON created_ads(type);
CREATE INDEX IF NOT EXISTS idx_created_ads_brand_name ON created_ads(brand_name);

-- Ad Transcripts table
CREATE TABLE IF NOT EXISTS ad_transcripts (
  id TEXT PRIMARY KEY DEFAULT ('transcript_' || replace(uuid_generate_v4()::text, '-', '')),
  ad_id TEXT UNIQUE NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'en-us',
  confidence NUMERIC DEFAULT 0.0,
  word_count INTEGER DEFAULT 0,
  duration NUMERIC DEFAULT 0.0,
  service TEXT DEFAULT 'Vosk',
  metadata TEXT DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (for video editor)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT ('project_' || replace(uuid_generate_v4()::text, '-', '')),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenes table (for video editor)
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY DEFAULT ('scene_' || replace(uuid_generate_v4()::text, '-', '')),
  name TEXT NOT NULL,
  content JSONB,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_ad_folders_updated_at BEFORE UPDATE ON saved_ad_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_ads_updated_at BEFORE UPDATE ON saved_ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_created_ads_updated_at BEFORE UPDATE ON created_ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ad_transcripts_updated_at BEFORE UPDATE ON ad_transcripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

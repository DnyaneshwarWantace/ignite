-- Add missing columns to existing tables

-- Add columns to editor_templates
ALTER TABLE editor_templates
ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 1080,
ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 1080;

-- Add columns to editor_fonts
ALTER TABLE editor_fonts
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS type TEXT;

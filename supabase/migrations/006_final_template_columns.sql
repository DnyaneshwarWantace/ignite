-- Add ALL missing columns for templates

ALTER TABLE editor_templates
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pro_info TEXT,
ADD COLUMN IF NOT EXISTS pro_images JSONB;

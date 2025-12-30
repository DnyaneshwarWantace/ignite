-- Templates and Materials Schema for Image Editor
-- Run this SQL in Supabase SQL Editor

-- Create templates table
CREATE TABLE IF NOT EXISTS editor_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  json JSONB NOT NULL,
  template_type_id TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  user_id TEXT,
  sort INTEGER DEFAULT 10000,
  thumbnail_url TEXT,
  width INTEGER DEFAULT 1080,
  height INTEGER DEFAULT 1080,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS editor_materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  small_url TEXT,
  thumbnail_url TEXT,
  material_type_id TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  user_id TEXT,
  sort INTEGER DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template types table
CREATE TABLE IF NOT EXISTS editor_template_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort INTEGER DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create material types table
CREATE TABLE IF NOT EXISTS editor_material_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort INTEGER DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fonts table (merged with editor_custom_fonts structure)
CREATE TABLE IF NOT EXISTS editor_fonts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  font_family TEXT NOT NULL,
  font_url TEXT,
  url TEXT,
  preview_url TEXT,
  image_url TEXT,
  type TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  user_id TEXT,
  sort INTEGER DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_editor_templates_type ON editor_templates(template_type_id);
CREATE INDEX IF NOT EXISTS idx_editor_templates_public ON editor_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_editor_templates_user ON editor_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_editor_materials_type ON editor_materials(material_type_id);
CREATE INDEX IF NOT EXISTS idx_editor_materials_public ON editor_materials(is_public);
CREATE INDEX IF NOT EXISTS idx_editor_materials_user ON editor_materials(user_id);

CREATE INDEX IF NOT EXISTS idx_editor_fonts_family ON editor_fonts(font_family);
CREATE INDEX IF NOT EXISTS idx_editor_fonts_public ON editor_fonts(is_public);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_editor_templates_updated_at BEFORE UPDATE ON editor_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editor_materials_updated_at BEFORE UPDATE ON editor_materials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editor_fonts_updated_at BEFORE UPDATE ON editor_fonts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

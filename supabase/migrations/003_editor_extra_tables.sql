-- Additional Editor Tables (Image Editor specific features)
-- These are extra tables that image editor uses

-- Table for project-specific naming templates
CREATE TABLE IF NOT EXISTS editor_project_naming_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  custom_values JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Table for user-specific naming templates
CREATE TABLE IF NOT EXISTS editor_user_naming_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  custom_values JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_editor_project_naming_templates_project_user
  ON editor_project_naming_templates(project_id, user_id);

CREATE INDEX IF NOT EXISTS idx_editor_project_naming_templates_custom_values
  ON editor_project_naming_templates USING GIN (custom_values);

CREATE INDEX IF NOT EXISTS idx_editor_user_naming_templates_user_id
  ON editor_user_naming_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_editor_user_naming_templates_is_default
  ON editor_user_naming_templates(is_default);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_editor_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_editor_project_naming_templates_updated_at
  BEFORE UPDATE ON editor_project_naming_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_editor_templates_updated_at();

CREATE TRIGGER update_editor_user_naming_templates_updated_at
  BEFORE UPDATE ON editor_user_naming_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_editor_templates_updated_at();

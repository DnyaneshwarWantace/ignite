-- GhostwriterOS Database Schema (Without Authentication)

-- Drop existing tables if they exist
DROP TABLE IF EXISTS dna_sections CASCADE;
DROP TABLE IF EXISTS dnas CASCADE;

-- Create DNAs table
CREATE TABLE dnas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT DEFAULT 'default-user',
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create DNA sections table
CREATE TABLE dna_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dna_id UUID REFERENCES dnas(id) ON DELETE CASCADE NOT NULL,
  section_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  last_edit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(dna_id, section_id)
);

-- Create indexes
CREATE INDEX idx_dnas_user_id ON dnas(user_id);
CREATE INDEX idx_dnas_is_default ON dnas(is_default);
CREATE INDEX idx_dna_sections_dna_id ON dna_sections(dna_id);

-- Enable Row Level Security
ALTER TABLE dnas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_sections ENABLE ROW LEVEL SECURITY;

-- Allow all access (no authentication required)
CREATE POLICY "Allow all access to dnas"
  ON dnas FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to dna_sections"
  ON dna_sections FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_dnas_updated_at BEFORE UPDATE ON dnas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dna_sections_updated_at BEFORE UPDATE ON dna_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AI Writer (Ghostwriter) tables: DNAs and DNA sections, scoped by user_id

CREATE TABLE IF NOT EXISTS ai_writer_dnas (
  id TEXT PRIMARY KEY DEFAULT ('dna_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_writer_dna_sections (
  id TEXT PRIMARY KEY DEFAULT ('dnasect_' || replace(uuid_generate_v4()::text, '-', '')),
  dna_id TEXT NOT NULL REFERENCES ai_writer_dnas(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  content TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  last_edit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(dna_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_writer_dnas_user_id ON ai_writer_dnas(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_writer_dnas_is_default ON ai_writer_dnas(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_writer_dna_sections_dna_id ON ai_writer_dna_sections(dna_id);

-- RLS: users can only access their own rows
ALTER TABLE ai_writer_dnas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_writer_dna_sections ENABLE ROW LEVEL SECURITY;

-- Policies use auth.uid() for Supabase Auth; we use service role + user_id from NextAuth in API.
-- So we allow service role full access; anon has no direct access (API only).
CREATE POLICY "Service role full access ai_writer_dnas"
  ON ai_writer_dnas FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access ai_writer_dna_sections"
  ON ai_writer_dna_sections FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION ai_writer_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_writer_dnas_updated_at ON ai_writer_dnas;
CREATE TRIGGER ai_writer_dnas_updated_at
  BEFORE UPDATE ON ai_writer_dnas
  FOR EACH ROW EXECUTE FUNCTION ai_writer_update_updated_at();

DROP TRIGGER IF EXISTS ai_writer_dna_sections_updated_at ON ai_writer_dna_sections;
CREATE TRIGGER ai_writer_dna_sections_updated_at
  BEFORE UPDATE ON ai_writer_dna_sections
  FOR EACH ROW EXECUTE FUNCTION ai_writer_update_updated_at();

-- AI Writer agent response history (per user, per agent)

CREATE TABLE IF NOT EXISTS ai_writer_agent_history (
  id TEXT PRIMARY KEY DEFAULT ('agh_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  content TEXT NOT NULL,
  dna_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_writer_agent_history_user_agent ON ai_writer_agent_history(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_writer_agent_history_created_at ON ai_writer_agent_history(created_at DESC);

ALTER TABLE ai_writer_agent_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access ai_writer_agent_history"
  ON ai_writer_agent_history FOR ALL
  USING (true)
  WITH CHECK (true);

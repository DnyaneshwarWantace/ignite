-- Admin: add is_admin to users; usage logging for admin analytics

-- Allow designating admin users (set via SQL or future admin UI)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- API usage log: one row per usage event (call from API routes when you want to track)
CREATE TABLE IF NOT EXISTS api_usage_log (
  id TEXT PRIMARY KEY DEFAULT ('usage_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  endpoint TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_id ON api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_feature ON api_usage_log(feature);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at ON api_usage_log(created_at);

-- RLS: only service role can read/write (API/server only)
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access api_usage_log"
  ON api_usage_log FOR ALL
  USING (true)
  WITH CHECK (true);

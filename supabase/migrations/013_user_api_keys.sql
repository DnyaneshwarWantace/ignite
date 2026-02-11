-- User API Keys table for per-user encrypted key storage (BYOK)

CREATE TABLE IF NOT EXISTS user_api_keys (
  id TEXT PRIMARY KEY DEFAULT ('key_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  key_hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider ON user_api_keys(user_id, provider);

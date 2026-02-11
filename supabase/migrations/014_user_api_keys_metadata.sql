-- Add metadata JSONB to user_api_keys for LLM config (base_url, model)
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Allow credential-based login: store bcrypt hash for users who sign in with email/password (e.g. admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

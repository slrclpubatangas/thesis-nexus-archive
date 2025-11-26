-- Fix foreign key to reference system_users instead of auth.users

-- Drop the existing table (this will cascade delete any existing tokens)
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

-- Recreate with correct foreign key
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create password reset tokens
CREATE POLICY "Allow anyone to create password reset tokens" 
  ON password_reset_tokens 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read password reset tokens (for validation)
CREATE POLICY "Allow anyone to read password reset tokens" 
  ON password_reset_tokens 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Allow anyone to update password reset tokens (to mark as used)
CREATE POLICY "Allow anyone to update password reset tokens" 
  ON password_reset_tokens 
  FOR UPDATE 
  TO anon, authenticated
  USING (true);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

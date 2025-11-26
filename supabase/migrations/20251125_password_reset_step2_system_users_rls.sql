-- Add RLS policy to allow password reset to query users by email
-- This allows anyone to check if an email exists (for password reset)

-- Enable RLS on system_users if not already enabled
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading user id by email for password reset
CREATE POLICY "Allow read user id by email for password reset" 
  ON system_users 
  FOR SELECT 
  USING (true);

-- Note: This allows reading all user records. If you want more security,
-- you can limit it to only allow reading specific columns:
-- CREATE POLICY "Allow read user id by email for password reset" 
--   ON system_users 
--   FOR SELECT 
--   TO authenticated, anon
--   USING (true);

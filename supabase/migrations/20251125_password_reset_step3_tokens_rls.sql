-- Add RLS policy to allow inserting password reset tokens
-- This allows anyone (anon users) to create password reset tokens

-- The table already has RLS enabled from the first migration
-- Now add INSERT policy for anonymous users requesting password reset

CREATE POLICY "Allow anyone to create password reset tokens" 
  ON password_reset_tokens 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Also add policy to allow reading own tokens (for validation)
CREATE POLICY "Allow anyone to read password reset tokens" 
  ON password_reset_tokens 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Allow updating tokens (to mark as used)
CREATE POLICY "Allow anyone to update password reset tokens" 
  ON password_reset_tokens 
  FOR UPDATE 
  TO anon, authenticated
  USING (true);

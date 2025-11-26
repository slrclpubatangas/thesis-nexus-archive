-- Complete fix for email_verifications RLS
-- Drop ALL existing policies and create simple permissive ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage own verification codes" ON public.email_verifications;
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can view own verification codes" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can update own verification codes" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can delete own verification codes" ON public.email_verifications;

-- Temporarily disable RLS to clear everything
ALTER TABLE public.email_verifications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies

-- Allow ANYONE (anon or authenticated) to insert
CREATE POLICY "allow_all_insert_verification"
ON public.email_verifications
FOR INSERT
WITH CHECK (true);

-- Allow ANYONE (anon or authenticated) to select (for code validation)
CREATE POLICY "allow_all_select_verification"
ON public.email_verifications
FOR SELECT
USING (true);

-- Allow ANYONE to update (mark as used)
CREATE POLICY "allow_all_update_verification"
ON public.email_verifications
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow ANYONE to delete
CREATE POLICY "allow_all_delete_verification"
ON public.email_verifications
FOR DELETE
USING (true);

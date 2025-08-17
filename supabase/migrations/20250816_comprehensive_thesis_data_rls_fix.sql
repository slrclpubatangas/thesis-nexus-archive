-- First, let's check what policies currently exist
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'thesis_data';

-- Drop ALL existing policies on thesis_data
DROP POLICY IF EXISTS "View thesis records" ON thesis_data;
DROP POLICY IF EXISTS "Insert thesis records" ON thesis_data;
DROP POLICY IF EXISTS "Update thesis records" ON thesis_data;
DROP POLICY IF EXISTS "Soft delete thesis records" ON thesis_data;
DROP POLICY IF EXISTS "Authenticated users can update thesis records" ON thesis_data;
DROP POLICY IF EXISTS "Authenticated users can delete thesis records" ON thesis_data;

-- Disable RLS temporarily to ensure clean slate
ALTER TABLE thesis_data DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE thesis_data ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for authenticated users (admins)

-- 1. Allow authenticated users to view all records (including deleted ones if needed)
CREATE POLICY "auth_select_thesis" ON thesis_data
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Allow authenticated users to insert new records
CREATE POLICY "auth_insert_thesis" ON thesis_data
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Allow authenticated users to update ANY record with ANY changes
CREATE POLICY "auth_update_thesis" ON thesis_data
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Allow authenticated users to delete records (hard delete)
CREATE POLICY "auth_delete_thesis" ON thesis_data
    FOR DELETE
    TO authenticated
    USING (true);

-- Also create public read policy for non-deleted records
CREATE POLICY "public_view_active_thesis" ON thesis_data
    FOR SELECT
    TO anon
    USING (is_deleted = false);

-- Verify the policies were created
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'thesis_data'
ORDER BY policyname;

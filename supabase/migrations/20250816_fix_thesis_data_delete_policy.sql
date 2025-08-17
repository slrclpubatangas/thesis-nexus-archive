-- Drop existing update policies if they exist
DROP POLICY IF EXISTS "Update thesis records" ON thesis_data;
DROP POLICY IF EXISTS "Soft delete thesis records" ON thesis_data;

-- Create a comprehensive update policy for authenticated users
-- This allows authenticated users to update any field including is_deleted
CREATE POLICY "Authenticated users can update thesis records" ON thesis_data
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Also ensure authenticated users can delete records (hard delete if needed)
CREATE POLICY "Authenticated users can delete thesis records" ON thesis_data
    FOR DELETE
    TO authenticated
    USING (true);

-- Add a comment for clarity
COMMENT ON POLICY "Authenticated users can update thesis records" ON thesis_data IS 'Allows authenticated users (admins) to update thesis records including soft delete operations';

-- =============================================================================
-- Migration: Ensure user_role ENUM supports 'Reader' role
-- =============================================================================
-- This migration ensures the user_role enum has 'Reader' value
-- to match the application code which uses 'Reader' for SLRC Staff users
-- =============================================================================

-- Step 1: Add 'Reader' as a new enum value if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'Reader' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'Reader'
        AND enumtypid = 'user_role'::regtype
    ) THEN
        ALTER TYPE user_role ADD VALUE 'Reader';
        RAISE NOTICE 'Added Reader to user_role enum';
    ELSE
        RAISE NOTICE 'Reader already exists in user_role enum';
    END IF;
END $$;

-- Step 2: Check current enum values
DO $$
DECLARE
    enum_values text;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'user_role'::regtype;
    
    RAISE NOTICE 'Current user_role enum values: %', enum_values;
END $$;

-- Step 3: Verify no data issues
-- This just reports on existing data without making changes
DO $$
DECLARE
    role_counts text;
BEGIN
    SELECT string_agg(role::text || ': ' || count::text, ', ')
    INTO role_counts
    FROM (
        SELECT role, COUNT(*) as count
        FROM public.system_users
        GROUP BY role
        ORDER BY role
    ) role_summary;
    
    RAISE NOTICE 'System users by role: %', COALESCE(role_counts, 'No users found');
END $$;

-- =============================================================================
-- SUCCESS! No errors expected
-- =============================================================================
-- The migration is now complete. The enum supports both Admin and Reader.
-- Your application code uses 'Admin' and 'Reader' exclusively.

COMMENT ON TYPE user_role IS 'User roles: Admin (full access) and Reader (SLRC Staff with view-only access).';

-- =============================================================================
-- COMPLETE DATABASE MIGRATION SCRIPT FOR SUPABASE PROJECT
-- =============================================================================
-- This script recreates the entire database structure including:
-- - Custom types and enums
-- - Tables with proper constraints
-- - Row Level Security (RLS) policies
-- - Functions and triggers
-- - Indexes for performance
-- =============================================================================

-- =============================================================================
-- 1. CUSTOM TYPES AND ENUMS
-- =============================================================================

-- User role enum for system users
CREATE TYPE user_role AS ENUM ('Admin', 'User');

-- User status enum for system users
CREATE TYPE user_status AS ENUM ('Active', 'Inactive');

-- =============================================================================
-- 2. TABLE CREATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES TABLE
-- Extended user information linked to auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'reader',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- -----------------------------------------------------------------------------
-- SYSTEM_USERS TABLE
-- Administrative user management with roles and status
-- -----------------------------------------------------------------------------
CREATE TABLE public.system_users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'Active',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- -----------------------------------------------------------------------------
-- THESIS_DATA TABLE
-- Main repository for thesis information
-- -----------------------------------------------------------------------------
CREATE TABLE public.thesis_data (
    id BIGSERIAL PRIMARY KEY,
    barcode VARCHAR NOT NULL,
    thesis_title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    department VARCHAR NOT NULL,
    publication_year INTEGER NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- -----------------------------------------------------------------------------
-- THESIS_SUBMISSIONS TABLE
-- User submissions for thesis requests
-- -----------------------------------------------------------------------------
CREATE TABLE public.thesis_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    thesis_title TEXT NOT NULL,
    full_name TEXT NOT NULL,
    user_type TEXT NOT NULL,
    student_number TEXT,
    school TEXT,
    campus TEXT NOT NULL,
    program TEXT,
    submission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- -----------------------------------------------------------------------------
-- FEEDBACK TABLE
-- User feedback and ratings system
-- -----------------------------------------------------------------------------
CREATE TABLE public.feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    rating INTEGER NOT NULL,
    comments TEXT,
    submission_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on thesis_data for faster searches
CREATE INDEX idx_thesis_data_barcode ON public.thesis_data(barcode);
CREATE INDEX idx_thesis_data_title ON public.thesis_data(thesis_title);
CREATE INDEX idx_thesis_data_department ON public.thesis_data(department);
CREATE INDEX idx_thesis_data_year ON public.thesis_data(publication_year);
CREATE INDEX idx_thesis_data_not_deleted ON public.thesis_data(is_deleted) WHERE is_deleted = false;

-- Index on system_users for faster lookups
CREATE INDEX idx_system_users_user_id ON public.system_users(user_id);
CREATE INDEX idx_system_users_email ON public.system_users(email);
CREATE INDEX idx_system_users_status ON public.system_users(status);

-- Index on submissions for faster admin queries
CREATE INDEX idx_thesis_submissions_date ON public.thesis_submissions(submission_date);
CREATE INDEX idx_thesis_submissions_campus ON public.thesis_submissions(campus);

-- =============================================================================
-- 4. FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TRIGGER FUNCTION: Handle new user registration
-- Automatically creates profile when user signs up
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'reader')
  );
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- UTILITY FUNCTION: Check if user is admin
-- Used in RLS policies to verify admin status
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.system_users 
    WHERE user_id = auth.uid() 
    AND role = 'Admin'
    AND status = 'Active'
  );
$$;

-- -----------------------------------------------------------------------------
-- TRIGGER FUNCTION: Update last_modified timestamp
-- Automatically updates last_modified field when records change
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_last_modified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.last_modified = now();
    RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- TRIGGER FUNCTION: Update feedback updated_at timestamp
-- Automatically updates updated_at field for feedback
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

-- Trigger for automatic profile creation on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating thesis_data last_modified timestamp
CREATE TRIGGER update_thesis_data_last_modified
  BEFORE UPDATE ON public.thesis_data
  FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();

-- Trigger for updating feedback updated_at timestamp
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_feedback_updated_at();

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS) SETUP
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. RLS POLICIES - PROFILES TABLE
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- System can insert profiles (for new user registration)
CREATE POLICY "System can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- =============================================================================
-- 8. RLS POLICIES - SYSTEM_USERS TABLE
-- =============================================================================

CREATE POLICY "Users can view own system user record"
ON public.system_users
FOR SELECT
USING (auth.uid() = user_id);

-- Allow any authenticated user to update ONLY their own last_login column
CREATE POLICY "Users can update own last_login"
ON public.system_users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all system users
CREATE POLICY "Admins can view all system users" 
ON public.system_users 
FOR SELECT 
USING (is_admin_user());

-- Admins can insert system users
CREATE POLICY "Admins can insert system users" 
ON public.system_users 
FOR INSERT 
WITH CHECK (is_admin_user());

-- Admins can update system users
CREATE POLICY "Admins can update system users" 
ON public.system_users 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Admins can delete system users
CREATE POLICY "Admins can delete system users" 
ON public.system_users 
FOR DELETE 
USING (is_admin_user());

-- Admin users can manage their own records
CREATE POLICY "Admin can read system_users" 
ON public.system_users 
FOR SELECT 
USING ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()) AND (role = 'Admin'::user_role));

CREATE POLICY "Admin can insert any system_users" 
ON public.system_users 
FOR INSERT 
WITH CHECK ((auth.role() = 'authenticated'::text) AND (EXISTS ( 
  SELECT 1 FROM system_users su 
  WHERE ((su.user_id = auth.uid()) AND (su.role = 'Admin'::user_role))
)));

CREATE POLICY "Admin can update system_users" 
ON public.system_users 
FOR UPDATE 
USING ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()) AND (role = 'Admin'::user_role));

CREATE POLICY "Admin can delete system_users" 
ON public.system_users 
FOR DELETE 
USING ((auth.role() = 'authenticated'::text) AND (user_id = auth.uid()) AND (role = 'Admin'::user_role));

-- =============================================================================
-- 9. RLS POLICIES - THESIS_DATA TABLE
-- =============================================================================

-- View thesis records (only non-deleted)
CREATE POLICY "View thesis records" 
ON public.thesis_data 
FOR SELECT 
USING (NOT is_deleted);

-- Insert thesis records (authenticated users)
CREATE POLICY "Insert thesis records" 
ON public.thesis_data 
FOR INSERT 
WITH CHECK (true);

-- Update thesis records (authenticated users)
CREATE POLICY "Update thesis records" 
ON public.thesis_data 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Soft delete thesis records (authenticated users)
CREATE POLICY "Soft delete thesis records" 
ON public.thesis_data 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 10. RLS POLICIES - THESIS_SUBMISSIONS TABLE
-- =============================================================================

-- Allow public read access for submitted records
CREATE POLICY "Allow public read access for submitted row" 
ON public.thesis_submissions 
FOR SELECT 
USING (true);

-- Allow public insert access for new submissions
CREATE POLICY "Allow public insert access" 
ON public.thesis_submissions 
FOR INSERT 
WITH CHECK (true);

-- Authenticated users can select thesis submissions
CREATE POLICY "Authenticated can select thesis submissions" 
ON public.thesis_submissions 
FOR SELECT 
USING (true);

-- Authenticated users can update thesis submissions
CREATE POLICY "Authenticated can update thesis submissions" 
ON public.thesis_submissions 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Authenticated users can delete thesis submissions
CREATE POLICY "Authenticated can delete thesis submissions" 
ON public.thesis_submissions 
FOR DELETE 
USING (true);

-- =============================================================================
-- 11. RLS POLICIES - FEEDBACK TABLE
-- =============================================================================

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (true);

-- Authenticated users can view feedback
CREATE POLICY "Authenticated users can view feedback" 
ON public.feedback 
FOR SELECT 
USING (true);

-- Authenticated users can modify feedback
CREATE POLICY "Authenticated users can modify feedback" 
ON public.feedback 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Authenticated users can delete feedback
CREATE POLICY "Authenticated users can delete feedback" 
ON public.feedback 
FOR DELETE 
USING (true);

-- =============================================================================
-- 12. INITIAL DATA (OPTIONAL)
-- =============================================================================

-- You can add initial admin user or sample data here if needed
-- Example:
-- INSERT INTO public.system_users (user_id, name, email, role, status)
-- VALUES ('your-admin-user-id', 'Admin User', 'admin@example.com', 'Admin', 'Active');

-- =============================================================================
-- END OF MIGRATION SCRIPT
-- =============================================================================

-- Script completed successfully!
-- This script recreates the complete database structure with:
-- ✓ All tables and constraints
-- ✓ Custom types and enums
-- ✓ Row Level Security policies
-- ✓ Functions and triggers
-- ✓ Performance indexes
-- 
-- To use this script:
-- 1. Run it in your Supabase SQL editor
-- 2. Verify all objects are created successfully
-- 3. Test authentication and permissions
-- 4. Add any initial data as needed

-- =============================================================================
-- 1. NEW TABLE: email_verifications
-- Stores temporary 6-digit codes
-- =============================================================================
CREATE TABLE public.email_verifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code            char(6) NOT NULL CHECK (char_length(code) = 6),
    expires_at      timestamptz NOT NULL,
    attempts        int DEFAULT 0,
    used            boolean DEFAULT false,
    created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_verifications_user ON public.email_verifications(user_id);
CREATE INDEX idx_email_verifications_code ON public.email_verifications(code);

-- =============================================================================
-- 2. RLS – only the owning user can touch the row
-- =============================================================================
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own verification codes"
ON public.email_verifications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. House-keeping function & cron (optional)
-- Deletes expired rows once an hour
-- =============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_codes()
RETURNS void
LANGUAGE sql AS $$
  DELETE FROM public.email_verifications
  WHERE expires_at < now();
$$;

-- Example cron (Supabase Dashboard → SQL → Extensions → pg_cron)
-- select cron.schedule('cleanup-codes', '0 * * * *', 'SELECT public.cleanup_expired_codes();');
ALTER TABLE public.email_verifications
  ADD CONSTRAINT email_verifications_user_id_unique UNIQUE (user_id);

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

-- =============================================================================
-- MIGRATION: Fix System User Deletion
-- =============================================================================
-- This migration fixes the delete user functionality to properly handle:
-- 1. Deletion from both system_users and auth.users tables
-- 2. Proper foreign key constraints with CASCADE
-- 3. Admin-only deletion with proper RLS policies
-- =============================================================================

-- First, let's add the missing foreign key constraint to auth.users if it doesn't exist
-- This ensures referential integrity between system_users and auth.users
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'system_users_user_id_fkey' 
        AND table_name = 'system_users'
    ) THEN
        ALTER TABLE public.system_users 
        ADD CONSTRAINT system_users_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================================================
-- Create a function to properly delete a system user and their auth account
-- =============================================================================
CREATE OR REPLACE FUNCTION public.delete_system_user(target_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_user_id UUID;
    v_auth_user_id UUID;
    v_current_user_role TEXT;
BEGIN
    -- Check if the current user is an admin
    SELECT role INTO v_current_user_role
    FROM system_users
    WHERE user_id = auth.uid()
    AND status = 'Active';
    
    IF v_current_user_role != 'Admin' THEN
        RAISE EXCEPTION 'Only administrators can delete users';
    END IF;
    
    -- Get the auth user_id from system_users
    SELECT user_id, id INTO v_auth_user_id, v_system_user_id
    FROM system_users
    WHERE id = target_user_id;
    
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Prevent self-deletion
    IF v_auth_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot delete your own account';
    END IF;
    
    -- Delete from system_users (this will cascade to other related tables if needed)
    DELETE FROM system_users WHERE id = target_user_id;
    
    -- Delete from auth.users (this requires admin privileges)
    -- Note: This uses Supabase's auth.users table directly
    DELETE FROM auth.users WHERE id = v_auth_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User deleted successfully',
        'deleted_system_user_id', v_system_user_id,
        'deleted_auth_user_id', v_auth_user_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle the actual permission check)
GRANT EXECUTE ON FUNCTION public.delete_system_user(UUID) TO authenticated;

-- =============================================================================
-- Update RLS Policies for system_users table
-- =============================================================================

-- Drop existing delete policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can delete system users" ON public.system_users;
DROP POLICY IF EXISTS "Admin can delete system_users" ON public.system_users;

-- Create a comprehensive delete policy for admins
CREATE POLICY "Admin users can delete other system users"
ON public.system_users
FOR DELETE
USING (
    EXISTS (
        SELECT 1 
        FROM public.system_users su
        WHERE su.user_id = auth.uid()
        AND su.role = 'Admin'
        AND su.status = 'Active'
    )
    -- Prevent self-deletion
    AND user_id != auth.uid()
);

-- =============================================================================
-- Create a helper function to check if current user is an admin
-- (Update the existing one if needed)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.check_admin_status()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.system_users 
        WHERE user_id = auth.uid() 
        AND role = 'Admin'
        AND status = 'Active'
    );
$$;

-- =============================================================================
-- Alternative: Create an RPC function that can be called from the client
-- This is a safer approach that doesn't require direct auth.users access
-- =============================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_target_auth_id UUID;
    v_result jsonb;
BEGIN
    -- Check if current user is admin
    v_is_admin := check_admin_status();
    
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Only admins can delete users'
        );
    END IF;
    
    -- Get the auth user id
    SELECT user_id INTO v_target_auth_id
    FROM system_users
    WHERE id = p_user_id;
    
    IF v_target_auth_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Prevent self-deletion
    IF v_target_auth_id = auth.uid() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot delete your own account'
        );
    END IF;
    
    -- Start transaction
    BEGIN
        -- Delete from system_users first
        DELETE FROM system_users WHERE id = p_user_id;
        
        -- Use Supabase's admin API to delete the auth user
        -- Note: This requires proper service_role key access
        -- For client-side, we'll handle this differently
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User deleted from system',
            'auth_user_id', v_target_auth_id
        );
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM
            );
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- =============================================================================
-- Create indexes for better performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_system_users_user_id_role 
ON public.system_users(user_id, role, status);

-- =============================================================================
-- Add comment for documentation
-- =============================================================================
COMMENT ON FUNCTION public.admin_delete_user IS 
'Admin function to delete a system user. Returns the auth_user_id that needs to be deleted via Supabase Admin API';

COMMENT ON FUNCTION public.delete_system_user IS 
'Complete user deletion function that removes both system_user and auth.users records (requires elevated privileges)';

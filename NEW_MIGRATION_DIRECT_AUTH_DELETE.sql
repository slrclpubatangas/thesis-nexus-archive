-- =============================================================================
-- DIRECT AUTH USER DELETION - APPLY THIS IN SUPABASE DASHBOARD
-- =============================================================================
-- This creates a function that deletes from both system_users and auth.users
-- using direct SQL execution
-- =============================================================================

-- Create a helper function to check if current user is an admin
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

-- Create the main delete function that removes from both tables
CREATE OR REPLACE FUNCTION public.admin_delete_user_complete(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_target_auth_id UUID;
    v_target_name TEXT;
    v_target_email TEXT;
    v_sql TEXT;
BEGIN
    -- Check if current user is admin
    v_is_admin := check_admin_status();
    
    IF NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Only admins can delete users'
        );
    END IF;
    
    -- Get the user details
    SELECT user_id, name, email INTO v_target_auth_id, v_target_name, v_target_email
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
    
    BEGIN
        -- Step 1: Delete from system_users first
        DELETE FROM system_users WHERE id = p_user_id;
        
        -- Step 2: Delete from auth.users using dynamic SQL
        v_sql := 'DELETE FROM auth.users WHERE id = $1';
        EXECUTE v_sql USING v_target_auth_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User completely deleted from both system and authentication',
            'deleted_user_name', v_target_name,
            'deleted_user_email', v_target_email,
            'deleted_auth_id', v_target_auth_id
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- If auth deletion fails, try to restore system_users record
            BEGIN
                INSERT INTO system_users (id, user_id, name, email, role, status)
                VALUES (p_user_id, v_target_auth_id, v_target_name, v_target_email, 'Reader', 'Inactive')
                ON CONFLICT (id) DO NOTHING;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Ignore restore errors
                    NULL;
            END;
            
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Failed to delete user: ' || SQLERRM,
                'partial_deletion', true,
                'auth_user_id', v_target_auth_id,
                'user_email', v_target_email
            );
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.admin_delete_user_complete(UUID) TO authenticated;

-- Update RLS policies for system_users table
-- Drop existing delete policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can delete system users" ON public.system_users;
DROP POLICY IF EXISTS "Admin can delete system_users" ON public.system_users;
DROP POLICY IF EXISTS "Admin users can delete other system users" ON public.system_users;

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

-- Add comment for documentation
COMMENT ON FUNCTION public.admin_delete_user_complete IS 
'Complete user deletion function that removes users from both system_users and auth.users tables';

-- Test the function (optional - you can run this to verify it works)
-- SELECT public.admin_delete_user_complete('some-test-user-id');

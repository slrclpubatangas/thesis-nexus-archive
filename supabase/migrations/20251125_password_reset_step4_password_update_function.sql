-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure function to update auth user password with explicit type casting
CREATE OR REPLACE FUNCTION public.update_user_password_by_system_user_id(
  p_system_user_id UUID,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  -- Get the auth user_id from system_users
  SELECT user_id INTO v_auth_user_id
  FROM public.system_users
  WHERE id = p_system_user_id;

  -- If no user found, return false
  IF v_auth_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update password with explicit text cast
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password::text, gen_salt('bf'::text)),
      updated_at = NOW()
  WHERE id = v_auth_user_id;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_password_by_system_user_id(UUID, TEXT) TO anon, authenticated;

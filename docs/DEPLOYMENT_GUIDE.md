# Complete User Deletion Fix - Deployment Guide

## Overview
This guide will walk you through deploying the complete user deletion functionality that properly removes users from both `system_users` and `auth.users` tables.

## Prerequisites
1. Supabase CLI installed: `npm install -g supabase`
2. Access to your Supabase project dashboard
3. Your project's service role key (for environment variables)

## Step 1: Deploy the Database Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the entire contents of `supabase/migrations/20250118_fix_system_user_deletion.sql`
5. Click **Run** to execute the migration
6. Verify success in the output

### Option B: Using Supabase CLI
```bash
# Make sure you're in your project directory
cd "C:\Users\user\Desktop\VINCENT\capstone 2\thesis-nexus-archive-main(2)"

# Login to Supabase (if not already logged in)
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref zummzziydfpvwuxxuyyu

# Apply the migration
supabase db push
```

## Step 2: Deploy the Edge Function

### 2.1 Install Dependencies
Make sure you have the Supabase CLI installed and authenticated:
```bash
supabase --version
```

### 2.2 Deploy the Edge Function
```bash
# Deploy the delete-user function
supabase functions deploy delete-user

# Verify deployment
supabase functions list
```

### 2.3 Set Environment Variables
The Edge Function needs access to environment variables. Set these in your Supabase dashboard:

1. Go to **Settings** > **Edge Functions** > **Environment Variables**
2. Add the following variables:
   - `SUPABASE_URL`: Your project URL (e.g., `https://zummzziydfpvwuxxuyyu.supabase.co`)
   - `SUPABASE_ANON_KEY`: Your project's anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key

**Important**: Never commit the service role key to your code repository!

### 2.4 Get Your Keys
You can find your keys in the Supabase dashboard:
1. Go to **Settings** > **API**
2. Copy the **URL**, **anon public key**, and **service_role secret key**

## Step 3: Update Your Application

### 3.1 Environment Variables
Make sure your `.env` file has the correct values:
```env
VITE_SUPABASE_URL=https://zummzziydfpvwuxxuyyu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3.2 Build and Deploy Your App
```bash
# Build the application
npm run build

# Deploy to your hosting service (e.g., Vercel, Netlify, etc.)
# Follow your hosting provider's deployment instructions
```

## Step 4: Testing the Implementation

### 4.1 Create a Test User
1. Log in as an admin
2. Go to **System Users** tab
3. Click **Add New User**
4. Create a test user with:
   - Name: Test User
   - Email: test@example.com
   - Role: Reader
   - Status: Active

### 4.2 Verify User Creation
1. Check that the user appears in the UI
2. Verify in Supabase dashboard:
   - Go to **Database** > **system_users** table
   - Go to **Authentication** > **Users**
   - Confirm the user exists in both places

### 4.3 Test User Deletion
1. In the System Users tab, click the delete button (trash icon) next to the test user
2. Confirm the deletion in the popup
3. Verify the user disappears from the UI immediately
4. Check Supabase dashboard:
   - User should be gone from **system_users** table
   - User should be gone from **Authentication** > **Users**

### 4.4 Test Login Prevention
1. Try to log in with the deleted user's credentials
2. Should receive an "Invalid login credentials" error
3. This confirms the auth user was properly deleted

## Step 5: Monitoring and Logs

### 5.1 Edge Function Logs
To view logs from your Edge Function:
```bash
# View real-time logs
supabase functions logs delete-user

# Or view in the dashboard
# Go to Edge Functions > delete-user > Logs
```

### 5.2 Database Logs
Check the database logs in your Supabase dashboard:
1. Go to **Settings** > **Logs**
2. Filter by **Database** to see SQL queries
3. Look for DELETE operations on system_users and auth.users

## Troubleshooting

### Issue: Edge Function Not Found
**Error**: `Function 'delete-user' not found`

**Solution**:
1. Verify deployment: `supabase functions list`
2. Redeploy: `supabase functions deploy delete-user`
3. Check function name in the code matches the directory name

### Issue: Environment Variables Not Set
**Error**: `Service role key not configured`

**Solution**:
1. Go to Supabase dashboard > Settings > Edge Functions > Environment Variables
2. Add `SUPABASE_SERVICE_ROLE_KEY` with your service role key
3. Redeploy the function: `supabase functions deploy delete-user`

### Issue: Permission Denied
**Error**: `Unauthorized: Admin access required`

**Solution**:
1. Verify the current user has `role = 'Admin'` in system_users table
2. Verify the user's status is 'Active'
3. Check that the user is properly logged in

### Issue: User Still Appears After Deletion
**Possible Causes**:
1. Frontend cache - try refreshing the page
2. Real-time subscription not updating - check browser console for errors
3. RLS policies blocking the deletion - check Supabase logs

**Solution**:
1. Check browser console for errors
2. Check Edge Function logs: `supabase functions logs delete-user`
3. Verify RLS policies in the database

### Issue: Cannot Delete Auth User
**Error**: Failed to delete user from authentication

**Solution**:
1. Verify service role key is correct and has admin privileges
2. Check that the user exists in auth.users table
3. Try manually deleting from auth in Supabase dashboard

## Additional Security Considerations

### 1. Rate Limiting
Consider adding rate limiting to prevent abuse:
```typescript
// In your Edge Function, add rate limiting logic
const rateLimitKey = `delete_user_${currentUser.id}`;
// Implement your rate limiting logic here
```

### 2. Audit Logging
Add audit logging for user deletions:
```sql
-- Create an audit table
CREATE TABLE user_deletion_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deleted_user_id UUID NOT NULL,
  deleted_user_email TEXT NOT NULL,
  deleted_by_user_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 3. Backup Before Deletion
Consider implementing a "soft delete" first, then hard delete later:
```sql
-- Add a deleted_at column instead of immediate deletion
ALTER TABLE system_users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Edge Function deployed and accessible
- [ ] Environment variables set correctly
- [ ] Test user can be created
- [ ] Test user appears in both system_users and auth.users
- [ ] Delete function works (user removed from UI)
- [ ] User removed from system_users table
- [ ] User removed from auth.users table
- [ ] Deleted user cannot log in
- [ ] Admin cannot delete their own account
- [ ] Non-admin users cannot delete any users
- [ ] Edge Function logs show successful operations

## Support

If you encounter issues:
1. Check the browser console for client-side errors
2. Check Edge Function logs: `supabase functions logs delete-user`
3. Check Supabase database logs in the dashboard
4. Verify all environment variables are set correctly
5. Ensure your Supabase project has the latest migrations applied

## Rolling Back

If you need to roll back the changes:

### 1. Remove Edge Function
```bash
supabase functions delete delete-user
```

### 2. Rollback Database Changes
```sql
-- Remove the functions
DROP FUNCTION IF EXISTS admin_delete_user(UUID);
DROP FUNCTION IF EXISTS delete_system_user(UUID);
DROP FUNCTION IF EXISTS check_admin_status();

-- Remove foreign key constraint
ALTER TABLE system_users DROP CONSTRAINT IF EXISTS system_users_user_id_fkey;

-- Remove RLS policies
DROP POLICY IF EXISTS "Admin users can delete other system users" ON system_users;
```

### 3. Revert Component Changes
Restore the original `handleDeleteUser` function in `SystemUsers.tsx` to only delete from system_users table.

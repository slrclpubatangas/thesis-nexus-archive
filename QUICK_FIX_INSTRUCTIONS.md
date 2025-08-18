# QUICK FIX: Complete User Deletion Setup

## The Problem
You're getting a 401 Unauthorized error because the Edge Function needs environment variables set up.

## Immediate Solution (2 Steps)

### Step 1: Apply Database Migration
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zummzziydfpvwuxxuyyu
2. Click **SQL Editor** in the left sidebar
3. Copy the entire contents of `APPLY_THIS_MIGRATION.sql` file
4. Paste it in the SQL Editor
5. Click **Run** button
6. Wait for "Success" message

### Step 2: Set Up Edge Function Environment Variables
1. In your Supabase Dashboard, go to **Settings** (bottom left)
2. Click **Edge Functions** in the left menu
3. Click **Environment Variables** tab
4. Add these 3 variables:

**Variable 1:**
- Name: `SUPABASE_URL`
- Value: `https://zummzziydfpvwuxxuyyu.supabase.co`

**Variable 2:**
- Name: `SUPABASE_ANON_KEY`
- Value: (Go to Settings → API and copy your "anon public" key)

**Variable 3:**
- Name: `SUPABASE_SERVICE_ROLE_KEY`  
- Value: (Go to Settings → API and copy your "service_role secret" key)

5. Click **Save** for each variable

## Testing

After completing both steps:

1. **Refresh your application** (hard refresh: Ctrl+F5)
2. **Log in as an admin**
3. **Go to System Users tab**
4. **Try deleting a test user**

The deletion should now work and remove the user from both the UI and prevent them from logging in.

## If You Still Get Errors

### Option A: Check the Console
Open browser console (F12) and look for any new error messages. Share them with me.

### Option B: Alternative Simple Approach
If the Edge Function still doesn't work, I can give you a simpler approach that:
1. Deletes from `system_users` table (removes from UI)
2. Shows you which users need manual deletion from auth
3. You can manually delete them from Supabase Dashboard → Authentication → Users

### Option C: Manual Process
For immediate results:
1. Use the current delete button (it will remove from system_users)
2. Go to Supabase Dashboard → Authentication → Users
3. Manually delete the corresponding auth user

## Verification Steps

After deletion, verify:
1. ✅ User disappears from System Users UI
2. ✅ User is gone from Database → system_users table
3. ✅ User is gone from Authentication → Users
4. ✅ Deleted user cannot log in anymore

## What Each Step Does

**Step 1 (Database Migration):** Creates secure functions that admins can call to delete users safely.

**Step 2 (Environment Variables):** Gives the Edge Function permission to access both your database and authentication system.

The Edge Function acts as a secure bridge between your frontend and Supabase's admin features, ensuring only authenticated admins can delete users while handling both database cleanup and authentication removal.

## Need Help?
If you encounter any issues, share the exact error message and I'll help you debug it!

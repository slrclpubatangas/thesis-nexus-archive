# Password Reset Migration Files - Setup Guide

## Overview
These migration files set up the password reset functionality for LyceumVault using Resend email service.

## Prerequisites
- Supabase project set up
- Resend API key configured in Edge Functions environment variables
- `pgcrypto` extension available (usually enabled by default in Supabase)

## Migration Files - Run in This Order

### Step 1: Create Password Reset Tokens Table
**File:** `20251125_password_reset_step1_create_tokens_table.sql`

Creates the `password_reset_tokens` table with:
- Secure token storage
- 1-hour expiration
- Foreign key to `system_users`
- RLS policies for INSERT, SELECT, and UPDATE

### Step 2: Add System Users RLS Policy
**File:** `20251125_password_reset_step2_system_users_rls.sql`

Adds RLS policy to `system_users` table to allow:
- Reading user ID by email (for password reset lookup)

### Step 3: Add Password Reset Tokens RLS Policies
**File:** `20251125_password_reset_step3_tokens_rls.sql`

Adds comprehensive RLS policies for `password_reset_tokens`:
- Anyone can insert tokens (for requesting reset)
- Anyone can read tokens (for validation)
- Anyone can update tokens (to mark as used)

### Step 4: Create Password Update Function
**File:** `20251125_password_reset_step4_password_update_function.sql`

Creates the secure database function:
- `update_user_password_by_system_user_id(UUID, TEXT)`
- Enables `pgcrypto` extension
- Hashes passwords using bcrypt
- Maps `system_users.id` → `auth.users.encrypted_password`
- Has `SECURITY DEFINER` to update auth schema

## How to Run

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste each file's contents **in order** (Step 1 → Step 4)
4. Execute each SQL statement
5. Verify no errors appear

### Option 2: Via Supabase CLI
```bash
# Run all migrations
supabase db push

# Or run individually
supabase db execute --file supabase/migrations/20251125_password_reset_step1_create_tokens_table.sql
supabase db execute --file supabase/migrations/20251125_password_reset_step2_system_users_rls.sql
supabase db execute --file supabase/migrations/20251125_password_reset_step3_tokens_rls.sql
supabase db execute --file supabase/migrations/20251125_password_reset_step4_password_update_function.sql
```

## Edge Function Setup

After running migrations, deploy the password reset email Edge Function:

```bash
supabase functions deploy send-password-reset-email
```

**Or** manually via Supabase Dashboard:
1. Go to **Edge Functions** → **Create new function**
2. Name: `send-password-reset-email`
3. Copy code from `supabase/functions/send-password-reset-email/index.ts`
4. Deploy

## Environment Variables

Ensure `RESEND_API_KEY` is set in your Edge Functions:
1. Supabase Dashboard → **Edge Functions** → **Settings**
2. Add secret: `RESEND_API_KEY` = your Resend API key

## Verification

Test the complete flow:
1. Open your app → Login modal
2. Click "Forgot Password?"
3. Enter email → Submit
4. Check email inbox for reset link
5. Click link → Reset password page
6. Enter new password → Submit
7. Login with new password

## Troubleshooting

**pgcrypto error?**
- Run: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

**RLS blocking queries?**
- Verify all 4 migration steps completed successfully
- Check RLS policies in Supabase Dashboard → Authentication → Policies

**Email not sending?**
- Verify Resend API key is set
- Check Edge Function logs
- Verify function is deployed
- Check spam folder

## Security Features

✅ Secure random 32-byte tokens  
✅ 1-hour token expiration  
✅ One-time use tokens  
✅ Bcrypt password hashing  
✅ RLS policies for data protection  
✅ Generic error messages (no email enumeration)  
✅ `SECURITY DEFINER` function for controlled access

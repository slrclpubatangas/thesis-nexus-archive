# Resend Email Setup Guide

This project has been migrated from SendGrid to Resend for email sending.

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase Environment Variable

You need to add the `RESEND_API_KEY` to your Supabase project:

#### Using Supabase CLI:
```bash
supabase secrets set RESEND_API_KEY=re_K8Mjw2Zr_PkDhEg1J77KCN6JniuAi31wS
```

#### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: `re_K8Mjw2Zr_PkDhEg1J77KCN6JniuAi31wS`

### 3. Deploy the Edge Function

```bash
supabase functions deploy send-verification-email
```

### 4. Local Development

For local testing, create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Then edit `.env` and add your actual keys:
```env
RESEND_API_KEY=re_K8Mjw2Zr_PkDhEg1J77KCN6JniuAi31wS
```

To test locally with Supabase functions:
```bash
supabase functions serve --env-file .env
```

## What Changed?

### ✅ Updated Files:
- `supabase/functions/send-verification-email/index.ts` - Replaced SendGrid with Resend
- `package.json` - Removed `@sendgrid/mail` dependency

### 📧 Email Details:
- **From:** `onboarding@resend.dev` (no domain verification needed)
- **Subject:** "Your Verification Code"
- **Content:** HTML with verification code

### 🔐 Environment Variables:
- ❌ Removed: `SENDGRID_API_KEY`
- ✅ Added: `RESEND_API_KEY`

## Frontend Integration

No changes needed to your React code! The frontend still calls the same Supabase Edge Function:

```typescript
// This still works exactly the same
await fetch(
  'https://zummzziydfpvwuxxuyyu.supabase.co/functions/v1/send-verification-email',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: sixDigitCode }),
  }
);
```

## Testing

To test email delivery, you can use Resend's test email addresses:
- `delivered@resend.dev` - Simulates successful delivery
- `bounced@resend.dev` - Simulates bounce
- `complained@resend.dev` - Simulates spam complaint

## Troubleshooting

If emails aren't sending:
1. Verify `RESEND_API_KEY` is set in Supabase secrets
2. Check Supabase Edge Function logs for errors
3. Ensure the Edge Function is deployed
4. Check Resend dashboard for API usage and errors

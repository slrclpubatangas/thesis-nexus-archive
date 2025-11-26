// @ts-nocheck
// supabase/functions/send-password-reset-email/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  resetUrl: string;
}

// Pre-compile email template function for better performance
const generateEmailHTML = (resetUrl: string): string => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)">
<tr>
<td align="center" style="padding:40px 20px 20px">
<img src="https://aceresto.net/lpu1.jpg" alt="LyceumVault" style="width:200px;height:auto;display:block;max-width:100%">
</td>
</tr>
<tr>
<td align="center" style="padding:0 20px 20px">
<h1 style="margin:0;color:#333;font-size:24px;font-weight:700">Password Reset Request</h1>
</td>
</tr>
<tr>
<td style="padding:0 40px 30px;color:#666;font-size:16px;line-height:24px">
<p style="margin:0 0 20px">We received a request to reset your password for your LyceumVault account.</p>
<p style="margin:0 0 20px">Click the button below to reset your password:</p>
<div style="text-align:center;margin:30px 0">
<a href="${resetUrl}" style="background-color:#2563eb;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;display:inline-block;font-weight:700;font-size:16px">Reset Password</a>
</div>
<p style="margin:20px 0 0;font-size:14px;color:#999">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
</td>
</tr>
<tr>
<td style="padding:20px;background-color:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;border-radius:0 0 8px 8px">
<p style="margin:0;font-size:12px;color:#999">© 2025 LyceumVault. All rights reserved.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetEmailRequest = await req.json();

    // Use the optimized template generator
    const htmlContent = generateEmailHTML(resetUrl);

    const { data, error } = await resend.emails.send({
      from: "LyceumVault <noreply@aceresto.net>",
      to: email,
      subject: "Reset Your Password",
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("✅ Password reset email sent:", data);

    return new Response(JSON.stringify({ success: true, message: "sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

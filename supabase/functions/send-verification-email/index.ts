// @ts-nocheck
// supabase/functions/send-verification-email/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerificationEmailRequest = await req.json();

    // Development mode - just log the code without sending email
    // Uncomment to enable dev mode:
    // if (Deno.env.get("ENVIRONMENT") === "dev") {
    //   console.log(`📧 [DEV] code for ${email}: ${code}`);
    //   return new Response(JSON.stringify({ success: true, message: "dev-mode", code }), {
    //     status: 200,
    //     headers: { "Content-Type": "application/json", ...corsHeaders },
    //   });
    // }

    const { data, error } = await resend.emails.send({
      from: "LyceumVault <noreply@aceresto.net>",
      to: email,
      subject: "Your Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <tr>
                      <td align="center" style="padding: 40px 20px 20px 20px;">
                        <img src="https://aceresto.net/lpu1.jpg" alt="LyceumVault" style="width: 200px; height: auto; display: block; max-width: 100%;" />
                      </td>
                    </tr>
                    <!-- Title -->
                    <tr>
                      <td align="center" style="padding: 0 20px 20px 20px;">
                        <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: bold;">Email Verification</h1>
                      </td>
                    </tr>
                    <!-- Message -->
                    <tr>
                      <td style="padding: 0 40px 30px 40px; color: #666666; font-size: 16px; line-height: 24px;">
                        <p style="margin: 0 0 20px 0;">Thank you for signing in to LyceumVault. Please use the verification code below to complete your login:</p>
                        <!-- Verification Code Box -->
                        <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                          <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                        </div>
                        <p style="margin: 20px 0 0 0; font-size: 14px; color: #999999;">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="margin: 0; font-size: 12px; color: #999999;">© 2025 LyceumVault. All rights reserved.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("✅ Email sent:", data);

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

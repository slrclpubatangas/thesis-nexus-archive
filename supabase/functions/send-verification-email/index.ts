// @ts-nocheck
// supabase/functions/send-verification-email/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import sgMail from "npm:@sendgrid/mail@7";   // ✅ Deno NPM import
// ⬆️ 7 is the latest v7; change to @8 for v8 if you prefer

sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);

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

    if (Deno.env.get("ENVIRONMENT") === "dev") {
      console.log(`📧 [DEV] code for ${email}: ${code}`);
      return new Response(JSON.stringify({ success: true, message: "dev-mode" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await sgMail.send({
      to: email,
      from: "slrclpubatangas@gmail.com", // must be verified in SendGrid
      subject: "Your 6-digit verification code",
      text: `Your code is: ${code}`,
      html: `<p>Your code is: <strong>${code}</strong></p>`,
    });

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
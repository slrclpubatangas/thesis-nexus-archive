import { supabase } from "@/integrations/supabase/client";

export async function sendVerificationEmail(email: string, code: string) {
  try {
    console.log(`📧 Sending verification code for ${email}: ${code}`);
    
    const { data, error } = await supabase.functions.invoke('send-verification-email', {
      body: { email, code },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    if (data?.success) {
      console.log('✅ Verification email sent successfully');
    } else {
      console.error('❌ Email sending failed:', data);
      throw new Error(data?.error || 'Failed to send verification email');
    }
  } catch (error: any) {
    console.error('Error calling send-verification-email function:', error);
    throw error;
  }
}
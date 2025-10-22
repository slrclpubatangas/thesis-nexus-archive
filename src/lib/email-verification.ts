// lib/email-verification.ts
import { supabase } from '../integrations/supabase/client';

export const generateCode = (): string =>
  Math.floor(100_000 + Math.random() * 900_000).toString();

export async function createVerificationCode(userId: string): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  const { error } = await supabase
    .from('email_verifications')
    .upsert(
      {
        user_id: userId,
        code,
        expires_at: expiresAt,
        used: false,
        attempts: 0,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Supabase upsert error:', error);
    throw error;
  }
  return code;
}

export async function consumeCode(
  userId: string,
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  const { data, error } = await supabase
    .from('email_verifications')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return { valid: false, reason: 'NOT_FOUND' };
  if (data.used) return { valid: false, reason: 'ALREADY_USED' };
  if (new Date() > new Date(data.expires_at))
    return { valid: false, reason: 'EXPIRED' };
  if (data.attempts >= 5) return { valid: false, reason: 'MAX_ATTEMPTS' };
  if (data.code !== code) {
    await supabase
      .from('email_verifications')
      .update({ attempts: data.attempts + 1 })
      .eq('user_id', userId);
    return { valid: false, reason: 'INVALID' };
  }

  await supabase
    .from('email_verifications')
    .update({ used: true })
    .eq('user_id', userId);

  return { valid: true };
}
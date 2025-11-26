import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a secure password reset token using Web Crypto API
 */
function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a password reset token and send email
 * @param email User's email address
 */
export async function requestPasswordReset(email: string): Promise<void> {
    try {
        console.log('🔄 Starting password reset request for:', email);

        // Generate secure token
        const token = generateToken();
        console.log('✅ Token generated');

        // Get user by email from system_users table
        const { data: userData, error: userError } = await supabase
            .from('system_users')
            .select('id')
            .eq('email', email)
            .single();

        if (userError || !userData) {
            // For security, don't reveal if email doesn't exist
            console.log('⚠️ User not found for email:', email);
            return; // Silent success for security
        }

        console.log('✅ User found, storing token...');

        // Store token in database (using any to bypass TypeScript errors)
        const { error: tokenError } = await (supabase as any)
            .from('password_reset_tokens')
            .insert({
                user_id: userData.id,
                token,
                expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            });

        if (tokenError) {
            console.error('❌ Failed to create reset token:', tokenError);
            throw new Error('Failed to create reset token');
        }

        console.log('✅ Token stored in database');

        // Send email via Edge Function
        const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
        console.log('📧 Sending email to:', email);
        console.log('🔗 Reset URL:', resetUrl);

        const { data, error } = await supabase.functions.invoke('send-password-reset-email', {
            body: { email, resetUrl },
        });

        if (error) {
            console.error('❌ Edge function error:', error);
            throw new Error(`Failed to send reset email: ${error.message}`);
        }

        if (!data?.success) {
            console.error('❌ Email sending failed:', data);
            throw new Error(data?.error || 'Failed to send reset email');
        }

        console.log('✅ Password reset email sent successfully!');
    } catch (err) {
        console.error('❌ Error in requestPasswordReset:', err);
        throw err;
    }
}

/**
 * Validate and consume a password reset token
 * @param token Reset token from URL
 * @returns Object with validation result and user_id if valid
 */
export async function validateResetToken(token: string): Promise<{
    valid: boolean;
    user_id?: string;
    reason?: string;
}> {
    try {
        // Find the token (using any to bypass TypeScript errors)
        const { data: tokenData, error } = await (supabase as any)
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .single();

        if (error || !tokenData) {
            return { valid: false, reason: 'Invalid or expired token' };
        }

        // Check if expired
        if (new Date(tokenData.expires_at) < new Date()) {
            return { valid: false, reason: 'Token has expired' };
        }

        return { valid: true, user_id: tokenData.user_id };
    } catch (err) {
        console.error('Error validating reset token:', err);
        return { valid: false, reason: 'Failed to validate token' };
    }
}

/**
 * Update user password and mark token as used
 * @param token Reset token
 * @param newPassword New password
 */
export async function resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        console.log('🔄 Starting password reset with token');

        // Validate token first
        const validation = await validateResetToken(token);
        console.log('Token validation result:', validation);

        if (!validation.valid) {
            console.error('❌ Token validation failed:', validation.reason);
            return { success: false, error: validation.reason };
        }

        console.log('✅ Token valid, updating password for user:', validation.user_id);

        // Call database function to update password in auth.users
        const { data, error: updateError } = await supabase.rpc('update_user_password_by_system_user_id', {
            p_system_user_id: validation.user_id,
            p_new_password: newPassword
        });

        if (updateError) {
            console.error('❌ Failed to update password:', updateError);
            return { success: false, error: 'Failed to update password' };
        }

        if (!data) {
            console.error('❌ Password update returned false');
            return { success: false, error: 'Failed to update password' };
        }

        console.log('✅ Password updated successfully');

        // Mark token as used (using any to bypass TypeScript errors)
        const { error: tokenUpdateError } = await (supabase as any)
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('token', token);

        if (tokenUpdateError) {
            console.error('⚠️ Failed to mark token as used:', tokenUpdateError);
            // Don't fail the request, password was already updated
        }

        console.log('✅ Password reset complete!');
        return { success: true };
    } catch (err: any) {
        console.error('❌ Error in resetPassword:', err);
        return { success: false, error: err.message || 'Failed to reset password' };
    }
}

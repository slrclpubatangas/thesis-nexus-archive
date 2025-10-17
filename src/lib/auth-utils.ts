// auth-utils.ts
import { supabase } from '../integrations/supabase/client';

/**
 * Updates or creates last login timestamp for a user
 */
export const updateLastLogin = async (userId: string) => {
  try {
    console.log('Updating last login for user:', userId);
    
    // First, try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('system_users')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Error updating last login:', updateError);
      return;
    }

    // If no rows were updated, the user doesn't exist in system_users
    if (!updateData || updateData.length === 0) {
      console.log('User not found in system_users, checking if we should create record...');
      
      // Get user info from auth.users to create system_users record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Creating system_users record for:', user.email);
        const { error: insertError } = await supabase
          .from('system_users')
          .insert([{
            user_id: userId,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
            email: user.email || '',
            role: 'Reader' as const,
            status: 'Active' as const,
            last_login: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error creating system_users record:', insertError);
        } else {
          console.log('Successfully created system_users record with login timestamp');
        }
      }
    } else {
      console.log('Successfully updated last login timestamp');
    }
  } catch (error) {
    console.error('Failed to update last login:', error);
  }
};

/**
 * Checks if a user is active in the system by user ID
 */
export const checkUserStatus = async (userId: string): Promise<boolean> => {
  console.log('🔍 checkUserStatus for userId', userId);

  const { data, error } = await supabase
    .from('system_users')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('❌ DB error', error);
    return false;  // Deny on error
  }

  console.log('📋 DB row returned', data);

  if (!data) {
    console.log('⚠️  no row in system_users → allowing (reader)');
    return true;
  }

  const isActive = data.status === 'Active';
  console.log('🔒 status =', data.status, '→ isActive =', isActive);
  return isActive;
};

/**
 * Checks if a user is active in the system by email
 */
export const checkUserStatusByEmail = async (email: string): Promise<boolean> => {
  console.log('🔍 checkUserStatusByEmail for', email);

  const { data, error } = await supabase
    .from('system_users')
    .select('status')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('❌ DB error', error);
    return false;  // Deny on error
  }

  console.log('📋 DB row returned', data);

  if (!data) {
    console.log('⚠️  no row in system_users → allowing (reader)');
    return true;
  }

  const isActive = data.status === 'Active';
  console.log('🔒 status =', data.status, '→ isActive =', isActive);
  return isActive;
};
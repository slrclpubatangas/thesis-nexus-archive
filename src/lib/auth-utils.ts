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
 * Checks if a user is active in the system
 */
export const checkUserStatus = async (userId: string): Promise<boolean> => {
  console.log('checkUserStatus called for userId:', userId);
  try {
    const { data, error } = await supabase
      .from('system_users')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Database query result:', { data, error });

    if (error) {
      console.error('Error checking user status:', error);
      // If there's a database error, deny login for security
      return false;
    }

    // If user doesn't exist in system_users, allow login (new users will be created)
    if (!data) {
      console.log('No user found in system_users, allowing login for new user');
      return true;
    }

    // Check if the user's status is 'Active'
    const isActive = data.status === 'Active';
    console.log(`User ${userId} status check: ${data.status}, isActive: ${isActive}`);
    return isActive;
  } catch (error) {
    console.error('Failed to check user status:', error);
    // Default to denying login if we can't check status for security
    return false;
  }
};
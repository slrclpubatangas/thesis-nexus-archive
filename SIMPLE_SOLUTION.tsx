// SIMPLE SOLUTION: Replace the handleDeleteUser function with this
// This approach deletes from system_users and shows you which auth users need manual deletion

const handleDeleteUser = async (userId: string) => {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  try {
    // First, get the user details
    const { data: userData, error: fetchError } = await supabase
      .from('system_users')
      .select('user_id, name, email')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user details:', fetchError);
      toast({
        title: "Error",
        description: "Failed to find user details",
        variant: "destructive",
      });
      return;
    }

    // Delete from system_users using RPC function (this ensures proper admin checks)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('admin_delete_user', { p_user_id: userId });

    if (rpcError) {
      console.error('Failed to delete user:', rpcError);
      toast({
        title: "Error",
        description: rpcError.message || "Failed to delete user",
        variant: "destructive",
      });
      return;
    }

    if (rpcResult && !rpcResult.success) {
      toast({
        title: "Error",
        description: rpcResult.error || "Failed to delete user",
        variant: "destructive",
      });
      return;
    }

    // User deleted from system_users successfully
    console.log('User deleted from system_users:', rpcResult);

    // Show message with instructions for manual auth deletion
    toast({
      title: "User Deleted from System",
      description: `${userData.name} removed from system. To completely prevent login, manually delete user "${userData.email}" from Authentication → Users in your Supabase Dashboard.`,
      variant: "destructive",
    });

    // Show additional console instructions
    console.log(`
🚨 MANUAL STEP REQUIRED:
To completely delete user "${userData.name}" (${userData.email}):
1. Go to Supabase Dashboard → Authentication → Users
2. Find user with email: ${userData.email}
3. Click the trash icon to delete from auth.users
4. This will prevent them from logging in completely
    `);

    // Refresh the users list
    fetchUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred while deleting the user",
      variant: "destructive",
    });
  }
};

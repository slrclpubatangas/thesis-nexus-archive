import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield, User, Mail, Calendar, X, Check } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';

interface SystemUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Reader';
  status: 'Active' | 'Inactive';
  last_login: string | null;
  created_at: string;
}

const SystemUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Reader'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortByLogin, setSortByLogin] = useState<'newest' | 'oldest' | 'never'>('newest');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Reader' as 'Admin' | 'Reader',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Set up real-time subscription for last_login updates
  useEffect(() => {
    const channel = supabase
      .channel('system-users-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_users',
          filter: 'last_login=not.is.null'
        },
        (payload) => {
          console.log('Real-time login update:', payload);
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === payload.new.id
                ? { ...user, last_login: payload.new.last_login }
                : user
            )
          );
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch users from database
  const fetchUsers = async () => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Users fetch timeout - forcing completion');
        setLoading(false);
        toast({
          title: "Loading Timeout",
          description: "Data loading took too long. Please refresh to try again.",
          variant: "destructive",
        });
      }
    }, 30000); // 30 second timeout

    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('last_login', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched users with login times:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter(user =>
      // Exclude current logged-in user
      user.user_id !== currentUser?.id &&
      // Search filter
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      // Role filter
      (roleFilter === 'All' || user.role === roleFilter) &&
      // Status filter
      (statusFilter === 'All' || user.status === statusFilter)
    )
    .sort((a, b) => {
      // Sort by last login
      if (sortByLogin === 'never') {
        // Show users who never logged in first
        if (!a.last_login && !b.last_login) return 0;
        if (!a.last_login) return -1;
        if (!b.last_login) return 1;
        return 0;
      } else if (sortByLogin === 'newest') {
        // Show most recent logins first
        if (!a.last_login && !b.last_login) return 0;
        if (!a.last_login) return 1;
        if (!b.last_login) return -1;
        return new Date(b.last_login).getTime() - new Date(a.last_login).getTime();
      } else { // oldest
        // Show oldest logins first
        if (!a.last_login && !b.last_login) return 0;
        if (!a.last_login) return 1;
        if (!b.last_login) return -1;
        return new Date(a.last_login).getTime() - new Date(b.last_login).getTime();
      }
    });

  const [editingRole, setEditingRole] = useState<'Admin' | 'Reader'>('Reader');
  const [editingStatus, setEditingStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user);
    setEditingRole(user.role);
    setEditingStatus(user.status);
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('system_users')
        .update({
          status: editingStatus,
          role: editingRole
        })
        .eq('id', selectedUser.id);

      if (error) {
        console.error('Error updating user:', error);
        toast({
          title: "Error",
          description: "Failed to update user",
          variant: "destructive",
        });
        return;
      }

      const roleChanged = editingRole !== selectedUser.role;
      const statusChanged = editingStatus !== selectedUser.status;

      let description = 'User updated successfully';
      if (roleChanged && statusChanged) {
        description = `User role changed to ${editingRole === 'Reader' ? 'SLRC Staff' : 'Admin'} and status updated to ${editingStatus}`;
      } else if (roleChanged) {
        description = `User role changed to ${editingRole === 'Reader' ? 'SLRC Staff' : 'Admin'}`;
      } else if (statusChanged) {
        description = `User status updated to ${editingStatus}`;
      }

      toast({
        title: "Success",
        description,
      });

      setShowEditUser(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.name || !newUser.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add users",
        variant: "destructive",
      });
      return;
    }

    setIsAddingUser(true);

    try {
      // Debug: Log the role value before sending to database
      console.log('Adding user with role:', newUser.role);
      console.log('Full newUser object:', newUser);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'TempPassword123!',
        options: {
          data: {
            full_name: newUser.name
          },
          emailRedirectTo: `${window.location.origin}/#login`
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        toast({
          title: "Error",
          description: authError.message || "Failed to create user account",
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Error",
          description: "Failed to create user account",
          variant: "destructive",
        });
        return;
      }

      const userPayload = {
        user_id: authData.user.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      };

      console.log('Inserting to database with payload:', userPayload);

      const { data, error } = await supabase
        .from('system_users')
        .insert([userPayload])
        .select();

      if (error) {
        console.error('Error adding system user:', error);
        await supabase.auth.admin.deleteUser(authData.user.id);
        toast({
          title: "Error",
          description: error.message || "Failed to add user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `User created successfully. Temporary password: TempPassword123!`,
      });

      setShowAddUser(false);
      setNewUser({ name: '', email: '', role: 'Reader', status: 'Active' });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteUser = (user: SystemUser) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);

    try {
      const { data, error } = await supabase.rpc('admin_delete_user_complete', {
        p_user_id: deletingUser.id,
      });

      if (error || !data?.success) {
        toast({
          title: 'Error',
          description: data?.error || error?.message || 'Delete failed',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: data.message || 'User completely deleted',
      });

      // Close modal and refresh
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setShowDeleteModal(false);
    setDeletingUser(null);
  };

  // Fallback method using RPC function
  const handleDeleteUserFallback = async (userId: string) => {
    try {
      console.log('Using RPC fallback for user:', userId);

      // Try using the RPC function
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('admin_delete_user', { p_user_id: userId });

      if (rpcError) {
        console.error('RPC function failed:', rpcError);
        toast({
          title: "Error",
          description: "Failed to delete user: " + rpcError.message,
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

      console.log('RPC deletion successful:', rpcResult);

      // Show appropriate message based on RPC result
      if (rpcResult && rpcResult.auth_user_id) {
        toast({
          title: "Partial Success",
          description: `User removed from system. Note: To completely prevent login, manually delete user ${rpcResult.deleted_user_email} from Authentication → Users in Supabase Dashboard.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User has been deleted from the system",
        });
      }

      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('RPC fallback failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete user completely",
        variant: "destructive",
      });
    }
  };

  // Map database role to display name
  const displayRole = (role: string) => {
    return role === 'Reader' ? 'SLRC Staff' : role;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never logged in';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size={80} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Users</h2>
          <p className="text-gray-600">Manage admin and system user accounts</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'All' | 'Admin' | 'Reader')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Reader">SLRC Staff</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Last Login Sort */}
        <div>
          <select
            value={sortByLogin}
            onChange={(e) => setSortByLogin(e.target.value as 'newest' | 'oldest' | 'never')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
          >
            <option value="newest">Recent Login</option>
            <option value="oldest">Oldest Login</option>
            <option value="never">Never Logged In</option>
          </select>
        </div>
      </div>

      {/* Active Filters & Clear Button */}
      {(roleFilter !== 'All' || statusFilter !== 'All' || searchTerm !== '') && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-blue-800 font-medium">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
              </span>
            )}
            {roleFilter !== 'All' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Role: {roleFilter === 'Reader' ? 'SLRC Staff' : roleFilter}
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Status: {statusFilter}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('All');
              setStatusFilter('All');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Add User Form */}
      {showAddUser && (
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New User</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'Admin' | 'Reader' })}
                className="select-field"
              >
                <option value="Reader">SLRC Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value as 'Active' | 'Inactive' })}
                className="select-field"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 flex space-x-3">
              <button 
                type="submit" 
                className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAddingUser}
              >
                {isAddingUser ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding User...</span>
                  </>
                ) : (
                  <span>Add User</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAddingUser}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User
                </label>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedUser.name}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role
                </label>
                <select
                  value={editingRole}
                  onChange={(e) => setEditingRole(e.target.value as 'Admin' | 'Reader')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Reader">SLRC Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Status
                </label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {(editingRole !== selectedUser.role || editingStatus !== selectedUser.status || editingStatus === 'Inactive') && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    {(editingRole !== selectedUser.role || editingStatus !== selectedUser.status) && (
                      <span className="block mb-2 font-medium">
                        {editingRole !== selectedUser.role && editingStatus !== selectedUser.status && (
                          <>⚠️ Role will be changed to <strong>{editingRole === 'Reader' ? 'SLRC Staff' : 'Admin'}</strong> and status will be set to <strong>{editingStatus}</strong></>
                        )}
                        {editingRole !== selectedUser.role && editingStatus === selectedUser.status && (
                          <>⚠️ Role will be changed to <strong>{editingRole === 'Reader' ? 'SLRC Staff' : 'Admin'}</strong></>
                        )}
                        {editingRole === selectedUser.role && editingStatus !== selectedUser.status && (
                          <>⚠️ Status will be changed to <strong>{editingStatus}</strong></>
                        )}
                      </span>
                    )}
                    {editingStatus === 'Inactive' && (
                      <span className="block">
                        Setting status to Inactive will prevent this user from logging in.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateUser}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
              >
                <Check size={16} />
                <span>
                  Update User
                </span>
              </button>
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card-hover overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{displayRole(user.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className={`${user.last_login ? 'text-gray-900' : 'text-gray-500'}`}>
                          {formatDate(user.last_login)}
                        </div>
                        {user.last_login && (
                          <div className="text-xs text-gray-400">
                            {new Date(user.last_login).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit user status"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{users.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'Active').length}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
          </div>
          <div className="text-sm text-gray-600">Active Today</div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl transform transition-all duration-300 ease-out animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Delete User</h3>
              <button
                onClick={handleCloseDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isDeleting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{deletingUser.name}</div>
                  <div className="text-sm text-gray-500 truncate">{deletingUser.email}</div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700">
                      Deleting this user will permanently remove their account and all associated data from the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemUsers;

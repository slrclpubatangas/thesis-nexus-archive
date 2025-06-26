import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield, User, Mail, Calendar } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
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
  const [showAddUser, setShowAddUser] = useState(false);
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

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    try {
      // First, create the auth user using Supabase Admin API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'TempPassword123!', // You might want to generate a random password
        options: {
          data: {
            full_name: newUser.name
          }
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

      // Now create the system user record with the actual auth user ID
      const { data, error } = await supabase
        .from('system_users')
        .insert([{
          user_id: authData.user.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status
        }])
        .select();

      if (error) {
        console.error('Error adding system user:', error);
        // If system user creation fails, we should clean up the auth user
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
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('system_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

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
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
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
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
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
                onChange={(e) => setNewUser({...newUser, role: e.target.value as 'Admin' | 'Reader'})}
                className="select-field"
              >
                <option value="Reader">Reader</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({...newUser, status: e.target.value as 'Active' | 'Inactive'})}
                className="select-field"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 flex space-x-3">
              <button type="submit" className="btn-primary">
                Add User
              </button>
              <button 
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
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
                      <span className="text-sm text-gray-900">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {formatDate(user.last_login)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
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
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.status === 'Inactive').length}
          </div>
          <div className="text-sm text-gray-600">Inactive Users</div>
        </div>
      </div>
    </div>
  );
};

export default SystemUsers;

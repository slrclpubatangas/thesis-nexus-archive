
import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Shield, User, Mail, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';

const SystemUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'reader',
    status: 'active'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Sample users data - in real app, this would come from Supabase
  const users = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@lpu.edu.ph',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-01-15 10:30 AM',
      created: '2023-01-01'
    },
    {
      id: 2,
      name: 'John Reader',
      email: 'john.reader@lpu.edu.ph',
      role: 'Reader',
      status: 'Active',
      lastLogin: '2024-01-14 2:15 PM',
      created: '2023-06-15'
    },
    {
      id: 3,
      name: 'Sarah Viewer',
      email: 'sarah.viewer@lpu.edu.ph',
      role: 'Reader',
      status: 'Inactive',
      lastLogin: '2024-01-10 9:45 AM',
      created: '2023-09-01'
    },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate role restriction
    if (newUser.role === 'admin' || newUser.role === 'super_admin') {
      toast({
        title: "Access Denied",
        description: "You cannot create additional admin accounts. Only Reader accounts are allowed.",
        variant: "destructive",
      });
      return;
    }

    console.log('Adding new user:', newUser);
    toast({
      title: "Success",
      description: "New user account created successfully.",
    });
    setShowAddUser(false);
    setNewUser({ name: '', email: '', role: 'reader', status: 'active' });
  };

  const handleEditUser = (userId: number) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit?.role === 'Admin' && userToEdit.email !== user?.email) {
      toast({
        title: "Access Denied",
        description: "You cannot edit other admin accounts.",
        variant: "destructive",
      });
      return;
    }
    // Proceed with edit functionality
    console.log('Editing user:', userId);
  };

  const handleDeleteUser = (userId: number) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'Admin') {
      toast({
        title: "Access Denied",
        description: "Admin accounts cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    // Proceed with delete functionality
    console.log('Deleting user:', userId);
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'reader':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super admin':
        return 'bg-red-100 text-red-800';
      case 'reader':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Users</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <button 
          onClick={() => setShowAddUser(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Role Restrictions Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Role Restrictions</h3>
            <p className="text-sm text-amber-700">
              Only one Admin account is allowed. New users can only be assigned the Reader role with limited access permissions.
            </p>
          </div>
        </div>
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
                Full Name
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
                Email Address
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
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="select-field"
                disabled
              >
                <option value="reader">Reader (Read-only Access)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only Reader role is available for new users
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                      {getRoleIcon(user.role)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
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
                      {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditUser(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={user.role === 'Admin' && user.email !== user?.email}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className={`${
                          user.role === 'Admin' 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        disabled={user.role === 'Admin'}
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
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{users.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.role === 'Admin').length}
          </div>
          <div className="text-sm text-gray-600">Admin Users</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'Reader').length}
          </div>
          <div className="text-sm text-gray-600">Reader Users</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'Active').length}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
      </div>
    </div>
  );
};

export default SystemUsers;

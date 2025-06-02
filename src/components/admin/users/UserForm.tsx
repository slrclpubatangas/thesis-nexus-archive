
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface NewUser {
  name: string;
  email: string;
  role: string;
  status: string;
}

interface UserFormProps {
  onUserAdded: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onUserAdded }) => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    role: 'reader',
    status: 'active'
  });
  const { toast } = useToast();

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
    onUserAdded();
  };

  return (
    <>
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
    </>
  );
};

export default UserForm;

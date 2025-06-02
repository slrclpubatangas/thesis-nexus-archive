
import React, { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

interface UserFormProps {
  onUserAdded: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onUserAdded }) => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    role: 'reader',
    status: 'active'
  });
  const { toast } = useToast();
  const { createUser } = useAuth();

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate inputs
      const emailError = validateEmail(newUser.email);
      if (emailError) {
        toast({
          title: "Validation Error",
          description: emailError,
          variant: "destructive",
        });
        return;
      }

      const passwordError = validatePassword(newUser.password);
      if (passwordError) {
        toast({
          title: "Validation Error",
          description: passwordError,
          variant: "destructive",
        });
        return;
      }

      // Validate role restriction
      if (newUser.role === 'admin' || newUser.role === 'super_admin') {
        toast({
          title: "Access Denied",
          description: "You cannot create additional admin accounts. Only Reader accounts are allowed.",
          variant: "destructive",
        });
        return;
      }

      // Create user in Supabase Auth
      await createUser(newUser.email, newUser.password, newUser.name);

      console.log('Adding new user:', newUser);
      toast({
        title: "Success",
        description: `New user account created successfully for ${newUser.name}.`,
      });
      
      // Reset form
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'reader', status: 'active' });
      onUserAdded();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = "Failed to create user account. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = "A user with this email address already exists.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes('Password')) {
          errorMessage = "Password does not meet security requirements.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "User Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
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
                Full Name *
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="input-field"
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input-field pr-10"
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
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
            <div className="md:col-span-2 flex space-x-3">
              <button 
                type="submit" 
                className="btn-primary disabled:opacity-50" 
                disabled={loading}
              >
                {loading ? 'Creating User...' : 'Add User'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowAddUser(false);
                  setNewUser({ name: '', email: '', password: '', role: 'reader', status: 'active' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={loading}
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

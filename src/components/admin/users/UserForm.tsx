
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/use-toast';

interface UserFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'reader'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createUser(formData.email, formData.password, formData.fullName);
      
      toast({
        title: "User Created Successfully",
        description: `${formData.fullName} has been added as a Reader.`,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Failed to Create User",
        description: error.message || "An error occurred while creating the user.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-hover p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New User</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="input-field"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="input-field"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="input-field"
            required
            minLength={6}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            className="select-field"
            disabled={true} // Only Reader role allowed
          >
            <option value="reader">Reader</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Only Reader role is available for new users
          </p>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button 
            type="submit" 
            className="btn-primary flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;

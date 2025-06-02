
import React, { useState, useEffect } from 'react';
import UserForm from './users/UserForm';
import UserTable from './users/UserTable';
import UserSearch from './users/UserSearch';
import UserStats from './users/UserStats';
import RoleRestrictionsNotice from './users/RoleRestrictionsNotice';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  created: string;
}

const SystemUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const formattedUsers: UserData[] = data.map(user => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
        role: user.role === 'admin' ? 'Admin' : 'Reader',
        status: 'Active', // You can add a status field to profiles table if needed
        lastLogin: new Date(user.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        created: new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
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

  const handleUserAdded = () => {
    // Refresh the users list from the database
    console.log('User added, refreshing list...');
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserForm onUserAdded={handleUserAdded} />
      
      <RoleRestrictionsNotice />

      <UserSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <UserTable 
        users={filteredUsers}
        filteredUsers={filteredUsers}
      />

      <UserStats users={users} />
    </div>
  );
};

export default SystemUsers;

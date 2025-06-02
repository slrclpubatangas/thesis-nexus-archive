
import React, { useState } from 'react';
import UserForm from './users/UserForm';
import UserTable from './users/UserTable';
import UserSearch from './users/UserSearch';
import UserStats from './users/UserStats';
import RoleRestrictionsNotice from './users/RoleRestrictionsNotice';

const SystemUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleUserAdded = () => {
    // This would typically refresh the users list from the database
    console.log('User added, refreshing list...');
  };

  return (
    <div className="space-y-6">
      <UserForm onUserAdded={handleUserAdded} />
      
      <RoleRestrictionsNotice />

      <UserSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <UserTable 
        users={users}
        filteredUsers={filteredUsers}
      />

      <UserStats users={users} />
    </div>
  );
};

export default SystemUsers;

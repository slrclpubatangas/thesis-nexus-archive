
import React from 'react';
import RoleBasedDashboard from './RoleBasedDashboard';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // In a real application, you would fetch the user's role from your database
  // For now, we'll assume admin role for authenticated users
  // You can extend this to fetch from a user_roles table in Supabase
  const userRole = 'admin'; // This should come from your user roles system

  return <RoleBasedDashboard userRole={userRole} />;
};

export default AdminDashboard;

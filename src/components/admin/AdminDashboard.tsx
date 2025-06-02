
import React from 'react';
import RoleBasedDashboard from './RoleBasedDashboard';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { userRole } = useAuth();
  
  // Use the role from the auth context, default to 'reader' if not set
  const role = userRole || 'reader';

  return <RoleBasedDashboard userRole={role} />;
};

export default AdminDashboard;

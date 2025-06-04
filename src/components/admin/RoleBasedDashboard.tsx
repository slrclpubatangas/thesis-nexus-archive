
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import ReaderDashboard from './ReaderDashboard';

const RoleBasedDashboard = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Unable to load user profile</p>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  if (profile.role === 'admin') {
    return <AdminDashboard />;
  } else if (profile.role === 'reader') {
    return <ReaderDashboard />;
  }

  // Default fallback for unknown roles
  return <ReaderDashboard />;
};

export default RoleBasedDashboard;

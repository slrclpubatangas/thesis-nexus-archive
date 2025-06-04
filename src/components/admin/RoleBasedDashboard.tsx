
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import ReaderDashboard from './ReaderDashboard';

const RoleBasedDashboard = () => {
  const { profile, loading, user } = useAuth();

  console.log('RoleBasedDashboard - Auth state:', { 
    user: user?.email, 
    profile, 
    loading 
  });

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

  if (!profile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Profile Setup Required
            </h3>
            <p className="text-yellow-700 mb-4">
              Your account ({user.email}) needs a profile setup. Please refresh the page or contact an administrator.
            </p>
            <div className="text-sm text-yellow-600">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 btn-primary"
            >
              Refresh Page
            </button>
          </div>
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

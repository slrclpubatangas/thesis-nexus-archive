
import React, { useState } from 'react';
import Header from '../components/Header';
import SubmissionForm from '../components/SubmissionForm';
import AdminDashboard from '../components/admin/AdminDashboard';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../hooks/useAuth';

const Index = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, session, loading } = useAuth();

  console.log('Index component - Auth state:', { 
    user: user?.email, 
    hasSession: !!session, 
    loading 
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content */}
      {user && session ? (
        <AdminDashboard />
      ) : (
        <SubmissionForm />
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Admin Login Button for Non-Authenticated Users */}
      {!user && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowLoginModal(true)}
            className="btn-primary shadow-lg hover:shadow-xl"
          >
            Admin Login
          </button>
        </div>
      )}
    </div>
  );
};

export default Index;

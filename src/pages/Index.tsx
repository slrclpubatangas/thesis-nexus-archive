import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import SubmissionFormBook from '../components/SubmissionFormBook';
import AdminDashboard from '../components/admin/AdminDashboard';
import LoginModal from '../components/LoginModal';
import LoadingSpinner from '../components/LoadingSpinner';
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
        <LoadingSpinner size={100} message="Loading..." />
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header 
        onAdminLoginClick={() => setShowLoginModal(true)} 
        showAdminLogin={!user}
        enableLogoRedirect={!user && !session}
      />
      
      {/* Main Content */}
      {user && session ? (
        <AdminDashboard />
      ) : (
        <SubmissionFormBook />
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </motion.div>
  );
};

export default Index;

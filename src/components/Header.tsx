import React from 'react';
import { LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import '../App.css';

interface HeaderProps {
  onAdminLoginClick?: () => void;
  showAdminLogin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAdminLoginClick, showAdminLogin }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <img 
              src="https://static.readdy.ai/image/2610098eb4b7d6791c922033875fe1ac/cb8d8ce12e7b02e44cac157a69c7b894.png" 
              alt="New Image Icon" 
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-2xl font-bold text-red-600 typewriter-container">
                <span className="typewriter">UndergradFile</span>
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <button className="btn-secondary flex items-center space-x-2">
              <BookOpen size={16} />
              <span className="hidden sm:inline">Tutorial</span>
            </button>
            {showAdminLogin && (
              <button
                onClick={onAdminLoginClick}
                className="btn-primary flex items-center space-x-2"
              >
                <span>Admin Login</span>
              </button>
            )}
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 hidden sm:inline">
                  Welcome, {user.email}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="btn-primary flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
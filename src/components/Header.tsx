
import React from 'react';
import { LogOut, BookOpen, UserCog } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
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
              src="/lovable-uploads/b34d3c1f-7934-4648-86c4-d87241abefb5.png" 
              alt="LPU Logo" 
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-2xl font-bold text-red-600">UndergradFile</h1>
              <p className="text-sm text-gray-600 hidden sm:block">Undergraduate Research Collection</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <button className="btn-secondary flex items-center space-x-2">
              <BookOpen size={16} />
              <span className="hidden sm:inline">Tutorial</span>
            </button>
            
            {user ? (
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
            ) : (
              <button className="btn-primary flex items-center space-x-2">
                <UserCog size={16} />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

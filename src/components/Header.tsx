import React, { useState, useRef, useEffect } from 'react';
import { LogOut, BookOpen, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LogoutConfirmModal } from './admin/LogoutConfirmModal';
import TutorialModal from './TutorialModal';
import { useNavigate } from 'react-router-dom';
import '../App.css';

interface HeaderProps {
  onAdminLoginClick?: () => void;
  showAdminLogin?: boolean;
  enableLogoRedirect?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAdminLoginClick, showAdminLogin, enableLogoRedirect = false }) => {
  const { user, signOut } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* close menu on outside click */
  useEffect(() => {
    const handleClickOut = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOut);
    return () => document.removeEventListener('mousedown', handleClickOut);
  }, [menuOpen]);

  const handleLogout = async () => {
    setShowLogout(false);
    await signOut();
    navigate('/'); // Redirect to SplashScreen
  };

  const handleLogoClick = () => {
    if (enableLogoRedirect) {
      navigate('/');
    }
  };

  /* helper: first letter upper-case */
  const avatarLetter = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title - Left Side */}
          <div 
            className={`flex items-center space-x-3 ${enableLogoRedirect ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={handleLogoClick}
          >
            <img
              src="https://static.readdy.ai/image/2610098eb4b7d6791c922033875fe1ac/cb8d8ce12e7b02e44cac157a69c7b894.png"
              alt="New Image Icon"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-2xl font-bold text-red-600">
                LyceumVault
              </h1>
            </div>
          </div>

          {/* Navigation - Right Side */}
          <div className="flex items-center space-x-4">
            {!user && (
              <button 
                onClick={() => setShowTutorial(true)}
                className="btn-secondary flex items-center space-x-2 px-4 py-2 min-w-[100px] justify-center"
              >
                <BookOpen size={16} />
                <span className="hidden sm:inline">Tutorial</span>
              </button>
            )}

            {showAdminLogin && !user && (
              <button
                onClick={onAdminLoginClick}
                className="btn-primary flex items-center space-x-2 px-4 py-2 min-w-[100px] justify-center"
              >
                <User size={16} />
                <span>Login</span>
              </button>
            )}

            {user && (
              <div className="relative" ref={menuRef}>
                {/* Avatar Circle */}
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="w-10 h-10 rounded-full bg-red-600 text-white font-bold text-lg flex items-center justify-center select-none cursor-pointer ring-2 ring-transparent hover:ring-red-400 transition-all"
                  aria-label="User menu"
                >
                  {avatarLetter}
                </button>

                {/* Dropdown menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-[60]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        /* open change-password modal */
                        window.dispatchEvent(new CustomEvent('openChangePassword'));
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span>Change Password</span>
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowLogout(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutConfirmModal
        open={showLogout}
        onOpenChange={setShowLogout}
        onConfirm={handleLogout}
      />
      
      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </header>
  );
};

export default Header;
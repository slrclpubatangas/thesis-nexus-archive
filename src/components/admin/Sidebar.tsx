import React from 'react';
import { BarChart3, Users, FileText, Settings, GraduationCap, RefreshCw } from 'lucide-react';
import ClickSpark from '../ClickSpark';

type TabType = 'statistics' | 'records' | 'thesis' | 'students' | 'users';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  requiredRole: 'Admin' | null;
}

interface SidebarProps {
  activeTab: TabType;
  userRole: 'Admin' | 'Viewer' | null;
  isRefreshing: boolean;
  onTabClick: (tabId: TabType) => void;
  tabs: Tab[];
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  userRole,
  isRefreshing,
  onTabClick,
  tabs,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  // Filter tabs based on user role
  const availableTabs = tabs.filter(tab =>
    !tab.requiredRole || userRole === 'Admin'
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span
            className={`block h-0.5 w-full bg-gray-800 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
          />
          <span
            className={`block h-0.5 w-full bg-gray-800 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
          />
          <span
            className={`block h-0.5 w-full bg-gray-800 rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
          />
        </div>
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] 
          bg-white border-r border-gray-200 shadow-sm
          transition-all duration-500 ease-in-out z-40
          lg:top-16 lg:h-[calc(100vh-4rem)]
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
          ${!isMobileMenuOpen && isCollapsed ? 'lg:w-16' : 'lg:w-64'}
          lg:translate-x-0
        `}
      >
        <ClickSpark sparkColor="#dc2626" sparkSize={8} sparkRadius={12} sparkCount={6} duration={350}>
          <div className="flex flex-col h-full">
            {/* Header with Logo and Toggle Button - Desktop Only */}
            <div className="hidden lg:flex items-center p-3 pb-2 gap-2">
              {/* Logo - Always visible, clickable to expand when collapsed */}
              <button
                onClick={() => isCollapsed && setIsCollapsed(false)}
                className={`flex-shrink-0 hover:bg-gray-100 rounded-lg p-2 transition-all ${isCollapsed ? 'cursor-pointer' : 'cursor-default pointer-events-none'
                  }`}
                aria-label={isCollapsed ? "Expand sidebar" : ""}
                disabled={!isCollapsed}
              >
                <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Sidebar Toggle Button - ChatGPT Style - Only show when expanded */}
              {!isCollapsed && (
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="ml-auto flex-shrink-0 size-10 grid place-items-center hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-all duration-300 opacity-0 animate-fadeIn"
                  style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
                  aria-label="Collapse sidebar"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" className="text-gray-700" />
                    <path d="M9 3v18" className="text-gray-700" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sidebar Header - Only show if Viewer role and not collapsed */}
            {userRole === 'Viewer' && !isCollapsed && (
              <div className="px-4 pb-3 pt-0 border-b border-gray-200 lg:block hidden">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                  SLRC Staff Access
                </span>
              </div>
            )}

            {/* Viewer badge always visible on mobile */}
            {userRole === 'Viewer' && (
              <div className="p-4 border-b border-gray-200 lg:hidden">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  SLRC Staff Access
                </span>
              </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto p-3 pt-3">
              <ul className="space-y-2">
                {availableTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <li key={tab.id}>
                      <button
                        onClick={() => {
                          onTabClick(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isRefreshing}
                        className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-lg
                        font-medium text-sm transition-all duration-200
                        group relative overflow-hidden
                        ${isActive
                            ? 'bg-red-50 text-red-600 shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        ${isRefreshing && isActive ? 'opacity-70 cursor-not-allowed' : ''}
                      `}
                        title={isActive ? `Click to refresh ${tab.label}` : `Switch to ${tab.label}`}
                      >
                        <Icon
                          size={20}
                          className={`
                          shrink-0
                          ${isActive ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-700'}
                          ${isRefreshing && isActive ? 'animate-pulse' : ''}
                        `}
                        />
                        <span
                          className={`
                          flex-1 text-left whitespace-nowrap transition-opacity duration-300
                          ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'lg:opacity-100'}
                        `}
                        >
                          {tab.label}
                        </span>

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600 rounded-l-full" />
                        )}

                        {/* Refresh icon on hover - only show when expanded */}
                        {isActive && !isCollapsed && (
                          <RefreshCw
                            size={14}
                            className={`
                            shrink-0
                            text-gray-400 group-hover:text-red-500 
                            transition-all duration-200 opacity-0 group-hover:opacity-100
                            ${isRefreshing ? 'animate-spin opacity-100' : ''}
                          `}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className={`text-xs text-gray-500 transition-all duration-300 ${isCollapsed ? 'lg:text-center' : 'text-center'
                }`}>
                {!isCollapsed && (
                  <p className="opacity-0 animate-fadeIn" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>Admin Dashboard</p>
                )}
                <p className={`${isCollapsed ? 'lg:mt-0' : 'mt-1'
                  }`}>© 2025{isCollapsed ? '' : <span className="opacity-0 animate-fadeIn" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}> LyceumVault</span>}</p>
              </div>
            </div>
          </div>
        </ClickSpark>
      </aside>
    </>
  );
};

export default Sidebar;

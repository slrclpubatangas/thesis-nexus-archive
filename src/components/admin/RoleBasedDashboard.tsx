
import React, { useState } from 'react';
import { BarChart3, Users, FileText, Settings } from 'lucide-react';
import StatisticsTab from './StatisticsTab';
import UserRecords from './UserRecords';
import ThesisData from './ThesisData';
import SystemUsers from './SystemUsers';
import { useAuth } from '../../hooks/useAuth';

type TabType = 'statistics' | 'records' | 'thesis' | 'users';

interface RoleBasedDashboardProps {
  userRole?: string;
}

const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ userRole = 'admin' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const { user } = useAuth();

  // Define tabs based on user role
  const getAvailableTabs = () => {
    const allTabs = [
      { id: 'statistics' as TabType, label: 'Statistics', icon: BarChart3, roles: ['admin', 'reader'] },
      { id: 'records' as TabType, label: 'User Records', icon: Users, roles: ['admin', 'reader'] },
      { id: 'thesis' as TabType, label: 'Thesis Data', icon: FileText, roles: ['admin'] },
      { id: 'users' as TabType, label: 'System Users', icon: Settings, roles: ['admin'] },
    ];

    return allTabs.filter(tab => tab.roles.includes(userRole.toLowerCase()));
  };

  const availableTabs = getAvailableTabs();

  // Ensure active tab is available for the user's role
  React.useEffect(() => {
    if (!availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab('statistics');
    }
  }, [userRole, availableTabs, activeTab]);

  const renderContent = () => {
    // Check if user has access to the current tab
    const currentTab = availableTabs.find(tab => tab.id === activeTab);
    if (!currentTab) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Access Denied</div>
          <p className="text-gray-400 mt-2">You don't have permission to view this section.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'statistics':
        return <StatisticsTab />;
      case 'records':
        return <UserRecords />;
      case 'thesis':
        return userRole.toLowerCase() === 'admin' ? <ThesisData /> : null;
      case 'users':
        return userRole.toLowerCase() === 'admin' ? <SystemUsers /> : null;
      default:
        return <StatisticsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {userRole.toLowerCase() === 'admin' ? 'Admin Dashboard' : 'Reader Dashboard'}
          </h1>
          <p className="text-gray-600">
            {userRole.toLowerCase() === 'admin' 
              ? 'Manage thesis submissions and system administration'
              : 'View thesis statistics and user records'
            }
          </p>
          {userRole.toLowerCase() === 'reader' && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Read-only Access
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {availableTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default RoleBasedDashboard;

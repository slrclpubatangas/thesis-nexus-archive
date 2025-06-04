
import React, { useState } from 'react';
import { BarChart3, Users } from 'lucide-react';
import StatisticsTab from './StatisticsTab';
import UserRecords from './UserRecords';

type TabType = 'statistics' | 'records';

const ReaderDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');

  const tabs = [
    { id: 'statistics' as TabType, label: 'Statistics', icon: BarChart3 },
    { id: 'records' as TabType, label: 'User Records', icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'statistics':
        return <StatisticsTab />;
      case 'records':
        return <UserRecords />;
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
            Reader Dashboard
          </h1>
          <p className="text-gray-600">
            View thesis statistics and user records
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
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

export default ReaderDashboard;

import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Users, FileText, Settings, Download, Filter, RefreshCw, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '../LoadingSpinner';
import StatisticsTab from './StatisticsTab';
import UserRecords from './UserRecords';
import ThesisData from './ThesisData';
import SystemUsers from './SystemUsers';
import StudentData from './StudentData';
import Sidebar from './Sidebar';

type TabType = 'statistics' | 'records' | 'thesis' | 'students' | 'users';

interface UserRole {
  role: 'Admin' | 'Reader';
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Restore active tab from sessionStorage after refresh
    const savedTab = sessionStorage.getItem('adminActiveTab');
    return (savedTab as TabType) || 'statistics';
  });
  const [userRole, setUserRole] = useState<'Admin' | 'Reader' | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const roleCheckedRef = useRef(false);

  // Fetch user role from system_users table
  useEffect(() => {
    const fetchUserRole = async () => {
      // Don't fetch if already checked or user is not available
      if (roleCheckedRef.current || !user || authLoading) {
        return;
      }

      console.log('Fetching user role for user:', user.id);
      setRoleLoading(true);
      roleCheckedRef.current = true;

      try {
        const { data, error } = await supabase
          .from('system_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('status', 'Active')
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          toast({
            title: "Error",
            description: "Failed to fetch user permissions",
            variant: "destructive",
          });
          setUserRole('Reader'); // Default fallback
          return;
        }

        if (!data) {
          // User not found in system_users table - check if they have a profile with reader role
          console.log('User not found in system_users, checking profiles table...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          }

          // Default to Reader role if user exists in auth but not in system_users
          const defaultRole = profileData?.role === 'admin' ? 'Admin' : 'Reader';
          console.log('Setting default role:', defaultRole);
          setUserRole(defaultRole);
        } else {
          console.log('User role found:', data.role);
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Default to Reader role on any error to allow basic access
        setUserRole('Reader');
      } finally {
        setRoleLoading(false);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, authLoading, toast]);

  // Reset role check when user changes
  useEffect(() => {
    if (!user) {
      roleCheckedRef.current = false;
      setUserRole(null);
      setRoleLoading(true);
      setLoading(true);
    }
  }, [user]);

  const tabs = [
    { id: 'statistics' as TabType, label: 'Statistics', icon: BarChart3, requiredRole: null }, // Available to all
    { id: 'records' as TabType, label: 'User Records', icon: Users, requiredRole: null }, // Available to all
    { id: 'thesis' as TabType, label: 'Thesis Data', icon: FileText, requiredRole: 'Admin' }, // Admin only
    { id: 'students' as TabType, label: 'Student Data', icon: GraduationCap, requiredRole: 'Admin' }, // Admin only
    { id: 'users' as TabType, label: 'System Users', icon: Settings, requiredRole: 'Admin' }, // Admin only
  ];

  // Save active tab to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // Check if we just refreshed and show toast
  useEffect(() => {
    const justRefreshed = sessionStorage.getItem('adminJustRefreshed');
    if (justRefreshed === 'true') {
      const tabLabel = tabs.find(t => t.id === activeTab)?.label || 'Tab';
      toast({
        title: "Refreshed",
        description: `${tabLabel} data has been refreshed`,
      });
      sessionStorage.removeItem('adminJustRefreshed');
    }
  }, []);

  // Function to handle tab click with refresh
  const handleTabClick = (tabId: TabType) => {
    // If clicking on the already active tab, refresh the page
    if (activeTab === tabId) {
      console.log(`Refreshing ${tabId} tab...`);
      setIsRefreshing(true);
      
      // Show toast notification
      toast({
        title: "Refreshing",
        description: `Refreshing ${tabs.find(t => t.id === tabId)?.label || 'tab'} data...`,
      });
      
      // Save state before refresh
      sessionStorage.setItem('adminActiveTab', tabId);
      sessionStorage.setItem('adminJustRefreshed', 'true');
      
      // Use a smooth page refresh
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } else {
      // Otherwise, just switch to the new tab
      setActiveTab(tabId);
    }
  };

  // Filter tabs based on user role
  const availableTabs = tabs.filter(tab => 
    !tab.requiredRole || userRole === 'Admin'
  );

  // Redirect to statistics if current tab is not available for user role
  useEffect(() => {
    if (userRole && userRole !== 'Admin') {
      const currentTab = tabs.find(tab => tab.id === activeTab);
      if (currentTab?.requiredRole === 'Admin') {
        setActiveTab('statistics');
      }
    }
  }, [userRole, activeTab]);

  const renderContent = () => {
    // Check if user has permission for current tab
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab?.requiredRole === 'Admin' && userRole !== 'Admin') {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <Settings size={48} className="mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-500">You don't have permission to access this section.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'statistics':
        return <StatisticsTab userRole={userRole} />;
      case 'records':
        return <UserRecords userRole={userRole} />;
      case 'thesis':
        return <ThesisData />;
      case 'students':
        return <StudentData />;
      case 'users':
        return <SystemUsers />;
      default:
        return <StatisticsTab userRole={userRole} />;
    }
  };

  // Show loading if auth is still loading or role is being fetched
  if (authLoading || loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size={100} message="Loading dashboard..." />
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Settings size={48} className="mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        userRole={userRole}
        isRefreshing={isRefreshing}
        onTabClick={handleTabClick}
        tabs={tabs}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 mt-16 lg:mt-0">
          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

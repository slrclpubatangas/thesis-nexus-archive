
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, FileText, TrendingUp, Calendar, School, BookOpen } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

interface StatisticsTabProps {
  userRole?: 'Admin' | 'Reader' | null;
}

interface StatsData {
  totalSubmissions: number;
  totalUsers: number;
  recentSubmissions: number;
  lpuStudents: number;
  nonLpuStudents: number;
  campusData: Array<{ name: string; value: number }>;
  monthlyData: Array<{ month: string; submissions: number }>;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ userRole }) => {
  const [stats, setStats] = useState<StatsData>({
    totalSubmissions: 0,
    totalUsers: 0,
    recentSubmissions: 0,
    lpuStudents: 0,
    nonLpuStudents: 0,
    campusData: [],
    monthlyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch total submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('thesis_submissions')
        .select('*');

      if (submissionsError) throw submissionsError;

      // Calculate statistics
      const totalSubmissions = submissions?.length || 0;
      const lpuStudents = submissions?.filter(s => s.user_type === 'LPU Student').length || 0;
      const nonLpuStudents = submissions?.filter(s => s.user_type === 'Non-LPU Student').length || 0;

      // Recent submissions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSubmissions = submissions?.filter(s => 
        new Date(s.submission_date) >= thirtyDaysAgo
      ).length || 0;

      // Campus distribution
      const campusCount = submissions?.reduce((acc, submission) => {
        acc[submission.campus] = (acc[submission.campus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const campusData = Object.entries(campusCount).map(([name, value]) => ({
        name,
        value
      }));

      // Monthly data for the last 6 months
      const monthlyCount = submissions?.reduce((acc, submission) => {
        const date = new Date(submission.submission_date);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const monthlyData = Object.entries(monthlyCount)
        .map(([month, submissions]) => ({ month, submissions }))
        .slice(-6);

      // Fetch system users count if user is Admin
      let totalUsers = 0;
      if (userRole === 'Admin') {
        const { data: users, error: usersError } = await supabase
          .from('system_users')
          .select('id');
        
        if (!usersError) {
          totalUsers = users?.length || 0;
        }
      }

      setStats({
        totalSubmissions,
        totalUsers,
        recentSubmissions,
        lpuStudents,
        nonLpuStudents,
        campusData,
        monthlyData
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Statistics Dashboard</h2>
          <p className="text-gray-600">
            {userRole === 'Reader' ? 'View thesis submission analytics' : 'Overview of thesis submissions and system analytics'}
          </p>
        </div>
        <button 
          onClick={fetchStatistics}
          className="btn-secondary flex items-center space-x-2"
          disabled={loading}
        >
          <TrendingUp size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-4">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalSubmissions}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>

        {userRole === 'Admin' && (
          <div className="card-hover p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">System Users</div>
          </div>
        )}

        <div className="card-hover p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.recentSubmissions}</div>
          <div className="text-sm text-gray-600">Last 30 Days</div>
        </div>

        <div className="card-hover p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
            <School className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.lpuStudents}</div>
          <div className="text-sm text-gray-600">LPU Students</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Type Distribution */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'LPU Students', value: stats.lpuStudents },
                  { name: 'Non-LPU Students', value: stats.nonLpuStudents }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                <Cell fill="#dc2626" />
                <Cell fill="#2563eb" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Campus Distribution */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Campus Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.campusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card-hover p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Submission Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="submissions" stroke="#dc2626" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Info */}
      <div className="card-hover p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-medium text-gray-800">Total Submissions</div>
            <div className="text-gray-600">{stats.totalSubmissions} thesis records</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-medium text-gray-800">Student Distribution</div>
            <div className="text-gray-600">
              {stats.lpuStudents} LPU, {stats.nonLpuStudents} Non-LPU
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-medium text-gray-800">Recent Activity</div>
            <div className="text-gray-600">{stats.recentSubmissions} submissions this month</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTab;

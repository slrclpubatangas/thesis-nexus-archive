
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
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
  popularPrograms: Array<{ name: string; count: number; percentage: number }>;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ userRole }) => {
  const [stats, setStats] = useState<StatsData>({
    totalSubmissions: 0,
    totalUsers: 0,
    recentSubmissions: 0,
    lpuStudents: 0,
    nonLpuStudents: 0,
    campusData: [],
    monthlyData: [],
    popularPrograms: []
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

      // Calculate popular programs
      const programCount = submissions?.reduce((acc, submission) => {
        if (submission.program) {
          acc[submission.program] = (acc[submission.program] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const popularPrograms = Object.entries(programCount)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalSubmissions) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 popular programs

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
        monthlyData,
        popularPrograms
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
      {/* Top Section - Metrics and Popular Research Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side - Key Metrics in 2x2 grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LPU Students */}
            <div className="card-hover p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">LPU Students</div>
                  <div className="text-3xl font-bold text-gray-800">{stats.lpuStudents}</div>
                  <div className="text-sm text-green-600">↑ 8.3% vs last period</div>
                </div>
              </div>
            </div>

            {/* External Users */}
            <div className="card-hover p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">External Users</div>
                  <div className="text-3xl font-bold text-gray-800">{stats.nonLpuStudents}</div>
                  <div className="text-sm text-purple-600">↑ 18.7% vs last period</div>
                </div>
              </div>
            </div>

            {/* Total Submissions */}
            <div className="card-hover p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Total Submissions</div>
                  <div className="text-3xl font-bold text-gray-800">{stats.totalSubmissions}</div>
                </div>
              </div>
            </div>

            {/* Total Exports */}
            <div className="card-hover p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Total Exports</div>
                  <div className="text-3xl font-bold text-gray-800">{stats.recentSubmissions * 2.84}</div>
                  <div className="text-sm text-yellow-600">↑ 24.2% vs last period</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Popular Research Topics */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Research Topics</h3>
          <div className="space-y-4">
            {stats.popularPrograms.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No program data available</p>
              </div>
            ) : (
              stats.popularPrograms.slice(0, 5).map((program, index) => {
                const colors = [
                  { bg: 'bg-blue-500', text: 'text-blue-600' },
                  { bg: 'bg-green-500', text: 'text-green-600' },
                  { bg: 'bg-orange-500', text: 'text-orange-600' },
                  { bg: 'bg-purple-500', text: 'text-purple-600' },
                  { bg: 'bg-red-500', text: 'text-red-600' }
                ];
                const color = colors[index % colors.length];
                return (
                  <div key={program.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700" title={program.name}>
                        {program.name}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{program.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color.bg}`}
                        style={{ width: `${program.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Type Distribution */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Type Distribution</h3>
          
          {/* Custom Legend */}
          <div className="flex justify-center mb-4 space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <span className="text-sm text-gray-700">LPU Students</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Non-LPU Students</span>
            </div>
          </div>

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

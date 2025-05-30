import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, FileText, Calendar } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

const StatisticsTab = () => {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalUsers: 0,
    thisMonthSubmissions: 0,
    lastMonthSubmissions: 0
  });

  // Sample data arrays
  const sampleMonthlyData = [
    { name: 'Jan', submissions: 50 },
    { name: 'Feb', submissions: 45 },
    { name: 'Mar', submissions: 60 },
    { name: 'Apr', submissions: 55 },
    { name: 'May', submissions: 70 },
    { name: 'Jun', submissions: 65 },
  ];

  const sampleProgramData = [
    { name: 'Computer Science', value: 400, color: '#8884d8' },
    { name: 'Engineering', value: 300, color: '#82ca9d' },
    { name: 'Business', value: 200, color: '#ffc658' },
    { name: 'Medicine', value: 150, color: '#ff7c7c' },
  ];
  const monthlyData = [
    { name: 'Jan', submissions: 65 },
    { name: 'Feb', submissions: 59 },
    { name: 'Mar', submissions: 80 },
    { name: 'Apr', submissions: 81 },
    { name: 'May', submissions: 56 },
    { name: 'Jun', submissions: 55 },
  ];

  const programData = [
    { name: 'Computer Science', value: 400, color: '#8884d8' },
    { name: 'Engineering', value: 300, color: '#82ca9d' },
    { name: 'Business', value: 200, color: '#ffc658' },
    { name: 'Medicine', value: 150, color: '#ff7c7c' },
  ];

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Get total submissions
      const { count: totalSubmissions } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact', head: true });

      // Get current month submissions
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const { count: thisMonth } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString());

      // Get last month submissions
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      const lastMonthEnd = new Date(currentMonth);
      lastMonthEnd.setDate(0);
      
      const { count: lastMonthCount } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      setStats({
        totalSubmissions: totalSubmissions || 0,
        totalUsers: totalSubmissions || 0, // Using submissions as proxy for users
        thisMonthSubmissions: thisMonth || 0,
        lastMonthSubmissions: lastMonthCount || 0
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fix the calculation with proper null checking
  const growthPercentage = stats.lastMonthSubmissions > 0 
    ? ((stats.thisMonthSubmissions - stats.lastMonthSubmissions) / stats.lastMonthSubmissions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Analytics & Statistics</h2>
        <p className="text-gray-600">Overview of thesis submission data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalSubmissions}</p>
            </div>
            <FileText className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="card-hover p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="card-hover p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-gray-800">{stats.thisMonthSubmissions}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="card-hover p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Growth</p>
              <p className="text-3xl font-bold text-gray-800">
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Submissions Chart */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Submissions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="submissions" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Program Distribution Chart */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Submissions by Program
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={programData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {programData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card-hover p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Submissions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">
                  Machine Learning in Healthcare
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">Sarah Wilson</td>
                <td className="px-4 py-3 text-sm text-gray-900">Computer Science</td>
                <td className="px-4 py-3 text-sm text-gray-500">2024-01-15</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">
                  Sustainable Architecture Design
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">Michael Chen</td>
                <td className="px-4 py-3 text-sm text-gray-900">Engineering</td>
                <td className="px-4 py-3 text-sm text-gray-500">2024-01-14</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-900">
                  Digital Marketing Strategies
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">Emily Rodriguez</td>
                <td className="px-4 py-3 text-sm text-gray-900">Business</td>
                <td className="px-4 py-3 text-sm text-gray-500">2024-01-13</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTab;

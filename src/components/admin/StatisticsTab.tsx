
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const StatisticsTab = () => {
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalTheses: 0,
    lpuStudents: 0,
    nonLpuStudents: 0
  });

  const [submissionTrends, setSubmissionTrends] = useState([]);
  const [popularTopics, setPopularTopics] = useState([]);
  const [userDistribution, setUserDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStatistics();
    fetchSubmissionTrends();
    fetchPopularTopics();
    fetchUserDistribution();
    fetchRecentActivity();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Fetch total submissions
      const { count: totalSubmissions } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact', head: true });

      // Fetch total theses
      const { count: totalTheses } = await supabase
        .from('thesis_data')
        .select('*', { count: 'exact', head: true });

      // Fetch LPU students count
      const { count: lpuStudents } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'LPU Student');

      // Fetch Non-LPU students count
      const { count: nonLpuStudents } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', 'Non-LPU Student');

      setStats({
        totalSubmissions: totalSubmissions || 0,
        totalTheses: totalTheses || 0,
        lpuStudents: lpuStudents || 0,
        nonLpuStudents: nonLpuStudents || 0
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchSubmissionTrends = async () => {
    try {
      const { data } = await supabase
        .from('thesis_submissions')
        .select('submission_date')
        .order('submission_date', { ascending: true });

      if (data) {
        // Group by month
        const monthlyData = data.reduce((acc, submission) => {
          const month = new Date(submission.submission_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
          });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        const trends = Object.entries(monthlyData).map(([month, count]) => ({
          month,
          submissions: count
        }));

        setSubmissionTrends(trends);
      }
    } catch (error) {
      console.error('Error fetching submission trends:', error);
    }
  };

  const fetchPopularTopics = async () => {
    try {
      const { data } = await supabase
        .from('thesis_data')
        .select('department');

      if (data) {
        const departmentCounts = data.reduce((acc, thesis) => {
          acc[thesis.department] = (acc[thesis.department] || 0) + 1;
          return acc;
        }, {});

        const topics = Object.entries(departmentCounts)
          .map(([department, count]) => ({
            department,
            count: count as number
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setPopularTopics(topics);
      }
    } catch (error) {
      console.error('Error fetching popular topics:', error);
    }
  };

  const fetchUserDistribution = async () => {
    try {
      const { data } = await supabase
        .from('thesis_submissions')
        .select('user_type, campus');

      if (data) {
        const distribution = data.reduce((acc, submission) => {
          const key = `${submission.user_type} - ${submission.campus}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(distribution).map(([category, count]) => ({
          category,
          count: count as number
        }));

        setUserDistribution(chartData);
      }
    } catch (error) {
      console.error('Error fetching user distribution:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('thesis_submissions')
        .select('full_name, thesis_title, submission_date, user_type')
        .order('submission_date', { ascending: false })
        .limit(5);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-gray-800 font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-gray-600" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex justify-center flex-wrap gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className="text-sm text-gray-600">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.totalSubmissions}</div>
            <p className="text-xs text-blue-600 mt-1">
              User record submissions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Theses</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.totalTheses}</div>
            <p className="text-xs text-green-600 mt-1">
              In database collection
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">LPU Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{stats.lpuStudents}</div>
            <p className="text-xs text-purple-600 mt-1">
              Internal users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">External Users</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{stats.nonLpuStudents}</div>
            <p className="text-xs text-orange-600 mt-1">
              Non-LPU students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submission Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Submission Trends
            </CardTitle>
            <CardDescription>
              Monthly submission patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Line 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                  name="Submissions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Research Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Popular Research Topics
            </CardTitle>
            <CardDescription>
              Most active research departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularTopics} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="department" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Bar 
                  dataKey="count" 
                  fill="#22c55e"
                  radius={[0, 4, 4, 0]}
                  name="Thesis Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              User Distribution
            </CardTitle>
            <CardDescription>
              User types and campus distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  content={(props) => (
                    <div className="mt-4">
                      <div className="grid grid-cols-1 gap-2">
                        {userDistribution.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></span>
                            <span className="text-gray-600 truncate">{entry.category} ({entry.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest thesis submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.full_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.thesis_title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {activity.user_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.submission_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsTab;

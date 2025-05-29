import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, FileText, Calendar } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

const StatisticsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    activeUsers: 0,
    thisMonth: 0,
    growthRate: 0,
    submissionTrends: [],
    userDistribution: [],
    programDistribution: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get total submissions
      const { count: totalCount } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact' });

      // Get this month's submissions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: monthlyCount } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact' })
        .gte('submission_date', startOfMonth.toISOString());

      // Get last month's submissions for growth rate
      const startOfLastMonth = new Date(startOfMonth);
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      
      const { count: lastMonthCount } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact' })
        .gte('submission_date', startOfLastMonth.toISOString())
        .lt('submission_date', startOfMonth.toISOString());

      // Calculate growth rate
      const growthRate = lastMonthCount ? ((monthlyCount - lastMonthCount) / lastMonthCount) * 100 : 0;

      // Get submission trends (last 6 months)
      const trends = [];
      for (let i = 5; i >= 0; i--) {
        const start = new Date();
        start.setMonth(start.getMonth() - i);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const { count } = await supabase
          .from('thesis_submissions')
          .select('*', { count: 'exact' })
          .gte('submission_date', start.toISOString())
          .lt('submission_date', end.toISOString());

        trends.push({
          month: start.toLocaleString('default', { month: 'short' }),
          submissions: count
        });
      }

      // Get user distribution
      const { data: userTypeData } = await supabase
        .from('thesis_submissions')
        .select('user_type');

      const lpuCount = userTypeData?.filter(item => item.user_type === 'LPU Student').length || 0;
      const nonLpuCount = userTypeData?.filter(item => item.user_type === 'Non-LPU Student').length || 0;

      // Get program distribution
      const { data: programData } = await supabase
        .from('thesis_submissions')
        .select('program');

      const programCounts = {};
      programData?.forEach(item => {
        if (item.program) {
          programCounts[item.program] = (programCounts[item.program] || 0) + 1;
        }
      });

      const programDistribution = Object.entries(programCounts)
        .map(([program, count]) => ({
          program,
          count
        }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalSubmissions: totalCount || 0,
        activeUsers: totalCount || 0, // For now, using total count as active users
        thisMonth: monthlyCount || 0,
        growthRate,
        submissionTrends: trends,
        userDistribution: [
          { name: 'LPU Students', value: lpuCount, color: '#DC2626' },
          { name: 'Non-LPU Students', value: nonLpuCount, color: '#2563EB' }
        ],
        programDistribution
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: 'Total Submissions',
      value: stats.totalSubmissions.toLocaleString(),
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '+8%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'This Month',
      value: stats.thisMonth.toLocaleString(),
      change: `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Growth Rate',
      value: `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
      change: 'vs last month',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card-hover p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submission Trends */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Submission Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.submissionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="submissions" 
                stroke="#DC2626" 
                strokeWidth={3}
                dot={{ fill: '#DC2626' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.userDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.userDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Program Distribution */}
        <div className="card-hover p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Submissions by Program
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.programDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="program" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTab;
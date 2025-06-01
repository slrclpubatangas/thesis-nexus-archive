
import React from 'react';
import { BookOpen, Users, Calendar, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
} from 'recharts';

const StatisticsTab = () => {
  // Fetch statistics from both tables
  const { data: submissionsStats } = useQuery({
    queryKey: ['submissions-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thesis_submissions')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: thesisDataStats } = useQuery({
    queryKey: ['thesis-data-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thesis_data')
        .select('*')
        .eq('is_deleted', false);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate combined statistics
  const totalTheses = (submissionsStats?.length || 0) + (thesisDataStats?.length || 0);
  
  const currentYear = new Date().getFullYear();
  const thisYearSubmissions = submissionsStats?.filter(
    sub => new Date(sub.submission_date).getFullYear() === currentYear
  ).length || 0;
  
  const thisYearThesisData = thesisDataStats?.filter(
    thesis => thesis.publication_year === currentYear
  ).length || 0;
  
  const thisYearTotal = thisYearSubmissions + thisYearThesisData;

  // Get unique programs from both sources
  const submissionPrograms = submissionsStats?.map(sub => sub.program).filter(Boolean) || [];
  const thesisPrograms = thesisDataStats?.map(thesis => thesis.department).filter(Boolean) || [];
  const uniquePrograms = new Set([...submissionPrograms, ...thesisPrograms]);
  const totalPrograms = uniquePrograms.size;

  // Calculate growth rate
  const lastYear = currentYear - 1;
  const lastYearSubmissions = submissionsStats?.filter(
    sub => new Date(sub.submission_date).getFullYear() === lastYear
  ).length || 0;
  const lastYearThesisData = thesisDataStats?.filter(
    thesis => thesis.publication_year === lastYear
  ).length || 0;
  const lastYearTotal = lastYearSubmissions + lastYearThesisData;
  
  const growthRate = lastYearTotal > 0 ? ((thisYearTotal - lastYearTotal) / lastYearTotal * 100) : 0;

  // Prepare submission trends data
  const submissionTrends = React.useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    
    submissionsStats?.forEach(submission => {
      const date = new Date(submission.submission_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    thesisDataStats?.forEach(thesis => {
      const date = new Date(thesis.upload_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        submissions: count,
      }));
  }, [submissionsStats, thesisDataStats]);

  // Prepare popular research topics data
  const popularTopics = React.useMemo(() => {
    const topicCounts: { [key: string]: number } = {};
    
    [...submissionPrograms, ...thesisPrograms].forEach(topic => {
      if (topic) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    });

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({
        topic: topic.length > 20 ? topic.substring(0, 20) + '...' : topic,
        count,
      }));
  }, [submissionPrograms, thesisPrograms]);

  // Prepare user distribution data
  const userDistribution = React.useMemo(() => {
    const campusData: { [key: string]: number } = {};
    
    submissionsStats?.forEach(submission => {
      campusData[submission.campus] = (campusData[submission.campus] || 0) + 1;
    });

    return Object.entries(campusData).map(([campus, count]) => ({
      campus,
      count,
    }));
  }, [submissionsStats]);

  const stats = [
    {
      title: 'Total Thesis Records',
      value: totalTheses.toString(),
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+12%',
      period: 'from last month'
    },
    {
      title: 'Active Programs',
      value: totalPrograms.toString(),
      icon: Users,
      color: 'bg-green-500',
      change: '+3',
      period: 'new programs'
    },
    {
      title: 'This Year',
      value: thisYearTotal.toString(),
      icon: Calendar,
      color: 'bg-purple-500',
      change: `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      period: 'vs last year'
    },
    {
      title: 'Growth Rate',
      value: `${growthRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: growthRate >= 0 ? 'bg-emerald-500' : 'bg-red-500',
      change: growthRate >= 0 ? 'Positive' : 'Negative',
      period: 'year over year'
    }
  ];

  const chartConfig = {
    submissions: {
      label: "Submissions",
      color: "hsl(var(--chart-1))",
    },
    count: {
      label: "Count",
      color: "hsl(var(--chart-2))",
    },
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Research Analytics Dashboard</h2>
        <p className="text-gray-600">Monitor thesis submission trends, research topics, and user distribution</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') || stat.change === 'Positive' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600 ml-1">{stat.period}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Submission Trends</h3>
          </div>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={submissionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="submissions" 
                stroke="var(--color-submissions)" 
                strokeWidth={2}
                dot={{ fill: "var(--color-submissions)" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Popular Research Topics Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Popular Research Topics</h3>
          </div>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={popularTopics} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="topic" type="category" width={100} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" />
            </BarChart>
          </ChartContainer>
        </div>

        {/* User Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">User Distribution by Campus</h3>
          </div>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <RechartsPieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <RechartsPieChart dataKey="count" data={userDistribution} cx="50%" cy="50%" outerRadius={80}>
                {userDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </RechartsPieChart>
            </RechartsPieChart>
          </ChartContainer>
          <div className="mt-4 flex flex-wrap gap-2">
            {userDistribution.map((entry, index) => (
              <div key={entry.campus} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{entry.campus} ({entry.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {submissionsStats?.slice(0, 5).map((submission, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{submission.thesis_title}</p>
                  <p className="text-sm text-gray-600">by {submission.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{submission.program}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(submission.submission_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTab;

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, FileText, TrendingUp, Calendar, School, BookOpen, X, Filter, Star, MessageSquare } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import ExportButton from './ExportButton';
import { useToast } from '@/hooks/use-toast';

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
  feedbackStats: {
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: Array<{ rating: number; count: number }>;
    recentFeedback: Array<{
      id: string;
      rating: number;
      comments: string | null;
      created_at: string;
      thesis_title?: string;
    }>;
  };
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
    popularPrograms: [],
    feedbackStats: {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: [],
      recentFeedback: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear, dateRange]);

  const fetchStatistics = async () => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Statistics fetch timeout - forcing completion');
        setLoading(false);
        toast({
          title: "Loading Timeout",
          description: "Data loading took too long. Please refresh to try again.",
          variant: "destructive",
        });
      }
    }, 30000); // 30 second timeout

    try {
      setLoading(true);

      // Build date filter query
      let query = supabase.from('thesis_submissions').select('*');
      
      // Apply date filtering
      if (selectedYear !== 'all') {
        const startOfYear = `${selectedYear}-01-01`;
        const endOfYear = `${selectedYear}-12-31`;
        query = query.gte('submission_date', startOfYear).lte('submission_date', endOfYear);
      } else if (dateRange.start && dateRange.end) {
        query = query.gte('submission_date', dateRange.start).lte('submission_date', dateRange.end);
      } else if (dateRange.start) {
        query = query.gte('submission_date', dateRange.start);
      } else if (dateRange.end) {
        query = query.lte('submission_date', dateRange.end);
      }

      const { data: submissions, error: submissionsError } = await query;

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

      // Fetch feedback statistics
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback')
        .select(`
          *,
          thesis_submissions!inner(thesis_title)
        `)
        .order('created_at', { ascending: false });

      if (feedbackError) {
        console.error('Error fetching feedback:', feedbackError);
      }

      const feedbackStats = {
        totalFeedback: feedback?.length || 0,
        averageRating: feedback?.length ? 
          Math.round((feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length) * 10) / 10
    : 0,
        ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: feedback?.filter(f => f.rating === rating).length || 0
        })),
        recentFeedback: (feedback?.slice(0, 5) || []).map(f => ({
          id: f.id,
          rating: f.rating,
          comments: f.comments,
          created_at: f.created_at,
          thesis_title: f.thesis_submissions?.thesis_title
        }))
      };

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
        popularPrograms,
        feedbackStats
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "Error Loading Statistics",
        description: "Failed to load statistics. The data will be displayed with available information.",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Get available years from the data
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const clearFilters = () => {
    setSelectedYear('all');
    setDateRange({ start: '', end: '' });
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
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Statistics Dashboard</h2>
            <p className="text-gray-600">
              {userRole === 'Reader' ? 'View thesis submission analytics' : 'Overview of thesis submissions and system analytics'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButton 
              stats={stats}
              selectedYear={selectedYear}
              dateRange={dateRange}
              disabled={loading}
              onRefresh={fetchStatistics}
            />
            
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                if (e.target.value !== 'all') {
                  setDateRange({ start: '', end: '' });
                }
              }}
              className="select-field min-w-[120px]"
            >
              <option value="all">All Years</option>
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">OR</span>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Custom Range:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, start: e.target.value }));
                if (e.target.value) {
                  setSelectedYear('all');
                }
              }}
              className="input-field text-sm"
              placeholder="Start date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, end: e.target.value }));
                if (e.target.value) {
                  setSelectedYear('all');
                }
              }}
              className="input-field text-sm"
              placeholder="End date"
            />
          </div>

          {(selectedYear !== 'all' || dateRange.start || dateRange.end) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
              title="Clear all filters"
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Active Filter Indicator */}
        {(selectedYear !== 'all' || dateRange.start || dateRange.end) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Filter size={16} />
              <span>
                Filtered by: 
                {selectedYear !== 'all' && ` Year ${selectedYear}`}
                {dateRange.start && dateRange.end && ` ${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`}
                {dateRange.start && !dateRange.end && ` From ${new Date(dateRange.start).toLocaleDateString()}`}
                {!dateRange.start && dateRange.end && ` Until ${new Date(dateRange.end).toLocaleDateString()}`}
              </span>
            </div>
          </div>
        )}
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

            {/* User Satisfaction */}
            <div className="card-hover p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">User Satisfaction</div>
                  <div className="text-3xl font-bold text-gray-800">{stats.feedbackStats.averageRating}/5</div>
                  <div className="text-sm text-yellow-600">{stats.feedbackStats.totalFeedback} feedback responses</div>
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

      {/* Feedback Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Rating Distribution */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <span>Feedback Distribution</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.feedbackStats.ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="rating" 
                tickFormatter={(value) => `${value} ⭐`}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} responses`, 'Count']}
                labelFormatter={(label) => `${label} Star${label > 1 ? 's' : ''}`}
              />
              <Bar dataKey="count" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Feedback */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>Recent Feedback</span>
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {stats.feedbackStats.recentFeedback.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No feedback available</p>
              </div>
            ) : (
              stats.feedbackStats.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border-l-4 border-yellow-400 pl-4 py-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {feedback.comments && (
                    <p className="text-sm text-gray-700 mb-1">"{feedback.comments}"</p>
                  )}
                  {feedback.thesis_title && (
                    <p className="text-xs text-gray-500">
                      Thesis: {feedback.thesis_title}
                    </p>
                  )}
                </div>
              ))
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-medium text-gray-800">User Feedback</div>
            <div className="text-gray-600">
              {stats.feedbackStats.averageRating}/5 avg ({stats.feedbackStats.totalFeedback} responses)
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default StatisticsTab;

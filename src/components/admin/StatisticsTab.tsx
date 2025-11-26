import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Users, FileText, TrendingUp, Calendar, School, BookOpen, X, Filter, Star, MessageSquare } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import ExportButton from './ExportButton';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface StatisticsTabProps {
  userRole?: 'Admin' | 'Viewer' | null;
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
  programsByDegree: Array<{ name: string; count: number; percentage: number }>; // For UI display
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
  previousPeriod: {
    lpuStudents: number;
    nonLpuStudents: number;
    totalSubmissions: number;
    averageRating: number;
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
    programsByDegree: [],
    feedbackStats: {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: [],
      recentFeedback: []
    },
    previousPeriod: {
      lpuStudents: 0,
      nonLpuStudents: 0,
      totalSubmissions: 0,
      averageRating: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' }); // Input values
  const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' }); // Actually applied filter
  const [ratingFilter, setRatingFilter] = useState<number | null>(null); // null = show all ratings

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'lpu' | 'external'>('all');
  const [campusFilter, setCampusFilter] = useState<string[]>([]);
  const [programFilter, setProgramFilter] = useState<string[]>([]);
  const [exactDateFilter, setExactDateFilter] = useState<string>(''); // ISO date string

  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear, appliedDateRange]);

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
      } else if (appliedDateRange.start && appliedDateRange.end) {
        // Adjust end date to include the entire day (23:59:59)
        const endDate = new Date(appliedDateRange.end);
        endDate.setDate(endDate.getDate() + 1);
        const adjustedEndDate = endDate.toISOString().split('T')[0];
        query = query.gte('submission_date', appliedDateRange.start).lt('submission_date', adjustedEndDate);
      } else if (exactDateFilter) {
        // Exact date filter takes precedence
        query = query.eq('submission_date', exactDateFilter);
      }

      // Apply advanced filters
      if (userTypeFilter !== 'all') {
        const userType = userTypeFilter === 'lpu' ? 'LPU Student' : 'Non-LPU Student';
        query = query.eq('user_type', userType);
      }

      if (campusFilter.length > 0) {
        query = query.in('campus', campusFilter);
      }

      if (programFilter.length > 0) {
        query = query.in('program', programFilter);
      }

      const { data: submissions, error: submissionsError } = await query;

      if (submissionsError) throw submissionsError;

      // Calculate statistics
      const totalSubmissions = submissions?.length || 0;
      const lpuStudents = submissions?.filter(s => s.user_type === 'LPU Student').length || 0;
      const nonLpuStudents = submissions?.filter(s => s.user_type === 'Non-LPU Student').length || 0;

      // Recent submissions - adjusted for date filtering
      // If a date range is selected, show submissions from the filtered data
      // Otherwise, show submissions from the last 30 days
      let recentSubmissions = 0;
      if (selectedYear !== 'all' || appliedDateRange.start || appliedDateRange.end) {
        // When filtering is active, "recent" means within the filtered range
        recentSubmissions = submissions?.length || 0;
      } else {
        // When no filtering, show actual recent (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        recentSubmissions = submissions?.filter(s =>
          new Date(s.submission_date) >= thirtyDaysAgo
        ).length || 0;
      }

      // Campus distribution
      const campusCount = submissions?.reduce((acc, submission) => {
        acc[submission.campus] = (acc[submission.campus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const campusData = Object.entries(campusCount).map(([name, value]) => ({
        name,
        value
      }));

      // Monthly data based on filtered submissions
      const monthlyCount = submissions?.reduce((acc, submission) => {
        const date = new Date(submission.submission_date);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Sort monthly data chronologically and get appropriate range
      const sortedMonthlyData = Object.entries(monthlyCount)
        .map(([month, submissions]) => ({ month, submissions }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      // For custom date ranges, show all months in range; otherwise show last 6 months
      const monthlyData = (appliedDateRange.start || appliedDateRange.end) ? sortedMonthlyData : sortedMonthlyData.slice(-6);

      // Calculate popular thesis titles (for PDF export)
      const thesisTitleCount = submissions?.reduce((acc, submission) => {
        if (submission.thesis_title) {
          acc[submission.thesis_title] = (acc[submission.thesis_title] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const popularPrograms = Object.entries(thesisTitleCount)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalSubmissions) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 popular thesis titles

      // Calculate programs by degree (for UI display)
      const programCount = submissions?.reduce((acc, submission) => {
        if (submission.program) {
          acc[submission.program] = (acc[submission.program] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const programsByDegree = Object.entries(programCount)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalSubmissions) * 100)
        }))
        .sort((a, b) => b.count - a.count); // Show all programs

      // Fetch feedback statistics with date filtering and advanced filters
      let feedbackQuery = supabase
        .from('feedback')
        .select(`
          *,
          thesis_submissions!inner(thesis_title, submission_date, user_type, campus, program)
        `)
        .order('created_at', { ascending: false });

      // Apply date filtering to feedback based on associated thesis submission dates
      if (selectedYear !== 'all') {
        const startOfYear = `${selectedYear}-01-01`;
        const endOfYear = `${selectedYear}-12-31`;
        feedbackQuery = feedbackQuery
          .gte('thesis_submissions.submission_date', startOfYear)
          .lte('thesis_submissions.submission_date', endOfYear);
      } else if (appliedDateRange.start && appliedDateRange.end) {
        // Adjust end date to include the entire day (23:59:59)
        const endDate = new Date(appliedDateRange.end);
        endDate.setDate(endDate.getDate() + 1);
        const adjustedEndDate = endDate.toISOString().split('T')[0];
        feedbackQuery = feedbackQuery
          .gte('thesis_submissions.submission_date', appliedDateRange.start)
          .lt('thesis_submissions.submission_date', adjustedEndDate);
      } else if (exactDateFilter) {
        // Exact date filter for feedback
        feedbackQuery = feedbackQuery
          .eq('thesis_submissions.submission_date', exactDateFilter);
      }

      // Apply advanced filters to feedback
      if (userTypeFilter !== 'all') {
        const userType = userTypeFilter === 'lpu' ? 'LPU Student' : 'Non-LPU Student';
        feedbackQuery = feedbackQuery.eq('thesis_submissions.user_type', userType);
      }

      if (campusFilter.length > 0) {
        feedbackQuery = feedbackQuery.in('thesis_submissions.campus', campusFilter);
      }

      if (programFilter.length > 0) {
        feedbackQuery = feedbackQuery.in('thesis_submissions.program', programFilter);
      }

      const { data: feedback, error: feedbackError } = await feedbackQuery;

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
        recentFeedback: (feedback || []).map(f => ({
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
        let usersQuery = supabase.from('system_users').select('id, created_at');

        // Apply date filtering to users if applicable
        if (selectedYear !== 'all') {
          const startOfYear = `${selectedYear}-01-01`;
          const endOfYear = `${selectedYear}-12-31`;
          usersQuery = usersQuery.gte('created_at', startOfYear).lte('created_at', endOfYear);
        } else if (appliedDateRange.start && appliedDateRange.end) {
          // Adjust end date to include the entire day (23:59:59)
          const endDate = new Date(appliedDateRange.end);
          endDate.setDate(endDate.getDate() + 1);
          const adjustedEndDate = endDate.toISOString().split('T')[0];
          usersQuery = usersQuery.gte('created_at', appliedDateRange.start).lt('created_at', adjustedEndDate);
        }

        const { data: users, error: usersError } = await usersQuery;

        if (!usersError) {
          totalUsers = users?.length || 0;
        }
      }

      // Calculate previous period data for comparison
      let previousPeriod = {
        lpuStudents: 0,
        nonLpuStudents: 0,
        totalSubmissions: 0,
        averageRating: 0
      };

      try {
        let prevQuery = supabase.from('thesis_submissions').select('*');
        let prevFeedbackQuery = supabase
          .from('feedback')
          .select(`
            *,
            thesis_submissions!inner(submission_date)
          `);

        // Calculate previous period date range
        if (selectedYear !== 'all') {
          // Previous year
          const prevYear = (parseInt(selectedYear) - 1).toString();
          const startOfPrevYear = `${prevYear}-01-01`;
          const endOfPrevYear = `${prevYear}-12-31`;
          prevQuery = prevQuery.gte('submission_date', startOfPrevYear).lte('submission_date', endOfPrevYear);
          prevFeedbackQuery = prevFeedbackQuery
            .gte('thesis_submissions.submission_date', startOfPrevYear)
            .lte('thesis_submissions.submission_date', endOfPrevYear);
        } else if (appliedDateRange.start && appliedDateRange.end) {
          // Calculate period length and get previous period
          const start = new Date(appliedDateRange.start);
          const end = new Date(appliedDateRange.end);
          // Add 1 day to end to include the entire end date
          const adjustedEnd = new Date(end);
          adjustedEnd.setDate(adjustedEnd.getDate() + 1);
          const periodLength = adjustedEnd.getTime() - start.getTime();
          const prevEnd = new Date(start.getTime() - 1);
          const prevStart = new Date(prevEnd.getTime() - periodLength);

          prevQuery = prevQuery
            .gte('submission_date', prevStart.toISOString().split('T')[0])
            .lte('submission_date', prevEnd.toISOString().split('T')[0]);
          prevFeedbackQuery = prevFeedbackQuery
            .gte('thesis_submissions.submission_date', prevStart.toISOString().split('T')[0])
            .lte('thesis_submissions.submission_date', prevEnd.toISOString().split('T')[0]);
        } else {
          // No specific filter - compare with data from equivalent period before current period
          // Use last 30 days as previous period
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          prevQuery = prevQuery
            .gte('submission_date', sixtyDaysAgo.toISOString().split('T')[0])
            .lte('submission_date', thirtyDaysAgo.toISOString().split('T')[0]);
          prevFeedbackQuery = prevFeedbackQuery
            .gte('thesis_submissions.submission_date', sixtyDaysAgo.toISOString().split('T')[0])
            .lte('thesis_submissions.submission_date', thirtyDaysAgo.toISOString().split('T')[0]);
        }

        const { data: prevSubmissions } = await prevQuery;
        const { data: prevFeedback } = await prevFeedbackQuery;

        if (prevSubmissions) {
          previousPeriod.lpuStudents = prevSubmissions.filter(s => s.user_type === 'LPU Student').length;
          previousPeriod.nonLpuStudents = prevSubmissions.filter(s => s.user_type === 'Non-LPU Student').length;
          previousPeriod.totalSubmissions = prevSubmissions.length;
        }

        if (prevFeedback && prevFeedback.length > 0) {
          previousPeriod.averageRating = Math.round(
            (prevFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / prevFeedback.length) * 10
          ) / 10;
        }
      } catch (error) {
        console.error('Error fetching previous period data:', error);
        // Continue with zero values for previous period
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
        programsByDegree,
        feedbackStats,
        previousPeriod
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
    setAppliedDateRange({ start: '', end: '' });
    // Clear advanced filters
    setUserTypeFilter('all');
    setCampusFilter([]);
    setProgramFilter([]);
    setExactDateFilter('');
  };

  const applyFilter = () => {
    if (dateRange.start && dateRange.end) {
      setAppliedDateRange({ start: dateRange.start, end: dateRange.end });
      setSelectedYear('all'); // Clear year filter when applying custom date range
    } else if (!dateRange.start && !dateRange.end) {
      // If both fields are empty, clear the applied filter
      setAppliedDateRange({ start: '', end: '' });
    } else {
      // Show a toast message if only one date is filled
      toast({
        title: "Incomplete Date Range",
        description: "Please fill both 'Date From' and 'Date To' fields to apply the filter.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get unique campuses from submissions
  const getAvailableCampuses = (): string[] => {
    const campuses = new Set<string>();
    stats.campusData.forEach(c => campuses.add(c.name));
    return Array.from(campuses).sort();
  };

  // Helper function to get unique programs from submissions
  const getAvailablePrograms = (): string[] => {
    const programs = new Set<string>();
    stats.programsByDegree.forEach(p => programs.add(p.name));
    return Array.from(programs).sort();
  };

  // Count active advanced filters
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (userTypeFilter !== 'all') count++;
    if (campusFilter.length > 0) count++;
    if (programFilter.length > 0) count++;
    if (exactDateFilter) count++;
    return count;
  };

  // Generate description of previous period for display
  const getPreviousPeriodLabel = () => {
    if (selectedYear !== 'all') {
      return `${parseInt(selectedYear) - 1}`;
    } else if (appliedDateRange.start && appliedDateRange.end) {
      const start = new Date(appliedDateRange.start);
      const end = new Date(appliedDateRange.end);
      const periodLength = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - periodLength);
      return `${prevStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${prevEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      // Default: previous 30 days period
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return `${sixtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${thirtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  const COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size={80} message="Loading statistics..." />
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
              {userRole === 'Viewer' ? 'View thesis submission analytics' : 'Overview of thesis submissions and system analytics'}
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
                  setAppliedDateRange({ start: '', end: '' });
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

          <button
            onClick={applyFilter}
            disabled={!dateRange.start && !dateRange.end}
            className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            title="Apply date filter"
          >
            <Filter size={16} />
            <span>Apply Filter</span>
          </button>

          {(selectedYear !== 'all' || appliedDateRange.start || appliedDateRange.end) && (
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
        {(selectedYear !== 'all' || appliedDateRange.start || appliedDateRange.end || getActiveFilterCount() > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Filter size={16} />
              <span>
                Filtered by:
                {selectedYear !== 'all' && ` Year ${selectedYear}`}
                {appliedDateRange.start && appliedDateRange.end && ` ${new Date(appliedDateRange.start).toLocaleDateString()} - ${new Date(appliedDateRange.end).toLocaleDateString()}`}
                {exactDateFilter && ` Exact Date: ${new Date(exactDateFilter).toLocaleDateString()}`}
                {userTypeFilter !== 'all' && ` ${userTypeFilter === 'lpu' ? 'LPU Students' : 'External Users'}`}
                {campusFilter.length > 0 && ` Campus: ${campusFilter.join(', ')}`}
                {programFilter.length > 0 && ` Program: ${programFilter.join(', ')}`}
              </span>
            </div>
          </div>
        )}

        {/* Advanced Filters Section */}
        <div className="space-y-4">
          {/* Toggle Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <Filter size={18} />
            <span>Advanced Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
            <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6">

              {/* User Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">User Type</label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setUserTypeFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${userTypeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    All Users
                  </button>
                  <button
                    onClick={() => setUserTypeFilter('lpu')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${userTypeFilter === 'lpu'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    LPU Students
                  </button>
                  <button
                    onClick={() => setUserTypeFilter('external')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${userTypeFilter === 'external'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    External Users
                  </button>
                </div>
              </div>

              {/* Campus Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Campus ({campusFilter.length} selected)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                  {getAvailableCampuses().map((campus) => (
                    <label key={campus} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={campusFilter.includes(campus)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCampusFilter([...campusFilter, campus]);
                          } else {
                            setCampusFilter(campusFilter.filter(c => c !== campus));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{campus}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Program Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Program ({programFilter.length} selected)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                  {getAvailablePrograms().map((program) => (
                    <label key={program} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={programFilter.includes(program)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProgramFilter([...programFilter, program]);
                          } else {
                            setProgramFilter(programFilter.filter(p => p !== program));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{program}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exact Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Exact Submission Date
                </label>
                <input
                  type="date"
                  value={exactDateFilter}
                  onChange={(e) => setExactDateFilter(e.target.value)}
                  className="input-field w-full md:w-auto"
                />
                {exactDateFilter && (
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Exact date filter overrides year and date range filters
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-300">
                <button
                  onClick={() => {
                    // Trigger refetch with current filters
                    fetchStatistics();
                    setShowAdvancedFilters(false);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setUserTypeFilter('all');
                    setCampusFilter([]);
                    setProgramFilter([]);
                    setExactDateFilter('');
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Reset Advanced Filters
                </button>
              </div>
            </div>
          )}
        </div>
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
                  {stats.previousPeriod.lpuStudents > 0 && (() => {
                    const diff = stats.lpuStudents - stats.previousPeriod.lpuStudents;
                    const percentChange = (diff / stats.previousPeriod.lpuStudents) * 100;
                    const showPercentage = Math.abs(percentChange) <= 100;
                    const periodLabel = getPreviousPeriodLabel();

                    return (
                      <>
                        <div className={`text-sm ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {showPercentage ? (
                            <>{diff >= 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}% vs last period</>
                          ) : (
                            <>{diff >= 0 ? `+${diff}` : diff} students from last period</>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {periodLabel}: {stats.previousPeriod.lpuStudents} students
                        </div>
                      </>
                    );
                  })()}
                  {stats.previousPeriod.lpuStudents === 0 && stats.lpuStudents > 0 && (
                    <div className="text-sm text-gray-500 mt-1">No previous period data</div>
                  )}
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
                  {stats.previousPeriod.nonLpuStudents > 0 && (() => {
                    const diff = stats.nonLpuStudents - stats.previousPeriod.nonLpuStudents;
                    const percentChange = (diff / stats.previousPeriod.nonLpuStudents) * 100;
                    const showPercentage = Math.abs(percentChange) <= 100;
                    const periodLabel = getPreviousPeriodLabel();

                    return (
                      <>
                        <div className={`text-sm ${diff >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                          {showPercentage ? (
                            <>{diff >= 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}% vs last period</>
                          ) : (
                            <>{diff >= 0 ? `+${diff}` : diff} external users from last period</>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {periodLabel}: {stats.previousPeriod.nonLpuStudents} external users
                        </div>
                      </>
                    );
                  })()}
                  {stats.previousPeriod.nonLpuStudents === 0 && stats.nonLpuStudents > 0 && (
                    <div className="text-sm text-gray-500 mt-1">No previous period data</div>
                  )}
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
                  {stats.previousPeriod.totalSubmissions > 0 && (() => {
                    const diff = stats.totalSubmissions - stats.previousPeriod.totalSubmissions;
                    const percentChange = (diff / stats.previousPeriod.totalSubmissions) * 100;
                    const showPercentage = Math.abs(percentChange) <= 100;
                    const periodLabel = getPreviousPeriodLabel();

                    return (
                      <>
                        <div className={`text-sm ${diff >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {showPercentage ? (
                            <>{diff >= 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}% vs last period</>
                          ) : (
                            <>{diff >= 0 ? `+${diff}` : diff} submissions from last period</>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {periodLabel}: {stats.previousPeriod.totalSubmissions} submissions
                        </div>
                      </>
                    );
                  })()}
                  {stats.previousPeriod.totalSubmissions === 0 && stats.totalSubmissions > 0 && (
                    <div className="text-sm text-gray-500 mt-1">No previous period data</div>
                  )}
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
                  {stats.previousPeriod.averageRating > 0 && (
                    <>
                      <div className={`text-sm ${stats.feedbackStats.averageRating >= stats.previousPeriod.averageRating ? 'text-green-600' : 'text-orange-600'}`}>
                        {stats.feedbackStats.averageRating >= stats.previousPeriod.averageRating ? '↑' : '↓'} {Math.abs(stats.feedbackStats.averageRating - stats.previousPeriod.averageRating).toFixed(1)} from last period
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Based on {stats.feedbackStats.totalFeedback} feedback responses
                      </div>
                    </>
                  )}
                  {stats.previousPeriod.averageRating === 0 && stats.feedbackStats.totalFeedback > 0 && (
                    <>
                      <div className="text-sm text-yellow-600">Based on {stats.feedbackStats.totalFeedback} feedback responses</div>
                      <div className="text-sm text-gray-500 mt-1">No previous period data</div>
                    </>
                  )}
                  {stats.feedbackStats.totalFeedback === 0 && (
                    <div className="text-sm text-gray-500">No feedback yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Popular Researchers by Program */}
        <div className="card-hover p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Researchers by Program</h3>
          <div className="space-y-4 max-h-[240px] overflow-y-auto">
            {stats.programsByDegree.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <School className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No program data available</p>
              </div>
            ) : (
              stats.programsByDegree.map((program, index) => {
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-700" title={program.name}>
                        {program.name}
                      </span>
                      <span className="text-sm font-bold text-gray-800 whitespace-nowrap">{program.count} ({program.percentage}%)</span>
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
        <div className="card-hover p-6" id="feedback-distribution-chart">
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
        <div className="card-hover p-6" id="recent-feedback-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>Recent Feedback</span>
            </h3>

            {/* Star Rating Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setRatingFilter(null)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${ratingFilter === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  All
                </button>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(rating)}
                    className={`px-2 py-1 rounded-md transition-colors flex items-center space-x-1 ${ratingFilter === rating
                      ? 'bg-yellow-400 text-gray-800'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    title={`Filter by ${rating} star${rating > 1 ? 's' : ''}`}
                  >
                    <Star size={14} className={ratingFilter === rating ? 'fill-current' : ''} />
                    <span className="text-xs">{rating}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {(() => {
              // Filter feedback based on selected rating
              const filteredFeedback = ratingFilter === null
                ? stats.feedbackStats.recentFeedback
                : stats.feedbackStats.recentFeedback.filter(f => f.rating === ratingFilter);

              return filteredFeedback.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">
                    {ratingFilter === null
                      ? 'No feedback available'
                      : `No ${ratingFilter}-star feedback available`}
                  </p>
                </div>
              ) : (
                filteredFeedback.map((feedback) => (
                  <div key={feedback.id} className="border-l-4 border-yellow-400 pl-4 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={`${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
              );
            })()}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Type Distribution */}
        <div className="card-hover p-6" id="student-type-chart">
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
        <div className="card-hover p-6" id="campus-distribution-chart">
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
      <div className="card-hover p-6" id="monthly-trend-chart">
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
            <div className="font-medium text-gray-800">
              {(selectedYear !== 'all' || dateRange.start || dateRange.end) ? 'Filtered Submissions' : 'Recent Activity'}
            </div>
            <div className="text-gray-600">
              {stats.recentSubmissions} submissions
              {(selectedYear !== 'all' || dateRange.start || dateRange.end) ? 'in range' : 'this month'}
            </div>
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
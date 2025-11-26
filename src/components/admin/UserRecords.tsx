import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Eye, X, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '../../hooks/use-toast';
import UserRecordsExportDialog from './UserRecordsExportDialog';

import ViewUserRecordModal from './ViewUserRecordModal';

interface ThesisSubmission {
  id: string;
  full_name: string;
  user_type: string;
  student_number: string | null;
  school: string | null;
  campus: string;
  program: string | null;
  thesis_title: string;
  submission_date: string;
  created_at: string;
}

interface UserRecordsProps {
  userRole?: 'Admin' | 'Viewer' | null;
}

const UserRecords: React.FC<UserRecordsProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('submission_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [records, setRecords] = useState<ThesisSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<ThesisSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const { toast } = useToast();

  useEffect(() => {
    console.log('UserRecords component mounted');
    fetchRecords();

    // Debounced refresh function to prevent excessive API calls
    let refreshTimeout: NodeJS.Timeout | null = null;
    const debouncedRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        fetchRecords();
      }, 500); // 500ms debounce
    };

    const channel = supabase
      .channel('thesis-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thesis_submissions'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        }
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      if (refreshTimeout) clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecords = async () => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Records fetch timeout - forcing completion');
        setLoading(false);
        toast({
          title: "Loading Timeout",
          description: "Data loading took too long. Displaying available data.",
          variant: "destructive",
        });
      }
    }, 30000); // 30 second timeout

    try {
      setLoading(true);
      console.log('Fetching records from Supabase...');

      const { data, error } = await supabase
        .from('thesis_submissions')
        .select('*')
        .order('submission_date', { ascending: false });

      if (error) {
        console.error('Error fetching records:', error);
        throw error;
      }

      setRecords(data || []);

      if (data && data.length > 0) {
        toast({
          title: "Records Loaded",
          description: `Successfully loaded ${data.length} thesis submission records.`,
        });
      }
    } catch (error) {
      console.error('Error in fetchRecords:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submission records. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };



  const handleViewClick = (record: ThesisSubmission) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setViewingRecord(null);
  };

  const uniqueCampuses = Array.from(new Set(records.map(record => record.campus))).sort();

  const filteredAndSortedRecords = records
    .filter(record => {
      let matchesSearch = true;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        switch (searchField) {
          case 'name':
            matchesSearch = record.full_name.toLowerCase().includes(searchLower);
            break;
          case 'id_school':
            const idSchoolValue = (record.student_number || record.school || '').toLowerCase();
            matchesSearch = idSchoolValue.includes(searchLower);
            break;
          case 'program':
            matchesSearch = (record.program || '').toLowerCase().includes(searchLower);
            break;
          case 'thesis_title':
            matchesSearch = record.thesis_title.toLowerCase().includes(searchLower);
            break;
          default:
            matchesSearch = record.full_name.toLowerCase().includes(searchLower) ||
              record.thesis_title.toLowerCase().includes(searchLower) ||
              (record.student_number || '').toLowerCase().includes(searchLower) ||
              (record.school || '').toLowerCase().includes(searchLower) ||
              (record.program || '').toLowerCase().includes(searchLower);
        }
      }

      const matchesUserType = filterType === 'all' ||
        (filterType === 'lpu' && record.user_type === 'LPU Student') ||
        (filterType === 'non-lpu' && record.user_type === 'Non-LPU Student');

      const matchesCampus = campusFilter === 'all' || record.campus === campusFilter;

      let matchesDate = true;

      // Helper: strip time → midnight
      const toMidnight = (d: string | null) =>
        d ? new Date(new Date(d).setHours(0, 0, 0, 0)) : null;

      const recMid = toMidnight(record.submission_date);

      // Check for exact date filter
      if (dateFilter) {
        const filterMid = toMidnight(dateFilter);
        matchesDate = recMid && recMid.getTime() === filterMid.getTime();
      }
      // Only check date range if no exact date filter is set
      else if (dateRange.start || dateRange.end) {
        const startMid = toMidnight(dateRange.start);
        const endMid = toMidnight(dateRange.end);

        if (startMid && endMid) {
          matchesDate = recMid >= startMid && recMid <= endMid;
        } else if (startMid) {
          matchesDate = recMid >= startMid;
        } else if (endMid) {
          matchesDate = recMid <= endMid;
        }
      }

      return matchesSearch && matchesUserType && matchesCampus && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'submission_date':
          comparison = new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime();
          break;
        case 'full_name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'campus':
          comparison = a.campus.localeCompare(b.campus);
          break;
        case 'thesis_title':
          comparison = a.thesis_title.localeCompare(b.thesis_title);
          break;
        case 'user_type':
          comparison = a.user_type.localeCompare(b.user_type);
          break;
        default:
          comparison = new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleExport = () => {
    const headers = ['Name', 'Type', 'ID/School', 'Campus', 'Program', 'Thesis Title', 'Time Created', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedRecords.map(record => [
        record.full_name,
        record.user_type,
        record.student_number || record.school || '',
        record.campus,
        record.program || '',
        record.thesis_title,
        new Date(record.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        new Date(record.submission_date).toLocaleDateString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thesis_submissions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size={80} message="Loading thesis submissions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-800">User Records</h2>
          <p className="text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {userRole === 'Viewer' ? 'View thesis submission data' : 'Manage and export thesis submission data'} ({records.length} total records)
            </span>
            {isRefreshing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Refreshing...</span>
              </div>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
            className="btn-outline flex items-center space-x-2"
            title="Toggle view mode"
          >
            {viewMode === 'table' ? '' : 'Table View'}
          </button>
          <UserRecordsExportDialog
            records={filteredAndSortedRecords}
            disabled={filteredAndSortedRecords.length === 0}
          />
          <button
            onClick={handleExport}
            className="btn-outline flex items-center space-x-2"
            disabled={filteredAndSortedRecords.length === 0}
            title="Quick CSV Export"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Quick CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 w-full">
        {/* First Row - Search */}
        <div className="flex flex-col md:flex-row gap-2 w-full">
          <div className="flex items-center space-x-2 w-full md:w-auto flex-shrink-0">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="select-field w-full md:w-[180px]"
            >
              <option value="all">Search All Fields</option>
              <option value="name">Name</option>
              <option value="id_school">ID/School</option>
              <option value="program">Program</option>
              <option value="thesis_title">Thesis Title</option>
            </select>
          </div>
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder={`${searchField === 'all' ? 'Search across all fields...' :
                searchField === 'name' ? 'Search by name...' :
                  searchField === 'id_school' ? 'Search by student ID or school...' :
                    searchField === 'program' ? 'Search by program...' :
                      searchField === 'thesis_title' ? 'Search by thesis title...' :
                        'Search...'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Second Row - Filters and Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* User Type Filter */}
          <div className="flex items-center space-x-2 w-full">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-field w-full">
              <option value="all">All Users</option>
              <option value="lpu">LPU Students</option>
              <option value="non-lpu">Non-LPU Students</option>
            </select>
          </div>

          {/* Campus Filter */}
          <div className="flex items-center space-x-2 w-full">
            <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="select-field w-full">
              <option value="all">All Campuses</option>
              {uniqueCampuses.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2 w-full">
            <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field w-full"
              title="Filter by exact date"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2 w-full">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                setSortBy(field);
                setSortOrder(order);
              }}
              className="select-field w-full">
              <option value="submission_date-desc">Latest First</option>
              <option value="submission_date-asc">Oldest First</option>
              <option value="full_name-asc">Name A-Z</option>
              <option value="full_name-desc">Name Z-A</option>
              <option value="campus-asc">Campus A-Z</option>
              <option value="campus-desc">Campus Z-A</option>
              <option value="thesis_title-asc">Title A-Z</option>
              <option value="thesis_title-desc">Title Z-A</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4 bg-gray-50 p-3 rounded-lg w-full">
          <span className="text-sm font-medium text-gray-700 flex-shrink-0">Date Range:</span>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input-field text-sm flex-1 min-w-[140px]"
              placeholder="Start date"
            />
            <span className="text-gray-500 flex-shrink-0">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input-field text-sm flex-1 min-w-[140px]"
              placeholder="End date"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="text-red-600 hover:text-red-800 text-sm flex-shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Status */}
      {(searchTerm || filterType !== 'all' || campusFilter !== 'all' || dateFilter || dateRange.start || dateRange.end) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800 flex-1 min-w-0">
            <Search size={16} />
            <span className="truncate">
              Showing {filteredAndSortedRecords.length} of {records.length} records
              {searchTerm && (
                <span> matching "{searchTerm}" in {
                  searchField === 'all' ? 'all fields' :
                    searchField === 'name' ? 'name' :
                      searchField === 'id_school' ? 'ID/school' :
                        searchField === 'program' ? 'program' :
                          searchField === 'thesis_title' ? 'thesis title' : 'selected field'
                }</span>
              )}
              {filterType !== 'all' && (
                <span> for {filterType === 'lpu' ? 'LPU students' : 'non-LPU students'}</span>
              )}
              {campusFilter !== 'all' && (
                <span> at {campusFilter}</span>
              )}
              {dateFilter && (
                <span> on {new Date(dateFilter).toLocaleDateString()}</span>
              )}
              {(dateRange.start || dateRange.end) && (
                <span> from {dateRange.start ? new Date(dateRange.start).toLocaleDateString() : 'start'} to {dateRange.end ? new Date(dateRange.end).toLocaleDateString() : 'end'}</span>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSearchField('all');
              setFilterType('all');
              setCampusFilter('all');
              setDateFilter('');
              setDateRange({ start: '', end: '' });
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 flex-shrink-0"
          >
            <X size={14} />
            <span>Clear all filters</span>
          </button>
        </div>
      )}

      {/* Records List Container */}
      <div className="card-hover overflow-hidden w-full">
        {viewMode === 'table' ? (
          // SCROLLABLE TABLE CONTAINER
          <div className="w-full h-[600px] overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[600px] border-collapse">
              {/* --- TABLE HEADER --- */}
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Name</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Type</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap hidden sm:table-cell">ID/School</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">Campus</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap hidden lg:table-cell">Program</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Thesis Title</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap hidden sm:table-cell">Time</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                  {(userRole === 'Admin' || userRole === 'Viewer') && (
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-20">Actions</th>
                  )}
                </tr>
              </thead>

              {/* --- TABLE BODY --- */}
              <tbody>
                {filteredAndSortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={(userRole === 'Admin' || userRole === 'Viewer') ? 9 : 8} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                      {records.length === 0 ? (
                        <div>
                          <p className="text-lg font-medium mb-2">No thesis submissions yet</p>
                          <p className="text-sm">
                            Submissions made through the form will appear here automatically.
                          </p>
                        </div>
                      ) : (
                        'No records match your search criteria.'
                      )}
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredAndSortedRecords.map(record => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[120px]">
                          {record.full_name}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${record.user_type === 'LPU Student'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {record.user_type}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 truncate hidden sm:table-cell max-w-[120px]">
                          {record.student_number || record.school || '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 truncate hidden md:table-cell max-w-[100px]">
                          {record.campus}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 truncate hidden lg:table-cell max-w-[120px]">
                          {record.program || '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 truncate max-w-[150px]" title={record.thesis_title}>
                          {record.thesis_title}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 whitespace-nowrap hidden sm:table-cell">
                          {new Date(record.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(record.submission_date).toLocaleDateString()}
                        </td>
                        {(userRole === 'Admin' || userRole === 'Viewer') && (
                          <td className="px-3 sm:px-4 py-3">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => handleViewClick(record)}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // Card View for mobile
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {filteredAndSortedRecords.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {records.length === 0 ? (
                  <div>
                    <p className="text-lg font-medium mb-2">No thesis submissions yet</p>
                    <p className="text-sm">
                      Submissions made through the form will appear here automatically.
                    </p>
                  </div>
                ) : (
                  'No records match your search criteria.'
                )}
              </div>
            ) : (
              <AnimatePresence>
                {filteredAndSortedRecords.map(record => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{record.full_name}</h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${record.user_type === 'LPU Student'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {record.user_type}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24 flex-shrink-0">ID/School:</span>
                        <span className="text-gray-900 truncate">{record.student_number || record.school || '-'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24 flex-shrink-0">Campus:</span>
                        <span className="text-gray-900 truncate">{record.campus}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24 flex-shrink-0">Program:</span>
                        <span className="text-gray-900 truncate">{record.program || '-'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24 flex-shrink-0">Thesis Title:</span>
                        <span className="text-gray-900 truncate">{record.thesis_title}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24 flex-shrink-0">Time Created:</span>
                        <span className="text-gray-900">
                          {new Date(record.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24 flex-shrink-0">Date:</span>
                        <span className="text-gray-900">
                          {new Date(record.submission_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {(userRole === 'Admin' || userRole === 'Viewer') && (
                      <div className="flex justify-end mt-4 pt-2 border-t">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1"
                          onClick={() => handleViewClick(record)}
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {filteredAndSortedRecords.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-700 mt-4 gap-2">
          <div>
            Showing {filteredAndSortedRecords.length} of {records.length} records
          </div>
          <div className="text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}



      {/* View User Record Modal */}
      <ViewUserRecordModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        record={viewingRecord}
      />
    </div>
  );
};

export default UserRecords;
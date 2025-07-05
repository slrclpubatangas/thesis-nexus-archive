import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Eye, Edit, Trash2, X, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

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
}

interface UserRecordsProps {
  userRole?: 'Admin' | 'Reader' | null;
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
  const { toast } = useToast();

  useEffect(() => {
    console.log('UserRecords component mounted');
    fetchRecords();
    
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
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecords = async () => {
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
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (userRole === 'Reader') {
      toast({
        title: "Access Restricted",
        description: "You don't have permission to delete records.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('thesis_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully.",
      });

      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record.",
        variant: "destructive",
      });
    }
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
      const recordDate = new Date(record.submission_date);
      
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        matchesDate = recordDate.toDateString() === filterDate.toDateString();
      } else if (dateRange.start || dateRange.end) {
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && endDate) {
          matchesDate = recordDate >= startDate && recordDate <= endDate;
        } else if (startDate) {
          matchesDate = recordDate >= startDate;
        } else if (endDate) {
          matchesDate = recordDate <= endDate;
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
    const headers = ['Name', 'Type', 'ID/School', 'Campus', 'Program', 'Thesis Title', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedRecords.map(record => [
        record.full_name,
        record.user_type,
        record.student_number || record.school || '',
        record.campus,
        record.program || '',
        record.thesis_title,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading thesis submissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Records</h2>
          <p className="text-gray-600">
            {userRole === 'Reader' ? 'View thesis submission data' : 'Manage and export thesis submission data'} ({records.length} total records)
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchRecords}
            className="btn-secondary flex items-center space-x-2"
            disabled={loading}
          >
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleExport}
            className="btn-primary flex items-center space-x-2"
            disabled={filteredAndSortedRecords.length === 0}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* First Row - Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center space-x-2 min-w-[180px]">
            <Search className="h-5 w-5 text-gray-400" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="select-field w-full"
            >
              <option value="all">Search All Fields</option>
              <option value="name">Name</option>
              <option value="id_school">ID/School</option>
              <option value="program">Program</option>
              <option value="thesis_title">Thesis Title</option>
            </select>
          </div>
          <div className="relative flex-1">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* User Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-field w-full"
            >
              <option value="all">All Users</option>
              <option value="lpu">LPU Students</option>
              <option value="non-lpu">Non-LPU Students</option>
            </select>
          </div>

          {/* Campus Filter */}
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="select-field w-full"
            >
              <option value="all">All Campuses</option>
              {uniqueCampuses.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field w-full"
              title="Filter by exact date"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                setSortBy(field);
                setSortOrder(order);
              }}
              className="select-field w-full"
            >
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
        <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Date Range:</span>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input-field text-sm"
              placeholder="Start date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input-field text-sm"
              placeholder="End date"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="text-red-600 hover:text-red-800 text-sm"
              title="Clear date range"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Status */}
      {(searchTerm || filterType !== 'all' || campusFilter !== 'all' || dateFilter || dateRange.start || dateRange.end) && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <Search size={16} />
            <span>
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
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
          >
            <X size={14} />
            <span>Clear all filters</span>
          </button>
        </div>
      )}

      {/* Records List Container */}
      <div className="card-hover overflow-hidden">
        <div className="overflow-x-auto">
          {/* Table Header (Fixed) */}
          <div className="sticky top-0 z-10 bg-gray-50 grid grid-cols-[1fr_1fr_1fr_1fr_1fr_2fr_1fr,80px] gap-4 px-6 py-3 border-b">
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID/School
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Campus
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Program
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thesis Title
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </div>
            {userRole === 'Admin' && (
              <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </div>
            )}
          </div>

          {/* Animated Scrollable List */}
          {filteredAndSortedRecords.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
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
            <div className="overflow-y-auto max-h-[500px]">
              <AnimatePresence>
                {filteredAndSortedRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_2fr_1fr,80px] gap-4 px-6 py-4 border-b hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {record.full_name}
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.user_type === 'LPU Student' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.user_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 truncate">
                      {record.student_number || record.school || '-'}
                    </div>
                    <div className="text-sm text-gray-900 truncate">
                      {record.campus}
                    </div>
                    <div className="text-sm text-gray-900 truncate">
                      {record.program || '-'}
                    </div>
                    <div className="text-sm text-gray-900 truncate" title={record.thesis_title}>
                      {record.thesis_title}
                    </div>
                    <div className="text-sm text-gray-900">
                      {new Date(record.submission_date).toLocaleDateString()}
                    </div>
                    {userRole === 'Admin' && (
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Edit record"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(record.id)}
                          title="Delete record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Info */}
      {filteredAndSortedRecords.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-700 mt-4">
          <div>
            Showing {filteredAndSortedRecords.length} of {records.length} records
          </div>
          <div className="text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRecords;
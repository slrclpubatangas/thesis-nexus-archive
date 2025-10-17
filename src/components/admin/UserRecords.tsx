import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Eye, Edit, Trash2, X, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import UserRecordsExportDialog from './UserRecordsExportDialog';
import EditUserRecordModal from './EditUserRecordModal';
import DeleteRecordConfirmDialog from './DeleteRecordConfirmDialog';
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
  const [editingRecord, setEditingRecord] = useState<ThesisSubmission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<ThesisSubmission | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<ThesisSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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

  const handleEdit = (record: ThesisSubmission) => {
    if (userRole === 'Reader') {
      toast({
        title: "Access Restricted",
        description: "You don't have permission to edit records.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (updatedRecord: Partial<ThesisSubmission>) => {
    try {
      const { error } = await supabase
        .from('thesis_submissions')
        .update({
          full_name: updatedRecord.full_name,
          user_type: updatedRecord.user_type,
          student_number: updatedRecord.student_number,
          school: updatedRecord.school,
          campus: updatedRecord.campus,
          program: updatedRecord.program,
          thesis_title: updatedRecord.thesis_title,
        })
        .eq('id', updatedRecord.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record updated successfully.",
      });

      // Refresh records to show updated data
      fetchRecords();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "Failed to update record. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to let the modal handle the error state
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  const handleDeleteClick = (record: ThesisSubmission) => {
    if (userRole === 'Reader') {
      toast({
        title: "Access Restricted",
        description: "You don't have permission to delete records.",
        variant: "destructive",
      });
      return;
    }
    
    setDeletingRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    
    setIsDeleting(true);
    
    try {
      console.log('Performing hard delete for record:', deletingRecord.id);
      
      const { error } = await supabase
        .from('thesis_submissions')
        .delete()
        .eq('id', deletingRecord.id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast({
        title: "Record Permanently Deleted",
        description: `${deletingRecord.full_name}'s thesis submission record has been permanently removed.`,
      });

      // Close dialog and refresh data
      handleDeleteDialogClose();
      
      // Show refresh indicator and perform refresh
      setIsRefreshing(true);
      console.log('Refreshing data after successful delete...');
      await fetchRecords();
      
      // Additional refresh for real-time sync (similar to export PDF pattern)
      setTimeout(async () => {
        console.log('Secondary refresh for data consistency...');
        await fetchRecords();
        setIsRefreshing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error performing hard delete:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the record. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDialogClose = () => {
    if (isDeleting) return; // Prevent closing while delete is in progress
    
    setIsDeleteDialogOpen(false);
    setDeletingRecord(null);
    setIsDeleting(false);
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
const startMid = toMidnight(dateRange.start);
const endMid = toMidnight(dateRange.end);

if (startMid && endMid) {
  matchesDate = recMid >= startMid && recMid <= endMid;
} else if (startMid) {
  matchesDate = recMid >= startMid;
} else if (endMid) {
  matchesDate = recMid <= endMid;
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
          <p className="text-gray-600 flex items-center space-x-2">
            <span>
              {userRole === 'Reader' ? 'View thesis submission data' : 'Manage and export thesis submission data'} ({records.length} total records)
            </span>
            {isRefreshing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Refreshing...</span>
              </div>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          
          
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
            <span>Quick CSV</span>
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
          {/* --- TABLE HEADER --- */}
          <div className="sticky top-0 z-10 bg-gray-50 flex px-6 py-3 border-b gap-x-4">
            <div className="w-40 text-left text-xs font-medium text-gray-500 uppercase">Name</div>
            <div className="w-32 text-left text-xs font-medium text-gray-500 uppercase">Type</div>
            <div className="w-36 text-left text-xs font-medium text-gray-500 uppercase">ID/School</div>
            <div className="w-32 text-left text-xs font-medium text-gray-500 uppercase">Campus</div>
            <div className="w-36 text-left text-xs font-medium text-gray-500 uppercase">Program</div>
            <div className="w-36 text-left text-xs font-medium text-gray-500 uppercase">Thesis Title</div>
            <div className="w-36 text-left text-xs font-medium text-gray-500 uppercase">Time Created</div>
            <div className="w-24 text-left text-xs font-medium text-gray-500 uppercase">Date</div>
            {userRole === 'Admin' && (
              <div className="w-20 text-left text-xs font-medium text-gray-500 uppercase">Actions</div>
            )}
          </div>

          {/* --- TABLE BODY --- */}
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
                {filteredAndSortedRecords.map(record => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex px-6 py-4 border-b hover:bg-gray-50 gap-x-4 items-center"
                  >
                    <div className="w-40 text-sm font-medium text-gray-900 truncate">
                      {record.full_name}
                    </div>
                    <div className="w-32">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.user_type === 'LPU Student'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {record.user_type}
                      </span>
                    </div>
                    <div className="w-36 text-sm text-gray-900 truncate">
                      {record.student_number || record.school || '-'}
                    </div>
                    <div className="w-32 text-sm text-gray-900 truncate">
                      {record.campus}
                    </div>
                    <div className="w-36 text-sm text-gray-900 truncate">
                      {record.program || '-'}
                    </div>
                    <div
                      className="w-36 text-sm text-gray-900 truncate"
                      title={record.thesis_title}
                    >
                      {record.thesis_title}
                    </div>
                    <div className="w-28 text-sm text-gray-900">
                      {new Date(record.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                    <div className="w-24 text-sm text-gray-900">
                      {new Date(record.submission_date).toLocaleDateString()}
                    </div>
                    {userRole === 'Admin' && (
                      <div className="w-20 flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewClick(record)}
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleEdit(record)}
                          title="Edit record"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(record)}
                          title="Delete record permanently"
                          disabled={isDeleting && deletingRecord?.id === record.id}
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

      {/* Edit User Record Modal */}
      <EditUserRecordModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        record={editingRecord}
        onSave={handleEditSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteRecordConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        record={deletingRecord}
        isDeleting={isDeleting}
      />

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
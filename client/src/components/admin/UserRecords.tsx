
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
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
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState<ThesisSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('UserRecords component mounted');
    fetchRecords();
    
    // Set up real-time subscription
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
          // Refresh data when changes occur
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
      
      const { data, error, count } = await supabase
        .from('thesis_submissions')
        .select('*', { count: 'exact' })
        .order('submission_date', { ascending: false });

      console.log('Supabase query result:', { data, error, count });

      if (error) {
        console.error('Error fetching records:', error);
        throw error;
      }

      setRecords(data || []);
      console.log('Records updated in state:', data?.length || 0, 'records');
      
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
    // Restrict delete action for Reader users
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
      console.log('Deleting record with id:', id);
      const { error } = await supabase
        .from('thesis_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Record deleted successfully.",
      });

      // Refresh the records
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

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.thesis_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'lpu' && record.user_type === 'LPU Student') ||
                         (filterType === 'non-lpu' && record.user_type === 'Non-LPU Student');
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = ['Name', 'Type', 'ID/School', 'Campus', 'Program', 'Thesis Title', 'Date'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.full_name,
        record.user_type,
        record.student_number || record.school || '',
        record.campus,
        record.program || '',
        record.thesis_title,
        new Date(record.submission_date).toLocaleDateString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Download CSV
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
            disabled={filteredRecords.length === 0}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or thesis title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field w-auto min-w-[150px]"
          >
            <option value="all">All Users</option>
            <option value="lpu">LPU Students</option>
            <option value="non-lpu">Non-LPU Students</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="card-hover overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID/School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thesis Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {userRole === 'Admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'Admin' ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
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
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.full_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.user_type === 'LPU Student' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.user_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.student_number || record.school || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.campus}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.program || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={record.thesis_title}>
                        {record.thesis_title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.submission_date).toLocaleDateString()}
                    </td>
                    {userRole === 'Admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      {filteredRecords.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div>
            Showing {filteredRecords.length} of {records.length} records
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

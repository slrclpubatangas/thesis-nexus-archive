
import React, { useState, useMemo } from 'react';
import { Upload, Search, Plus, Trash2, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import CSVUploadSection from './thesis/CSVUploadSection';
import ThesisDataTable from './thesis/ThesisDataTable';
import EditThesisModal from './thesis/EditThesisModal';
import DeleteThesisModal from './thesis/DeleteThesisModal';
import AddThesisModal from './thesis/AddThesisModal';

interface ThesisRecord {
  id: number;
  barcode: string;
  thesis_title: string;
  authors: string[];
  department: string;
  publication_year: number;
  upload_date: string;
  last_modified: string;
  is_deleted: boolean;
}

const ThesisData = () => {
  const [activeView, setActiveView] = useState<'upload' | 'manage'>('manage');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingThesis, setEditingThesis] = useState<ThesisRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingThesis, setDeletingThesis] = useState<ThesisRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedThesisIds, setSelectedThesisIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filter states
  const [filters, setFilters] = useState({
    department: '',
    author: '',
    year: '',
    yearFrom: '',
    yearTo: '',
    barcode: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { queryWithAuth, mutateWithAuth, supabase } = useSupabaseAuth();

  // Fetch thesis data from the new thesis_data table
  const { data: thesesData = [], isLoading, error } = useQuery({
    queryKey: ['thesis-data'],
    queryFn: async () => {
      console.log('🔄 Fetching thesis data...');
      const data = await queryWithAuth(
        supabase
          .from('thesis_data')
          .select('*')
          .eq('is_deleted', false)
          .order('upload_date', { ascending: false }),
        {
          showErrorToast: false, // We'll handle errors in the query itself
        }
      );

      return data || [];
    },
    // Refetch on window focus to ensure data is up to date
    refetchOnWindowFocus: true,
    // Retry on error with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.message?.includes('JWT') || error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    // Show error in console but don't crash the component
    throwOnError: false,
  });

  // Handle query errors
  if (error && !isLoading) {
    console.error('Error fetching thesis data:', error);
    toast({
      title: "Error",
      description: "Failed to fetch thesis data. Please refresh the page.",
      variant: "destructive",
    });
  }

  // Get unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const departments = new Set(thesesData.map(t => t.department));
    return Array.from(departments).sort();
  }, [thesesData]);

  // Advanced filter logic with search term
  const filteredTheses = useMemo(() => {
    return thesesData.filter(thesis => {
      // Search term filter (searches across multiple fields)
      const matchesSearch = !searchTerm || (
        thesis.thesis_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thesis.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        thesis.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thesis.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Department filter
      const matchesDepartment = !filters.department ||
        thesis.department?.toLowerCase() === filters.department.toLowerCase();

      // Author filter
      const matchesAuthor = !filters.author ||
        thesis.authors?.some(author => author.toLowerCase().includes(filters.author.toLowerCase()));

      // Barcode filter
      const matchesBarcode = !filters.barcode ||
        thesis.barcode?.toLowerCase().includes(filters.barcode.toLowerCase());

      // Year filter (exact match)
      const matchesYear = !filters.year ||
        thesis.publication_year === parseInt(filters.year);

      // Year range filter
      const matchesYearFrom = !filters.yearFrom ||
        thesis.publication_year >= parseInt(filters.yearFrom);

      const matchesYearTo = !filters.yearTo ||
        thesis.publication_year <= parseInt(filters.yearTo);

      return matchesSearch && matchesDepartment && matchesAuthor &&
        matchesBarcode && matchesYear && matchesYearFrom && matchesYearTo;
    });
  }, [thesesData, searchTerm, filters]);

  const handleUploadSuccess = (recordCount: number) => {
    toast({
      title: "Upload Successful",
      description: `Successfully uploaded ${recordCount} thesis records.`,
    });
    queryClient.invalidateQueries({ queryKey: ['thesis-data'] });
    setActiveView('manage');
  };

  const handleUploadError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleEdit = (thesis: ThesisRecord) => {
    setEditingThesis(thesis);
    setIsEditModalOpen(true);
  };

  const handleUpdateThesis = async (updatedThesis: Partial<ThesisRecord>) => {
    try {
      await mutateWithAuth(
        supabase
          .from('thesis_data')
          .update({
            thesis_title: updatedThesis.thesis_title,
            authors: updatedThesis.authors,
            department: updatedThesis.department,
            publication_year: updatedThesis.publication_year,
          })
          .eq('id', updatedThesis.id),
        {
          onError: (error) => {
            console.error('Error updating thesis:', error);
            toast({
              title: "Error",
              description: "Failed to update thesis information.",
              variant: "destructive",
            });
          },
        }
      );

      toast({
        title: "Success",
        description: "Thesis information updated successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['thesis-data'] });
      setIsEditModalOpen(false);
      setEditingThesis(null);
    } catch (error) {
      // Error is already handled by mutateWithAuth
      console.error('Update thesis operation failed:', error);
    }
  };

  const handleDelete = (thesis: ThesisRecord) => {
    setDeletingThesis(thesis);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteThesis = async (id: number) => {
    try {
      await mutateWithAuth(
        supabase
          .from('thesis_data')
          .delete()
          .eq('id', id),
        {
          onError: (error) => {
            console.error('Error deleting thesis:', error);
            toast({
              title: "Error",
              description: "Failed to delete thesis record.",
              variant: "destructive",
            });
          },
        }
      );

      toast({ title: 'Success!', description: 'Thesis record deleted successfully!' });

      queryClient.invalidateQueries({ queryKey: ['thesis-data'] });
      setIsDeleteModalOpen(false);
      setDeletingThesis(null);
    } catch (error) {
      // Error is already handled by mutateWithAuth
      console.error('Delete thesis operation failed:', error);
    }
  };

  const handleAddThesis = async (newThesis: {
    barcode: string;
    thesis_title: string;
    authors: string[];
    department: string;
    publication_year: number;
  }) => {
    try {
      await mutateWithAuth(
        supabase
          .from('thesis_data')
          .insert({
            barcode: newThesis.barcode,
            thesis_title: newThesis.thesis_title,
            authors: newThesis.authors,
            department: newThesis.department,
            publication_year: newThesis.publication_year,
          }),
        {
          onError: (error) => {
            console.error('Error adding thesis:', error);
            toast({
              title: "Error",
              description: "Failed to add thesis record.",
              variant: "destructive",
            });
          },
        }
      );

      toast({
        title: "Success",
        description: "Thesis record added successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ['thesis-data'] });
      setIsAddModalOpen(false);
    } catch (error) {
      // Error is already handled by mutateWithAuth
      console.error('Add thesis operation failed:', error);
    }
  };

  // Filter handlers
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      author: '',
      year: '',
      yearFrom: '',
      yearTo: '',
      barcode: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredTheses.map(thesis => thesis.id);
      setSelectedThesisIds(allIds);
    } else {
      setSelectedThesisIds([]);
    }
  };

  const handleSelectThesis = (thesisId: number, checked: boolean) => {
    if (checked) {
      setSelectedThesisIds(prev => [...prev, thesisId]);
    } else {
      setSelectedThesisIds(prev => prev.filter(id => id !== thesisId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedThesisIds.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedThesisIds.length} thesis record(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await mutateWithAuth(
        supabase
          .from('thesis_data')
          .delete()
          .in('id', selectedThesisIds),
        {
          onError: (error) => {
            console.error('Error deleting theses:', error);
            toast({
              title: "Error",
              description: "Failed to delete thesis records.",
              variant: "destructive",
            });
          },
        }
      );

      toast({
        title: "Success",
        description: `Successfully deleted ${selectedThesisIds.length} thesis record(s).`,
      });

      queryClient.invalidateQueries({ queryKey: ['thesis-data'] });
      setSelectedThesisIds([]);
    } catch (error) {
      console.error('Bulk delete operation failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Thesis Data Management</h2>
          <p className="text-gray-600">Upload and manage thesis records</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeView === 'manage'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Manage Data
          </button>
          <button
            onClick={() => setActiveView('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeView === 'upload'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            CSV Upload
          </button>
        </div>
      </div>

      {activeView === 'upload' ? (
        <CSVUploadSection
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      ) : (
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search thesis records or barcodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${showFilters || hasActiveFilters
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Filter size={16} />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-white text-red-600 rounded-full px-2 py-0.5 text-xs font-bold">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add New Thesis</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Advanced Filters</h3>
                <div className="flex items-center space-x-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Author Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={filters.author}
                    onChange={(e) => handleFilterChange('author', e.target.value)}
                    placeholder="Search by author name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Barcode Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={filters.barcode}
                    onChange={(e) => handleFilterChange('barcode', e.target.value)}
                    placeholder="Search by barcode..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Year (Exact) Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exact Year
                  </label>
                  <input
                    type="number"
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    placeholder="e.g., 2024"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Year From Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year From
                  </label>
                  <input
                    type="number"
                    value={filters.yearFrom}
                    onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                    placeholder="Start year"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Year To Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year To
                  </label>
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                    placeholder="End year"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Results Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredTheses.length}</span> of <span className="font-semibold text-gray-900">{thesesData.length}</span> thesis records
                </p>
              </div>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedThesisIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedThesisIds.length} item(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Delete Selected</span>
              </button>
            </div>
          )}

          <ThesisDataTable
            theses={filteredTheses}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedThesisIds={selectedThesisIds}
            onSelectAll={handleSelectAll}
            onSelectThesis={handleSelectThesis}
          />

          <EditThesisModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingThesis(null);
            }}
            thesis={editingThesis}
            onSave={handleUpdateThesis}
          />

          <DeleteThesisModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setDeletingThesis(null);
            }}
            thesis={deletingThesis}
            onConfirm={handleDeleteThesis}
          />

          <AddThesisModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddThesis}
          />
        </div>
      )}
    </div>
  );
};

export default ThesisData;

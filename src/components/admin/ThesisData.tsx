
import React, { useState } from 'react';
import { Upload, Search, Plus } from 'lucide-react';
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
  const [activeView, setActiveView] = useState<'upload' | 'manage'>('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingThesis, setEditingThesis] = useState<ThesisRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingThesis, setDeletingThesis] = useState<ThesisRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Filter theses based on search term
  const filteredTheses = thesesData.filter(thesis =>
    thesis.thesis_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    thesis.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      toast({title:'Success!', description:'Thesis record deleted successfully!'});

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
            onClick={() => setActiveView('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'upload'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            CSV Upload
          </button>
          <button
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'manage'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Manage Data
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
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add New Thesis</span>
            </button>
          </div>

          <ThesisDataTable 
            theses={filteredTheses}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onEdit={handleEdit}
            onDelete={handleDelete}
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


import React, { useState } from 'react';
import { Upload, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CSVUploadSection from './thesis/CSVUploadSection';
import ThesisDataTable from './thesis/ThesisDataTable';

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch thesis data from the new thesis_data table
  const { data: thesesData = [], isLoading } = useQuery({
    queryKey: ['thesis-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thesis_data')
        .select('*')
        .eq('is_deleted', false)
        .order('upload_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching thesis data:', error);
        throw error;
      }
      
      return data || [];
    },
  });

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
            <button className="btn-primary flex items-center space-x-2">
              <Plus size={16} />
              <span>Add New Thesis</span>
            </button>
          </div>

          <ThesisDataTable 
            theses={filteredTheses}
            isLoading={isLoading}
            searchTerm={searchTerm}
          />
        </div>
      )}
    </div>
  );
};

export default ThesisData;

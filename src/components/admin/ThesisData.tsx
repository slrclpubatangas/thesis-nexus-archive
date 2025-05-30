
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Search, Plus, Edit, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ThesisRecord {
  id: string;
  barcode: string;
  thesis_title: string;
  full_name: string;
  program: string;
  submission_date: string;
}

const ThesisData = () => {
  const [activeView, setActiveView] = useState<'upload' | 'manage'>('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate unique barcode
  const generateBarcode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `THS-${timestamp}-${random}`.toUpperCase();
  };

  // Fetch thesis data from Supabase
  const { data: thesesData = [], isLoading } = useQuery({
    queryKey: ['thesis-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thesis_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching thesis data:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Parse CSV content
  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find required column indices
    const titleIndex = headers.findIndex(h => h.includes('title'));
    const authorIndex = headers.findIndex(h => h.includes('author') || h.includes('name'));
    const programIndex = headers.findIndex(h => h.includes('program'));
    const yearIndex = headers.findIndex(h => h.includes('year'));
    
    if (titleIndex === -1 || authorIndex === -1) {
      throw new Error('CSV must contain Title and Author columns');
    }
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < 2) continue; // Skip empty lines
      
      const record = {
        barcode: generateBarcode(),
        thesis_title: values[titleIndex] || '',
        full_name: values[authorIndex] || '',
        program: programIndex !== -1 ? values[programIndex] || 'Not Specified' : 'Not Specified',
        submission_date: new Date().toISOString(),
        campus: 'Main Campus',
        user_type: 'Graduate Student'
      };
      
      // Add year if available
      if (yearIndex !== -1 && values[yearIndex]) {
        record.submission_date = new Date(values[yearIndex] + '-01-01').toISOString();
      }
      
      records.push(record);
    }
    
    return records;
  };

  // Handle CSV file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const csvText = await file.text();
      const records = parseCSV(csvText);
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV');
      }
      
      // Insert records into Supabase
      const { data, error } = await supabase
        .from('thesis_submissions')
        .insert(records);
      
      if (error) {
        console.error('Error inserting data:', error);
        throw error;
      }
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['thesis-submissions'] });
      
      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${records.length} thesis records.`,
      });
      
      // Switch to manage view to show the data
      setActiveView('manage');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process CSV file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Filter theses based on search term
  const filteredTheses = thesesData.filter(thesis =>
    thesis.thesis_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        // CSV Upload Section
        <div className="card-hover p-8">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Thesis Data
            </h3>
            <p className="text-gray-600 mb-6">
              Upload a CSV file containing thesis records to bulk import data
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-red-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="space-y-3">
                  <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  <div>
                    <span className="text-red-600 font-medium">
                      {isUploading ? 'Processing...' : 'Click to upload'}
                    </span>
                    {!isUploading && <span className="text-gray-600"> or drag and drop</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    CSV files only (Title, Author, Program, Year)
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-center space-x-3">
              <button 
                className="btn-primary"
                disabled={isUploading}
              >
                {isUploading ? 'Processing...' : 'Process Upload'}
              </button>
              <button className="btn-secondary flex items-center space-x-2">
                <Download size={16} />
                <span>Download Template</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Manage Data Section
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

          {/* Thesis Records Table */}
          <div className="card-hover overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading thesis records...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTheses.length > 0 ? (
                      filteredTheses.map((thesis) => (
                        <tr key={thesis.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {thesis.barcode || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs">
                              {thesis.thesis_title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {thesis.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {thesis.program || 'Not Specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(thesis.submission_date).getFullYear()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Edit size={16} />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          {searchTerm ? 'No matching thesis records found.' : 'No thesis records available. Upload a CSV file to get started.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesisData;

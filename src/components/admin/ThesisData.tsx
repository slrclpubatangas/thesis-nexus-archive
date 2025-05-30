
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Search, Plus, Edit, Trash2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

interface ThesisRecord {
  id: string;
  thesis_title: string;
  full_name: string;
  program: string;
  submission_date: string;
  barcode?: string;
}

const ThesisData = () => {
  const [activeView, setActiveView] = useState<'upload' | 'manage'>('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [thesesData, setThesesData] = useState<ThesisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (activeView === 'manage') {
      fetchTheses();
    }
  }, [activeView]);

  const fetchTheses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('thesis_submissions')
        .select('id, thesis_title, full_name, program, submission_date, student_number')
        .order('submission_date', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        thesis_title: item.thesis_title,
        full_name: item.full_name,
        program: item.program || 'N/A',
        submission_date: new Date(item.submission_date).toLocaleDateString(),
        barcode: item.student_number || 'N/A'
      })) || [];

      setThesesData(formattedData);
    } catch (error) {
      console.error('Error fetching theses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch thesis records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      
      if (rows.length < 2) {
        throw new Error('CSV file must contain a header row and at least one data row');
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const requiredFields = ['title', 'author', 'barcode', 'program', 'year'];
      
      // Check if all required fields are present
      const missingFields = requiredFields.filter(field => 
        !headers.some(h => h.includes(field))
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Find column indices
      const titleIndex = headers.findIndex(h => h.includes('title'));
      const authorIndex = headers.findIndex(h => h.includes('author'));
      const barcodeIndex = headers.findIndex(h => h.includes('barcode'));
      const programIndex = headers.findIndex(h => h.includes('program'));
      const yearIndex = headers.findIndex(h => h.includes('year'));

      const records = [];
      const errors = [];

      // Process each data row
      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',').map(c => c.trim().replace(/"/g, ''));
        
        if (columns.length < requiredFields.length) {
          errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }

        const record = {
          thesis_title: columns[titleIndex] || '',
          full_name: columns[authorIndex] || '',
          student_number: columns[barcodeIndex] || '',
          program: columns[programIndex] || '',
          user_type: 'undergraduate',
          campus: 'Main Campus',
          submission_date: new Date().toISOString()
        };

        // Validate required fields
        if (!record.thesis_title || !record.full_name || !record.student_number) {
          errors.push(`Row ${i + 1}: Missing required data`);
          continue;
        }

        records.push(record);
      }

      if (errors.length > 0) {
        console.warn('CSV parsing errors:', errors);
      }

      if (records.length === 0) {
        throw new Error('No valid records found in CSV file');
      }

      // Insert records into database
      const { error: insertError } = await supabase
        .from('thesis_submissions')
        .insert(records);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `Successfully uploaded ${records.length} thesis records`,
        variant: "default"
      });

      // Refresh the table if we're on manage view
      if (activeView === 'manage') {
        await fetchTheses();
      }

      // Clear the file input
      event.target.value = '';

    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process CSV file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'Title,Author,Barcode,Program,Year\n"Sample Thesis Title","John Doe","12345","Computer Science","2024"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thesis_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTheses = thesesData.filter(thesis =>
    thesis.thesis_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thesis.barcode.toLowerCase().includes(searchTerm.toLowerCase())
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
              Upload a CSV file containing thesis records with Title, Author, Barcode, Program, and Year columns
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-red-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="space-y-3">
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  ) : (
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                  )}
                  <div>
                    <span className="text-red-600 font-medium">
                      {uploading ? 'Processing...' : 'Click to upload'}
                    </span>
                    {!uploading && <span className="text-gray-600"> or drag and drop</span>}
                  </div>
                  <p className="text-sm text-gray-500">CSV files only</p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-center space-x-3">
              <button 
                onClick={downloadTemplate}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Download Template</span>
              </button>
            </div>

            {/* Upload Instructions */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-blue-900">CSV Format Requirements</h4>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Required columns: Title, Author, Barcode, Program, Year</li>
                    <li>• First row must contain column headers</li>
                    <li>• All fields are required for each record</li>
                    <li>• Use commas to separate values</li>
                  </ul>
                </div>
              </div>
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
                placeholder="Search thesis records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button 
              onClick={fetchTheses}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>Refresh</span>
            </button>
          </div>

          {/* Thesis Records Table */}
          <div className="card-hover overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Submission Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTheses.length > 0 ? filteredTheses.map((thesis) => (
                      <tr key={thesis.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs">
                            {thesis.thesis_title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {thesis.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {thesis.program}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {thesis.submission_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {thesis.barcode}
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
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          {searchTerm ? 'No records match your search' : 'No thesis records found'}
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

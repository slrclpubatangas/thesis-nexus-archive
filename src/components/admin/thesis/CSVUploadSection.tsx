
import React, { useState } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CSVUploadSectionProps {
  onUploadSuccess: (recordCount: number) => void;
  onUploadError: (error: string) => void;
}

const CSVUploadSection: React.FC<CSVUploadSectionProps> = ({
  onUploadSuccess,
  onUploadError
}) => {
  const [isUploading, setIsUploading] = useState(false);

  // Generate unique barcode
  const generateBarcode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `THS-${timestamp}-${random}`.toUpperCase();
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['Title', 'Author', 'Department', 'Year'];
    const sampleData = [
      ['Advanced Machine Learning Algorithms for Healthcare', 'John Doe', 'Computer Science', '2024'],
      ['Sustainable Architecture in Urban Development', 'Jane Smith', 'Architecture', '2023'],
      ['Quantum Computing Applications in Cryptography', 'Alice Johnson', 'Physics', '2024'],
      ['Impact of Social Media on Mental Health', 'Bob Williams', 'Psychology', '2023'],
      ['Renewable Energy Solutions for Rural Communities', 'Sarah Davis', 'Engineering', '2024']
    ];
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'thesis_data_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV content
  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find required column indices
    const titleIndex = headers.findIndex(h => h.includes('title'));
    const authorIndex = headers.findIndex(h => h.includes('author') || h.includes('name'));
    const departmentIndex = headers.findIndex(h => h.includes('department') || h.includes('program'));
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
        authors: [values[authorIndex] || ''],
        department: departmentIndex !== -1 ? values[departmentIndex] || 'Not Specified' : 'Not Specified',
        publication_year: yearIndex !== -1 && values[yearIndex] ? parseInt(values[yearIndex]) : new Date().getFullYear()
      };
      
      records.push(record);
    }
    
    return records;
  };

  // Handle CSV file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      onUploadError("Please upload a CSV file.");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const csvText = await file.text();
      const records = parseCSV(csvText);
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV');
      }
      
      // Insert records into the thesis_data table
      const { data, error } = await supabase
        .from('thesis_data')
        .insert(records);
      
      if (error) {
        console.error('Error inserting data:', error);
        throw error;
      }
      
      onUploadSuccess(records.length);
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : "Failed to process CSV file.");
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
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
                CSV files only (Title, Author, Department/Program, Year)
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
<button 
            onClick={downloadTemplate}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Download Template</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVUploadSection;

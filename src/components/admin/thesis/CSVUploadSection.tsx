
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

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['Barcode', 'Title', 'Author', 'Department', 'Year'];
    const sampleData = [
      ['THS-2024-001', 'Advanced Machine Learning Algorithms for Healthcare', 'John Doe', 'Computer Science', '2024']
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

  // Helper function to parse CSV line properly handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Parse CSV content
  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');

      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
      console.log('CSV Headers found:', headers);

      // Find required column indices
      const barcodeIndex = headers.findIndex(h => h.includes('barcode'));
      const titleIndex = headers.findIndex(h => h.includes('title'));
      const authorIndex = headers.findIndex(h => h.includes('author') || h.includes('name'));
      const departmentIndex = headers.findIndex(h => h.includes('department') || h.includes('program'));
      const yearIndex = headers.findIndex(h => h.includes('year'));

      console.log('Column indices:', { barcodeIndex, titleIndex, authorIndex, departmentIndex, yearIndex });

      if (barcodeIndex === -1) {
        throw new Error(`CSV must contain a Barcode column. Found columns: ${headers.join(', ')}`);
      }

      if (titleIndex === -1) {
        throw new Error(`CSV must contain a Title column. Found columns: ${headers.join(', ')}`);
      }

      if (authorIndex === -1) {
        throw new Error(`CSV must contain an Author column. Found columns: ${headers.join(', ')}`);
      }

      const records = [];
      const barcodes = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '').trim());

        if (values.length < 2) continue; // Skip lines with insufficient data

        const barcode = values[barcodeIndex] || '';

        // Validate barcode
        if (!barcode) {
          throw new Error(`Row ${i + 1}: Barcode is required`);
        }

        // Check for duplicate barcodes within the CSV
        if (barcodes.has(barcode)) {
          throw new Error(`Row ${i + 1}: Duplicate barcode "${barcode}" found in CSV`);
        }
        barcodes.add(barcode);

        const record = {
          barcode: barcode,
          thesis_title: values[titleIndex] || '',
          authors: [values[authorIndex] || ''],
          department: departmentIndex !== -1 ? values[departmentIndex] || 'Not Specified' : 'Not Specified',
          publication_year: yearIndex !== -1 && values[yearIndex] ? parseInt(values[yearIndex]) : new Date().getFullYear()
        };

        console.log(`Parsed row ${i + 1}:`, record);
        records.push(record);
      }

      console.log(`Total records parsed: ${records.length}`);
      return records;
    } catch (error) {
      console.error('CSV parsing error:', error);
      throw error;
    }
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
      console.log('Starting CSV file upload...');
      console.log('File name:', file.name);
      console.log('File size:', file.size, 'bytes');

      const csvText = await file.text();
      console.log('CSV text loaded, length:', csvText.length);

      const records = parseCSV(csvText);

      if (records.length === 0) {
        throw new Error('No valid records found in CSV. Please ensure your CSV has data rows after the header.');
      }

      console.log('Records to insert:', records.length);

      // Check for existing barcodes in the database
      const barcodes = records.map(r => r.barcode);
      const { data: existingRecords, error: checkError } = await supabase
        .from('thesis_data')
        .select('barcode, department')
        .in('barcode', barcodes);

      if (checkError) {
        console.error('Error checking barcodes:', checkError);
        throw new Error('Failed to validate barcodes');
      }

      // Filter out records that match both barcode AND department
      let recordsToInsert = records;
      const skippedRecords: string[] = [];

      if (existingRecords && existingRecords.length > 0) {
        recordsToInsert = records.filter(csvRecord => {
          const existingMatch = existingRecords.find(
            existing => existing.barcode === csvRecord.barcode && existing.department === csvRecord.department
          );

          if (existingMatch) {
            skippedRecords.push(csvRecord.barcode);
            return false; // Skip this record
          }
          return true; // Include this record
        });
      }

      // If all records were duplicates, show error
      if (recordsToInsert.length === 0) {
        throw new Error(
          `All records in the CSV already exist in the database (matching barcode and department). No new records to insert.`
        );
      }

      console.log(`Records to insert after filtering: ${recordsToInsert.length}`);
      if (skippedRecords.length > 0) {
        console.log(`Skipped duplicate records: ${skippedRecords.join(', ')}`);
      }

      // Insert records into the thesis_data table
      const { data, error } = await supabase
        .from('thesis_data')
        .insert(recordsToInsert);

      if (error) {
        console.error('Error inserting data:', error);
        // Provide more detailed error message
        const errorMsg = error.message || 'Unknown database error';
        throw new Error(`Database error: ${errorMsg}`);
      }

      // Report success with information about skipped records
      onUploadSuccess(recordsToInsert.length);

      // Show warning if some records were skipped
      if (skippedRecords.length > 0) {
        console.warn(`Skipped ${skippedRecords.length} duplicate record(s): ${skippedRecords.join(', ')}`);
      }

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
                CSV files only (Barcode, Title, Author, Department/Program, Year)
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

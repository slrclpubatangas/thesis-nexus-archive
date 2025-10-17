import React, { useState } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { StudentRecord } from '../StudentData';

interface Props {
  onUploadSuccess: (recordCount: number) => void;
  onUploadError: (error: string) => void;
}

const StudentCSVUploadSection: React.FC<Props> = ({ onUploadSuccess, onUploadError }) => {
  const [isUploading, setIsUploading] = useState(false);

  const downloadTemplate = () => {
    const headers = ['Student#', 'Full Name', 'Course and Section', 'Email', 'School Year'];
    const sample = [
      ['2021-00001', 'Juan Dela Cruz', 'BSIT-3A', 'juan@example.com', '2024-2025'],
      ['2021-00002', 'Maria Santos', 'BSCS-2B', 'maria@example.com', '2024-2025'],
    ];
    const csv = [headers.join(','), ...sample.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): StudentRecord[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const snIdx = headers.findIndex((h) => h.includes('student'));
    const nameIdx = headers.findIndex((h) => h.includes('full') || h.includes('name'));
    const courseIdx = headers.findIndex((h) => h.includes('course'));
    const emailIdx = headers.findIndex((h) => h.includes('email'));
    const yearIdx = headers.findIndex((h) => h.includes('year'));

    if (snIdx === -1 || nameIdx === -1 || courseIdx === -1 || emailIdx === -1 || yearIdx === -1) {
      throw new Error('CSV must contain: Student#, Full Name, Course and Section, Email, School Year');
    }

    const out: StudentRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      if (values.length < 5) continue;
      const rec: StudentRecord = {
        student_no: values[snIdx] || '',
        full_name: values[nameIdx] || '',
        course_section: values[courseIdx] || '',
        email: values[emailIdx] || '',
        school_year: values[yearIdx] || '',
      };
      if (!rec.student_no || !rec.full_name || !rec.email) continue;
      out.push(rec);
    }
    return out;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      onUploadError('Please upload a CSV file.');
      return;
    }
    setIsUploading(true);
    try {
      const text = await file.text();
      const records = parseCSV(text);
      if (records.length === 0) throw new Error('No valid records found in CSV');

      const { error } = await supabase.from('students').upsert(records, { onConflict: 'student_no' });
      if (error) throw error;

      onUploadSuccess(records.length);
    } catch (err: any) {
      console.error('Upload error:', err);
      onUploadError(err?.message || 'Failed to process CSV file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="card-hover p-8">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Student Data</h3>
        <p className="text-gray-600 mb-6">Upload a CSV file with student records to bulk import data</p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-red-400 transition-colors cursor-pointer">
          <input type="file" accept=".csv" className="hidden" id="student-csv-upload" onChange={handleFileUpload} disabled={isUploading} />
          <label htmlFor="student-csv-upload" className="cursor-pointer">
            <div className="space-y-3">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <div>
                <span className="text-red-600 font-medium">{isUploading ? 'Processing...' : 'Click to upload'}</span>
                {!isUploading && <span className="text-gray-600"> or drag and drop</span>}
              </div>
              <p className="text-sm text-gray-500">CSV columns: Student#, Full Name, Course and Section, Email, School Year</p>
            </div>
          </label>
        </div>

        <div className="mt-6 flex justify-center space-x-3">
          <button className="btn-primary" disabled={isUploading}>{isUploading ? 'Processing...' : 'Process Upload'}</button>
          <button onClick={downloadTemplate} className="btn-secondary flex items-center space-x-2">
            <Download size={16} />
            <span>Download Template</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCSVUploadSection;

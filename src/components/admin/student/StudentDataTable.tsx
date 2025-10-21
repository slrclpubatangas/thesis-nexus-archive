import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '../../LoadingSpinner';
import type { StudentRecord } from '../StudentData';

interface Props {
  students: StudentRecord[];
  isLoading: boolean;
  sortKey: keyof StudentRecord;
  sortDir: 'asc' | 'desc';
  onSort: (key: keyof StudentRecord) => void;
  onEdit: (student: StudentRecord) => void;
  onDelete: (student: StudentRecord) => void;
}

const headerLabels: { key: keyof StudentRecord; label: string }[] = [
  { key: 'student_no', label: 'Student#' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'course_section', label: 'Course & Section' },
  { key: 'email', label: 'Email' },
  { key: 'school_year', label: 'School Year' },
];

import { Edit, Trash2 } from 'lucide-react';
const StudentDataTable: React.FC<Props> = ({ students, isLoading, sortKey, sortDir, onSort, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="card-hover p-8 text-center">
        <LoadingSpinner size={80} message="Loading student records..." />
      </div>
    );
  }

  return (
    <div className="card-hover overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headerLabels.map(({ key, label }) => (
                <TableHead key={key}>
                  <button
                    className={`flex items-center gap-1 hover:text-gray-900 ${sortKey === key ? 'text-gray-900' : ''}`}
                    onClick={() => onSort(key)}
                    title="Sort"
                  >
                    <span>{label}</span>
                    {sortKey === key && <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((s) => (
                <TableRow key={s.student_no}>
                  <TableCell>
                    <div className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{s.student_no}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900 max-w-xs">{s.full_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{s.course_section}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{s.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{s.school_year}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(s)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit student"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(s)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headerLabels.length} className="text-center text-gray-500 py-8">
                  No student records found. Upload a CSV file to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StudentDataTable;

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
  selectedStudentIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectStudent: (studentId: string, checked: boolean) => void;
}

const headerLabels: { key: keyof StudentRecord; label: string }[] = [
  { key: 'student_no', label: 'Student#' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'course_section', label: 'Course & Section' },
  { key: 'email', label: 'Email' },
  { key: 'school_year', label: 'School Year' },
];

import { Edit, Trash2 } from 'lucide-react';
const StudentDataTable: React.FC<Props> = ({ students, isLoading, sortKey, sortDir, onSort, onEdit, onDelete, selectedStudentIds, onSelectAll, onSelectStudent }) => {
  const allSelected = students.length > 0 && students.every(student => selectedStudentIds.includes(student.student_no));
  const someSelected = selectedStudentIds.length > 0 && !allSelected;
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
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  aria-label="Select all students"
                />
              </TableHead>
              <TableHead className="w-32">Student#</TableHead>
              <TableHead className="w-56">Full Name</TableHead>
              <TableHead className="w-40">Course</TableHead>
              <TableHead className="w-64">Email</TableHead>
              <TableHead className="w-32">School Year</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <div className="overflow-y-auto max-h-[500px]">
          <Table>
            <TableBody>
              {students.length > 0 ? (
                students.map((s) => (
                  <TableRow key={s.student_no}>
                    <TableCell className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.student_no)}
                        onChange={(e) => onSelectStudent(s.student_no, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        aria-label={`Select ${s.full_name}`}
                      />
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{s.student_no}</div>
                    </TableCell>
                    <TableCell className="w-56">
                      <div className="text-sm font-medium text-gray-900">{s.full_name}</div>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="text-sm text-gray-900">{s.course_section}</div>
                    </TableCell>
                    <TableCell className="w-64">
                      <div className="text-sm text-gray-900">{s.email}</div>
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="text-sm text-gray-900">{s.school_year}</div>
                    </TableCell>
                    <TableCell className="w-24">
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
                  <TableCell colSpan={headerLabels.length + 2} className="text-center text-gray-500 py-8">
                    No student records found. Upload a CSV file to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default StudentDataTable;

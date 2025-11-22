import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../LoadingSpinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface ThesisDataTableProps {
  theses: ThesisRecord[];
  isLoading: boolean;
  searchTerm: string;
  onEdit: (thesis: ThesisRecord) => void;
  onDelete: (thesis: ThesisRecord) => void;
  selectedThesisIds: number[];
  onSelectAll: (checked: boolean) => void;
  onSelectThesis: (thesisId: number, checked: boolean) => void;
}

const ThesisDataTable: React.FC<ThesisDataTableProps> = ({
  theses,
  isLoading,
  searchTerm,
  onEdit,
  onDelete,
  selectedThesisIds,
  onSelectAll,
  onSelectThesis
}) => {
  const allSelected = theses.length > 0 && theses.every(thesis => selectedThesisIds.includes(thesis.id));
  const someSelected = selectedThesisIds.length > 0 && !allSelected;
  if (isLoading) {
    return (
      <div className="card-hover p-8 text-center">
        <LoadingSpinner size={80} message="Loading thesis records..." />
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
                  aria-label="Select all theses"
                />
              </TableHead>
              <TableHead className="w-32">Barcode</TableHead>
              <TableHead className="w-auto">Title</TableHead>
              <TableHead className="w-48">Author</TableHead>
              <TableHead className="w-64">Department</TableHead>
              <TableHead className="w-20">Year</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <div className="overflow-y-auto max-h-[500px]">
          <Table>
            <TableBody>
              {theses.length > 0 ? (
                theses.map((thesis) => (
                  <TableRow key={thesis.id}>
                    <TableCell className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedThesisIds.includes(thesis.id)}
                        onChange={(e) => onSelectThesis(thesis.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        aria-label={`Select ${thesis.thesis_title}`}
                      />
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {thesis.barcode}
                      </div>
                    </TableCell>
                    <TableCell className="w-auto">
                      <div className="text-sm font-medium text-gray-900">
                        {thesis.thesis_title}
                      </div>
                    </TableCell>
                    <TableCell className="w-48">
                      <div className="text-sm text-gray-900">
                        {thesis.authors.join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="w-64">
                      <div className="text-sm text-gray-900">
                        {thesis.department}
                      </div>
                    </TableCell>
                    <TableCell className="w-20">
                      <div className="text-sm text-gray-900">
                        {thesis.publication_year}
                      </div>
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => onEdit(thesis)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit thesis"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(thesis)}
                          className="text-red-600 hover:text-red-900" 
                          title="Delete thesis"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    {searchTerm ? 'No matching thesis records found.' : 'No thesis records available. Upload a CSV file to get started.'}
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

export default ThesisDataTable;


import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
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
}

const ThesisDataTable: React.FC<ThesisDataTableProps> = ({
  theses,
  isLoading,
  searchTerm,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <div className="card-hover p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading thesis records...</p>
      </div>
    );
  }

  return (
    <div className="card-hover overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {theses.length > 0 ? (
              theses.map((thesis) => (
                <TableRow key={thesis.id}>
                  <TableCell>
                    <div className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {thesis.barcode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900 max-w-xs">
                      {thesis.thesis_title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {thesis.authors.join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {thesis.department}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {thesis.publication_year}
                    </div>
                  </TableCell>
                  <TableCell>
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
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No matching thesis records found.' : 'No thesis records available. Upload a CSV file to get started.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ThesisDataTable;

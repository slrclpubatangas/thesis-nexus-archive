import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface ThesisRecord {
  id: number;
  barcode: string;
  thesis_title: string;
  authors: string[];
  department: string;
  publication_year: number;
}

interface DeleteThesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  thesis: ThesisRecord | null;
  onConfirm: (id: number) => Promise<void>;
}

const DeleteThesisModal: React.FC<DeleteThesisModalProps> = ({
  isOpen,
  onClose,
  thesis,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!thesis) return;

    setIsDeleting(true);
    try {
      await onConfirm(thesis.id);
      onClose();
    } catch (error) {
      console.error('Error deleting thesis:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!thesis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Thesis Record
          </DialogTitle>
          <DialogDescription className="mt-3 text-gray-600">
            This action cannot be undone. This will permanently delete the thesis record from the database.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Barcode:</span>{' '}
              <span className="font-mono text-blue-600">{thesis.barcode}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Title:</span>{' '}
              <span className="text-gray-900">{thesis.thesis_title}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Author(s):</span>{' '}
              <span className="text-gray-900">{thesis.authors.join(', ')}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Department:</span>{' '}
              <span className="text-gray-900">{thesis.department}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Year:</span>{' '}
              <span className="text-gray-900">{thesis.publication_year}</span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              Are you sure you want to delete this thesis record? This action is permanent and cannot be reversed.
            </p>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Thesis'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteThesisModal;

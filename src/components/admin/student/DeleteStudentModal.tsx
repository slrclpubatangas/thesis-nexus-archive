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
import type { StudentRecord } from '../StudentData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
  onConfirm: () => Promise<void>;
}

const DeleteStudentModal: React.FC<Props> = ({ isOpen, onClose, student, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!student) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting student:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Student Data
          </DialogTitle>
          <DialogDescription className="mt-3 text-gray-600">
            This action cannot be undone. This will permanently delete the student data from the database.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Student#:</span>{' '}
              <span className="font-mono text-blue-600">{student.student_no}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Name:</span>{' '}
              <span className="text-gray-900">{student.full_name}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Course:</span>{' '}
              <span className="text-gray-900">{student.course_section}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Email:</span>{' '}
              <span className="text-gray-900">{student.email}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">School Year:</span>{' '}
              <span className="text-gray-900">{student.school_year}</span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              Are you sure you want to delete this student data? This action is permanent and cannot be reversed.
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
            {isDeleting ? 'Deleting...' : 'Delete Student'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteStudentModal;

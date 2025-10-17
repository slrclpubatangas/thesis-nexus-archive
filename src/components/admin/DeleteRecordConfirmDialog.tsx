import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ThesisSubmission {
  id: string;
  full_name: string;
  user_type: string;
  student_number: string | null;
  school: string | null;
  campus: string;
  program: string | null;
  thesis_title: string;
  submission_date: string;
}

interface DeleteRecordConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: ThesisSubmission | null;
  isDeleting: boolean;
}

const DeleteRecordConfirmDialog: React.FC<DeleteRecordConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  record,
  isDeleting
}) => {
  if (!record) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Permanently Delete Record
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="space-y-4 text-sm text-gray-600">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 mb-1">
                  This action cannot be undone
                </p>
                <p className="text-red-700">
                  The record will be permanently removed from the database and cannot be recovered.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-900 mb-2">Record Details:</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>{' '}
                <span className="text-gray-900">{record.full_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>{' '}
                <span className="text-gray-900">{record.user_type}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  {record.user_type === 'LPU Student' ? 'Student ID:' : 'School:'}
                </span>{' '}
                <span className="text-gray-900">
                  {record.student_number || record.school || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Campus:</span>{' '}
                <span className="text-gray-900">{record.campus}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Thesis:</span>{' '}
                <span className="text-gray-900 line-clamp-2">{record.thesis_title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Submitted:</span>{' '}
                <span className="text-gray-900">
                  {new Date(record.submission_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-center font-medium">
            Are you sure you want to permanently delete this thesis submission record?
          </p>
        </AlertDialogDescription>

        <AlertDialogFooter className="flex gap-3">
          <AlertDialogCancel 
            onClick={onClose} 
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete Permanently</span>
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRecordConfirmDialog;

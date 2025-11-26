import React from 'react';
import { X, User, School, MapPin, Calendar, FileText, GraduationCap, Hash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  created_at: string;
}

interface ViewUserRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ThesisSubmission | null;
}

const ViewUserRecordModal: React.FC<ViewUserRecordModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  if (!isOpen || !record) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const { date, time } = formatDate(record.submission_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">View User Record</DialogTitle>
              <p className="text-sm text-gray-600">Complete thesis submission details</p>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span>Personal Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <p className="text-gray-900 font-medium bg-white p-3 rounded border">
                  {record.full_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <div className="bg-white p-3 rounded border">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    record.user_type === 'LPU Student' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {record.user_type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-gray-600" />
              <span>Academic Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.user_type === 'LPU Student' && record.student_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                    <Hash className="h-4 w-4" />
                    <span>Student Number</span>
                  </label>
                  <p className="text-gray-900 font-mono bg-white p-3 rounded border">
                    {record.student_number}
                  </p>
                </div>
              )}
              {record.user_type === 'Non-LPU Student' && record.school && (
                <div className={record.student_number ? 'md:col-span-1' : 'md:col-span-2'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                    <School className="h-4 w-4" />
                    <span>School/University</span>
                  </label>
                  <p className="text-gray-900 bg-white p-3 rounded border">
                    {record.school}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Campus</span>
                </label>
                <p className="text-gray-900 bg-white p-3 rounded border">
                  {record.campus}
                </p>
              </div>
              {record.program && (
                <div className={!record.student_number && !record.school ? 'md:col-span-2' : 'md:col-span-1'}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program
                  </label>
                  <p className="text-gray-900 bg-white p-3 rounded border">
                    {record.program}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thesis Information Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span>Thesis Information</span>
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thesis Title
              </label>
              <p className="text-gray-900 bg-white p-4 rounded border leading-relaxed">
                {record.thesis_title}
              </p>
            </div>
          </div>

          {/* Submission Information Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span>Submission Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submission Date
                </label>
                <p className="text-gray-900 bg-white p-3 rounded border">
                  {date}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submission Time
                </label>
                <p className="text-gray-900 font-mono bg-white p-3 rounded border">
                  {time}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Record ID
              </label>
              <p className="text-gray-600 font-mono text-sm bg-white p-3 rounded border">
                {record.id}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewUserRecordModal;

import React, { useState } from 'react';
import { X, Edit } from 'lucide-react';
import LoadingSpinner from '../../LoadingSpinner';

interface BulkEditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (updates: {
    full_name?: string;
    course_section?: string;
    email?: string;
    school_year?: string;
  }) => Promise<void>;
}

const BulkEditStudentModal: React.FC<BulkEditStudentModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    course_section: '',
    email: '',
    school_year: '',
  });
  const [fieldsToUpdate, setFieldsToUpdate] = useState({
    full_name: false,
    course_section: false,
    email: false,
    school_year: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build updates object with only selected fields
    const updates: any = {};
    if (fieldsToUpdate.full_name && formData.full_name.trim()) {
      updates.full_name = formData.full_name.trim();
    }
    if (fieldsToUpdate.course_section && formData.course_section.trim()) {
      updates.course_section = formData.course_section.trim();
    }
    if (fieldsToUpdate.email && formData.email.trim()) {
      updates.email = formData.email.trim();
    }
    if (fieldsToUpdate.school_year && formData.school_year.trim()) {
      updates.school_year = formData.school_year.trim();
    }

    // Check if at least one field is selected
    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(updates);
      // Reset form
      setFormData({
        full_name: '',
        course_section: '',
        email: '',
        school_year: '',
      });
      setFieldsToUpdate({
        full_name: false,
        course_section: false,
        email: false,
        school_year: false,
      });
      onClose();
    } catch (error) {
      console.error('Error in bulk edit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setFormData({
      full_name: '',
      course_section: '',
      email: '',
      school_year: '',
    });
    setFieldsToUpdate({
      full_name: false,
      course_section: false,
      email: false,
      school_year: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg sm:rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit className="h-6 w-6 text-red-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              Bulk Edit Student Data
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute right-6 top-6 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>{selectedCount} student record(s)</strong> selected. Select the
                fields you want to update and provide new values. Only checked fields will
                be updated for all selected students.
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="update_full_name"
                  checked={fieldsToUpdate.full_name}
                  onChange={(e) =>
                    setFieldsToUpdate({ ...fieldsToUpdate, full_name: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="update_full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!fieldsToUpdate.full_name}
                    placeholder="Enter new full name"
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Course/Section */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="update_course_section"
                  checked={fieldsToUpdate.course_section}
                  onChange={(e) =>
                    setFieldsToUpdate({ ...fieldsToUpdate, course_section: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="update_course_section" className="block text-sm font-medium text-gray-700 mb-1">
                    Course/Section
                  </label>
                  <input
                    type="text"
                    value={formData.course_section}
                    onChange={(e) => setFormData({ ...formData, course_section: e.target.value })}
                    disabled={!fieldsToUpdate.course_section}
                    placeholder="e.g., BSIT-3A"
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="update_email"
                  checked={fieldsToUpdate.email}
                  onChange={(e) =>
                    setFieldsToUpdate({ ...fieldsToUpdate, email: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="update_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!fieldsToUpdate.email}
                    placeholder="Enter new email"
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* School Year */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="update_school_year"
                  checked={fieldsToUpdate.school_year}
                  onChange={(e) =>
                    setFieldsToUpdate({ ...fieldsToUpdate, school_year: e.target.checked })
                  }
                  className="mt-1 h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="update_school_year" className="block text-sm font-medium text-gray-700 mb-1">
                    School Year
                  </label>
                  <input
                    type="text"
                    value={formData.school_year}
                    onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                    disabled={!fieldsToUpdate.school_year}
                    placeholder="e.g., 2025-2026"
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Most commonly updated when students advance to the next school year
                  </p>
                </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size={16} />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit size={16} />
                  <span>Update Selected</span>
                </>
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkEditStudentModal;
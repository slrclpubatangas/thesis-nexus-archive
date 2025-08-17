import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface EditUserRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ThesisSubmission | null;
  onSave: (updatedRecord: Partial<ThesisSubmission>) => Promise<void>;
}

// Campus options based on common LPU campuses
const CAMPUS_OPTIONS = [
  'Manila',
  'Batangas',
  'Cavite',
  'Laguna',
  'Makati',
  'Intramuros',
  'Online'
];

// User type options
const USER_TYPE_OPTIONS = [
  'LPU Student',
  'Non-LPU Student'
];

const EditUserRecordModal: React.FC<EditUserRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    user_type: 'LPU Student',
    student_number: '',
    school: '',
    campus: '',
    program: '',
    thesis_title: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({
        full_name: record.full_name || '',
        user_type: record.user_type || 'LPU Student',
        student_number: record.student_number || '',
        school: record.school || '',
        campus: record.campus || '',
        program: record.program || '',
        thesis_title: record.thesis_title || '',
      });
    }
  }, [record]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setIsSubmitting(true);
    try {
      // Clean the data based on user type
      const cleanedData = {
        id: record.id,
        full_name: formData.full_name.trim(),
        user_type: formData.user_type,
        campus: formData.campus,
        thesis_title: formData.thesis_title.trim(),
        // Conditionally include fields based on user type
        student_number: formData.user_type === 'LPU Student' ? formData.student_number.trim() || null : null,
        school: formData.user_type === 'Non-LPU Student' ? formData.school.trim() || null : null,
        program: formData.program.trim() || null,
      };

      await onSave(cleanedData);
      onClose();
    } catch (error) {
      console.error('Error updating user record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (record) {
      setFormData({
        full_name: record.full_name || '',
        user_type: record.user_type || 'LPU Student',
        student_number: record.student_number || '',
        school: record.school || '',
        campus: record.campus || '',
        program: record.program || '',
        thesis_title: record.thesis_title || '',
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Record</DialogTitle>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              placeholder="Enter full name"
            />
          </div>

          {/* User Type */}
          <div className="space-y-2">
            <Label htmlFor="user_type">User Type *</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value) => handleSelectChange('user_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields based on User Type */}
          {formData.user_type === 'LPU Student' ? (
            <div className="space-y-2">
              <Label htmlFor="student_number">Student Number</Label>
              <Input
                id="student_number"
                name="student_number"
                value={formData.student_number}
                onChange={handleInputChange}
                placeholder="Enter student number"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                placeholder="Enter school name"
              />
            </div>
          )}

          {/* Campus */}
          <div className="space-y-2">
            <Label htmlFor="campus">Campus *</Label>
            <Select
              value={formData.campus}
              onValueChange={(value) => handleSelectChange('campus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                {CAMPUS_OPTIONS.map((campus) => (
                  <SelectItem key={campus} value={campus}>
                    {campus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Program */}
          <div className="space-y-2">
            <Label htmlFor="program">Program</Label>
            <Input
              id="program"
              name="program"
              value={formData.program}
              onChange={handleInputChange}
              placeholder="Enter program (e.g., BS Computer Science)"
            />
          </div>

          {/* Thesis Title */}
          <div className="space-y-2">
            <Label htmlFor="thesis_title">Thesis Title *</Label>
            <Textarea
              id="thesis_title"
              name="thesis_title"
              value={formData.thesis_title}
              onChange={handleInputChange}
              rows={3}
              required
              placeholder="Enter thesis title"
            />
          </div>

          {/* Submission Date (Read-only) */}
          <div className="space-y-2">
            <Label>Submission Date</Label>
            <Input
              value={new Date(record.submission_date).toLocaleString()}
              disabled
              className="bg-gray-100"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserRecordModal;
